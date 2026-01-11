import db from "../db/index.js";
import PDFDocument from "pdfkit";

/* ===========================
   OBTENER TODAS LAS VENTAS
=========================== */
export async function getVentas(req, res) {
  try {
    const { rows } = await db.query(`
      SELECT v.tb_idventa,
             v.tb_idclien,
             c.tma_nombrec AS cliente,
             v.tb_fechvent,
             v.tb_totalven,
             v.tb_estadven
      FROM tb_ventas v
      JOIN bdtma_cliente c ON v.tb_idclien = c.tma_idclien
      ORDER BY v.tb_idventa;
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo ventas" });
  }
}

/* ===========================
   OBTENER VENTA POR ID
=========================== */
export async function getVentaById(req, res) {
  try {
    const { id } = req.params;

    const venta = await db.query(`
      SELECT v.*, c.tma_nombrec AS cliente
      FROM tb_ventas v
      JOIN bdtma_cliente c ON v.tb_idclien = c.tma_idclien
      WHERE v.tb_idventa=$1
    `, [id]);

    if (!venta.rows.length) {
      return res.status(404).json({ error: "Venta no encontrada" });
    }

    const detalles = await db.query(`
      SELECT d.*, p.tma_nombrep AS nombre_producto
      FROM tb_detvent d
      JOIN bdtma_produc p ON d.tb_idprodu = p.tma_idprodu
      WHERE d.tb_idventa=$1
      ORDER BY d.tb_iddetve
    `, [id]);

    res.json({
      ...venta.rows[0],
      detalles: detalles.rows
    });
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo venta" });
  }
}

/* ===========================
   CREAR VENTA + INVENTARIO
=========================== */
export async function createVenta(req, res) {
  const client = await db.pool.connect();
  try {
    const { idCliente, estado, detalles } = req.body;

    if (!idCliente || !Array.isArray(detalles) || !detalles.length) {
      return res.status(400).json({ error: "Datos incompletos" });
    }

    await client.query("BEGIN");

    const detallesValidos = detalles.map(d => ({
      idProducto: Number(d.idProducto),
      cantidad: Number(d.cantidad),
      precio: Number(d.precio)
    }));

    // VALIDAR STOCK
    for (const d of detallesValidos) {
      const stock = await client.query(
        "SELECT cantidad FROM tb_stock WHERE producto_id=$1",
        [d.idProducto]
      );
      if (!stock.rows.length || stock.rows[0].cantidad < d.cantidad) {
        throw new Error(`Stock insuficiente producto ${d.idProducto}`);
      }
    }

    const total = detallesValidos.reduce(
      (acc, d) => acc + d.cantidad * d.precio, 0
    );

    const ventaRes = await client.query(`
      INSERT INTO tb_ventas (tb_idclien, tb_fechvent, tb_totalven, tb_estadven)
      VALUES ($1, NOW(), $2, $3)
      RETURNING tb_idventa
    `, [idCliente, total, estado]);

    const idVenta = ventaRes.rows[0].tb_idventa;

    for (const d of detallesValidos) {
      await client.query(`
        INSERT INTO tb_detvent
        (tb_idventa, tb_idprodu, tb_cantida, tb_precuni, tb_subtota)
        VALUES ($1,$2,$3,$4,$5)
      `, [idVenta, d.idProducto, d.cantidad, d.precio, d.cantidad * d.precio]);

      // MOVIMIENTO
      await client.query(`
        INSERT INTO tb_movstock
        (producto_id, tipo, modulo, cantidad, referencia_id, fecha)
        VALUES ($1,'SALIDA','VENTA',$2,$3,NOW())
      `, [d.idProducto, d.cantidad, idVenta]);

      // DESCONTAR STOCK
      await client.query(`
        UPDATE tb_stock
        SET cantidad = cantidad - $1
        WHERE producto_id=$2
      `, [d.cantidad, d.idProducto]);
    }

    await client.query("COMMIT");
    res.status(201).json({ message: "Venta creada", idVenta });

  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
}

/* ===========================
   ACTUALIZAR VENTA + INVENTARIO
=========================== */
export async function updateVenta(req, res) {
  const client = await db.pool.connect();
  try {
    const { id } = req.params;
    const { estado, detalles } = req.body;

    await client.query("BEGIN");

    // DEVOLVER STOCK ANTERIOR
    const oldDet = await client.query(
      "SELECT tb_idprodu, tb_cantida FROM tb_detvent WHERE tb_idventa=$1",
      [id]
    );

    for (const d of oldDet.rows) {
      await client.query(
        "UPDATE tb_stock SET cantidad = cantidad + $1 WHERE producto_id=$2",
        [d.tb_cantida, d.tb_idprodu]
      );
    }

    await client.query(
      "DELETE FROM tb_movstock WHERE modulo='VENTA' AND referencia_id=$1",
      [id]
    );

    await client.query("DELETE FROM tb_detvent WHERE tb_idventa=$1", [id]);

    const detallesValidos = detalles.map(d => ({
      idProducto: Number(d.idProducto),
      cantidad: Number(d.cantidad),
      precio: Number(d.precio)
    }));

    const total = detallesValidos.reduce(
      (acc, d) => acc + d.cantidad * d.precio, 0
    );

    await client.query(`
      UPDATE tb_ventas
      SET tb_estadven=$1, tb_totalven=$2
      WHERE tb_idventa=$3
    `, [estado, total, id]);

    for (const d of detallesValidos) {
      await client.query(`
        INSERT INTO tb_detvent
        (tb_idventa, tb_idprodu, tb_cantida, tb_precuni, tb_subtota)
        VALUES ($1,$2,$3,$4,$5)
      `, [id, d.idProducto, d.cantidad, d.precio, d.cantidad * d.precio]);

      await client.query(`
        INSERT INTO tb_movstock
        (producto_id, tipo, modulo, cantidad, referencia_id, fecha)
        VALUES ($1,'SALIDA','VENTA',$2,$3,NOW())
      `, [d.idProducto, d.cantidad, id]);

      await client.query(`
        UPDATE tb_stock
        SET cantidad = cantidad - $1
        WHERE producto_id=$2
      `, [d.cantidad, d.idProducto]);
    }

    await client.query("COMMIT");
    res.json({ message: "Venta actualizada" });

  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
}

/* ===========================
   ELIMINAR VENTA + INVENTARIO
=========================== */
export async function deleteVenta(req, res) {
  const client = await db.pool.connect();
  try {
    const { id } = req.params;

    await client.query("BEGIN");

    const detalles = await client.query(
      "SELECT tb_idprodu, tb_cantida FROM tb_detvent WHERE tb_idventa=$1",
      [id]
    );

    for (const d of detalles.rows) {
      await client.query(
        "UPDATE tb_stock SET cantidad = cantidad + $1 WHERE producto_id=$2",
        [d.tb_cantida, d.tb_idprodu]
      );
    }

    await client.query(
      "DELETE FROM tb_movstock WHERE modulo='VENTA' AND referencia_id=$1",
      [id]
    );

    await client.query("DELETE FROM tb_detvent WHERE tb_idventa=$1", [id]);
    await client.query("DELETE FROM tb_ventas WHERE tb_idventa=$1", [id]);

    await client.query("COMMIT");
    res.json({ message: "Venta eliminada" });

  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
}

/* ===========================
   FACTURA PDF
=========================== */
export async function printFacturaPDF(req, res) {
  try {
    const { id } = req.params;

    const ventaQuery = `
      SELECT v.*, c.tma_nombrec AS cliente
      FROM tb_ventas v
      JOIN bdtma_cliente c ON v.tb_idclien = c.tma_idclien
      WHERE v.tb_idventa = $1
    `;

    const detalleQuery = `
      SELECT d.*, p.tma_nombrep AS nombre_producto
      FROM tb_detvent d
      JOIN bdtma_produc p ON d.tb_idprodu = p.tma_idprodu
      WHERE d.tb_idventa = $1
    `;

    const ventaResult = await db.query(ventaQuery, [id]);
    if (!ventaResult.rows.length) {
      return res.status(404).json({ error: "Venta no encontrada" });
    }

    const detallesResult = await db.query(detalleQuery, [id]);

    const venta = ventaResult.rows[0];
    const detalles = detallesResult.rows;

    const doc = new PDFDocument({ margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=factura_${venta.tb_idventa}.pdf`
    );

    doc.pipe(res);

    doc.fontSize(18).text("FACTURA", { align: "center" }).moveDown();
    doc.fontSize(10);
    doc.text(`Factura Nº: ${venta.tb_idventa}`);
    doc.text(`Fecha: ${venta.tb_fechvent}`);
    doc.text(`Cliente: ${venta.cliente}`);
    doc.text(`Estado: ${venta.tb_estadven}`);
    doc.moveDown();

    doc.fontSize(11).text("Detalle de productos", { underline: true });
    doc.moveDown(0.5);

    let total = 0;
    detalles.forEach(d => {
      doc.text(
        `${d.nombre_producto} | Cant: ${d.tb_cantida} | $${d.tb_precuni} | Sub: $${d.tb_subtota}`
      );
      total += Number(d.tb_subtota);
    });

    doc.moveDown();
    doc.font("Helvetica-Bold");
    doc.text(`TOTAL: $${total.toFixed(2)}`, { align: "right" });

    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error generando PDF" });
  }
}
