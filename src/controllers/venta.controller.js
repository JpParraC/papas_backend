// src/controllers/venta.controller.js
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
    console.error(error);
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
      SELECT v.*,
             c.tma_nombrec AS cliente
      FROM tb_ventas v
      JOIN bdtma_cliente c ON v.tb_idclien = c.tma_idclien
      WHERE v.tb_idventa = $1
    `;
    const detalleQuery = `
      SELECT d.*,
             p.tma_nombrep AS nombre_producto
      FROM tb_detvent d
      JOIN bdtma_produc p ON d.tb_idprodu = p.tma_idprodu
      WHERE d.tb_idventa = $1
      ORDER BY d.tb_iddetve;
    `;

    const ventaResult = await db.query(ventaQuery, [id]);
    if (!ventaResult.rows.length) {
      return res.status(404).json({ error: "Venta no encontrada" });
    }

    const detallesResult = await db.query(detalleQuery, [id]);

    res.json({
      ...ventaResult.rows[0],
      detalles: detallesResult.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo venta" });
  }
}

/* ===========================
   CREAR VENTA + DETALLES
=========================== */
export async function createVenta(req, res) {
  const client = await db.pool.connect();
  try {
    const { idCliente, estado, detalles } = req.body;

    if (!idCliente || !Array.isArray(detalles) || detalles.length === 0) {
      return res.status(400).json({ error: "Faltan datos de venta o detalles" });
    }

    await client.query("BEGIN");

    // Asegurar números válidos
    const detallesValidos = detalles.map(d => ({
      idProducto: Number(d.idProducto) || 0,
      cantidad: Number(d.cantidad) || 0,
      precio: Number(d.precio) || 0
    }));

    const total = detallesValidos.reduce((acc, d) => acc + d.cantidad * d.precio, 0);

    const ventaQuery = `
      INSERT INTO tb_ventas (tb_idclien, tb_fechvent, tb_totalven, tb_estadven)
      VALUES ($1, NOW(), $2, $3)
      RETURNING tb_idventa;
    `;
    const ventaResult = await client.query(ventaQuery, [idCliente, total, estado]);
    const idVenta = ventaResult.rows[0].tb_idventa;

    const detalleQuery = `
      INSERT INTO tb_detvent (tb_idventa, tb_idprodu, tb_cantida, tb_precuni, tb_subtota)
      VALUES ($1, $2, $3, $4, $5);
    `;
    for (const d of detallesValidos) {
      await client.query(detalleQuery, [
        idVenta,
        d.idProducto,
        d.cantidad,
        d.precio,
        d.cantidad * d.precio
      ]);
    }

    await client.query("COMMIT");

    res.status(201).json({ message: "Venta creada correctamente", idVenta });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("ERROR createVenta:", error);
    res.status(500).json({ error: "Error creando venta" });
  } finally {
    client.release();
  }
}

/* ===========================
   ACTUALIZAR VENTA + DETALLES
=========================== */
export async function updateVenta(req, res) {
  const client = await db.pool.connect();
  try {
    const { id } = req.params;
    const { estado, detalles } = req.body;

    if (!Array.isArray(detalles) || detalles.length === 0) {
      return res.status(400).json({ error: "Faltan detalles para actualizar" });
    }

    await client.query("BEGIN");

    // Validar y convertir a números
    const detallesValidos = detalles.map(d => ({
      idProducto: Number(d.idProducto) || 0,
      cantidad: Number(d.cantidad) || 0,
      precio: Number(d.precio) || 0
    }));

    const total = detallesValidos.reduce((acc, d) => acc + d.cantidad * d.precio, 0);

    // Actualizar estado y total
    const updateVentaQuery = `
      UPDATE tb_ventas
      SET tb_estadven=$1,
          tb_totalven=$2
      WHERE tb_idventa=$3
      RETURNING *;
    `;
    const ventaActualizada = await client.query(updateVentaQuery, [estado, total, id]);
    if (!ventaActualizada.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Venta no encontrada" });
    }

    // Eliminar detalles anteriores
    await client.query(`DELETE FROM tb_detvent WHERE tb_idventa=$1`, [id]);

    // Insertar nuevos detalles
    const detalleQuery = `
      INSERT INTO tb_detvent (tb_idventa, tb_idprodu, tb_cantida, tb_precuni, tb_subtota)
      VALUES ($1, $2, $3, $4, $5);
    `;
    for (const d of detallesValidos) {
      await client.query(detalleQuery, [
        id,
        d.idProducto,
        d.cantidad,
        d.precio,
        d.cantidad * d.precio
      ]);
    }

    await client.query("COMMIT");

    res.json({ message: "Venta actualizada correctamente", venta: ventaActualizada.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("ERROR updateVenta:", error);
    res.status(500).json({ error: "Error actualizando venta" });
  } finally {
    client.release();
  }
}

/* ===========================
   ELIMINAR VENTA
=========================== */
export async function deleteVenta(req, res) {
  const client = await db.pool.connect();
  try {
    const { id } = req.params;

    await client.query("BEGIN");

    await client.query("DELETE FROM tb_detvent WHERE tb_idventa=$1", [id]);
    await client.query("DELETE FROM tb_ventas WHERE tb_idventa=$1", [id]);

    await client.query("COMMIT");

    res.json({ message: "Venta eliminada correctamente" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("ERROR deleteVenta:", error);
    res.status(500).json({ error: "Error eliminando venta" });
  } finally {
    client.release();
  }
}
