import db from "../db/index.js";

/* ===========================
   OBTENER TODAS LAS VENTAS
=========================== */
export async function getVentas(req, res) {
  try {
    const query = `
      SELECT v.tb_idventa,
             v.tb_idclien,
             c.tma_nombrec AS cliente,
             v.tb_fechvent,
             v.tb_totalven,
             v.tb_estadven
      FROM tb_ventas v
      JOIN bdtma_cliente c ON v.tb_idclien = c.tma_idclien
      ORDER BY v.tb_idventa ASC;
    `;
    const { rows } = await db.query(query);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo ventas" });
  }
}

/* ===========================
   OBTENER VENTA CON DETALLES
=========================== */
export async function getVentaById(req, res) {
  try {
    const { id } = req.params;

    const ventaQuery = `
      SELECT * FROM tb_ventas WHERE tb_idventa = $1
    `;
    const detalleQuery = `
      SELECT * FROM tb_detvent WHERE tb_idventa = $1
    `;

    const venta = await db.query(ventaQuery, [id]);
    const detalles = await db.query(detalleQuery, [id]);

    if (venta.rows.length === 0) {
      return res.status(404).json({ error: "Venta no encontrada" });
    }

    res.json({
      ...venta.rows[0],
      detalles: detalles.rows
    });
  } catch (error) {
    res.status(500).json({ error: "Error obteniendo venta" });
  }
}

/* ===========================
   CREAR VENTA + DETALLES
=========================== */
export async function createVenta(req, res) {
  const client = await db.connect();

  try {
    const { idCliente, estado, detalles } = req.body;

    await client.query("BEGIN");

    let total = 0;
    detalles.forEach(d => {
      total += d.cantidad * d.precio;
    });

    const ventaQuery = `
      INSERT INTO tb_ventas
      (tb_idclien, tb_fechvent, tb_totalven, tb_estadven)
      VALUES ($1, NOW(), $2, $3)
      RETURNING tb_idventa;
    `;

    const ventaResult = await client.query(ventaQuery, [
      idCliente,
      total,
      estado
    ]);

    const idVenta = ventaResult.rows[0].tb_idventa;

    const detalleQuery = `
      INSERT INTO tb_detvent
      (tb_idventa, tb_idprodu, tb_cantida, tb_precuni, tb_subtota)
      VALUES ($1, $2, $3, $4, $5);
    `;

    for (const d of detalles) {
      const subtotal = d.cantidad * d.precio;
      await client.query(detalleQuery, [
        idVenta,
        d.idProducto,
        d.cantidad,
        d.precio,
        subtotal
      ]);
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Venta creada correctamente",
      idVenta
    });

  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Error creando venta" });
  } finally {
    client.release();
  }
}

/* ===========================
   ACTUALIZAR ESTADO DE VENTA
=========================== */
export async function updateVenta(req, res) {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const query = `
      UPDATE tb_ventas
      SET tb_estadven = $1
      WHERE tb_idventa = $2
      RETURNING *;
    `;

    const { rows } = await db.query(query, [estado, id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Venta no encontrada" });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error actualizando venta" });
  }
}

/* ===========================
   ELIMINAR VENTA
=========================== */
export async function deleteVenta(req, res) {
  const client = await db.connect();

  try {
    const { id } = req.params;

    await client.query("BEGIN");

    await client.query(
      "DELETE FROM tb_detvent WHERE tb_idventa = $1",
      [id]
    );

    await client.query(
      "DELETE FROM tb_ventas WHERE tb_idventa = $1",
      [id]
    );

    await client.query("COMMIT");

    res.json({ message: "Venta eliminada correctamente" });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Error eliminando venta" });
  } finally {
    client.release();
  }
}
