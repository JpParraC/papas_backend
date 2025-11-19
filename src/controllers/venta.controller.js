import db from "../db/index.js";

// Obtener todas las ventas con cliente
export async function getVentas(req, res) {
  try {
    const query = `
      SELECT v.TB_IDVENTA, v.TB_IDCLIEN, c.TMA_NOMBREC AS cliente,
             v.TB_FECHVENT, v.TB_TOTALVEN, v.TB_ESTADVEN
      FROM TB_VENTAS v
      JOIN BDTMA_CLIENTE c ON v.TB_IDCLIEN = c.TMA_IDCLIEN
      ORDER BY v.TB_IDVENTA ASC
    `;
    const { rows } = await db.query(query);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo ventas" });
  }
}

// Crear venta
export async function createVenta(req, res) {
  try {
    const { idCliente, total, estado } = req.body;

    const query = `
      INSERT INTO TB_VENTAS
      (TB_IDCLIEN, TB_FECHVENT, TB_TOTALVEN, TB_ESTADVEN)
      VALUES ($1, NOW(), $2, $3)
      RETURNING *;
    `;

    const values = [idCliente, total, estado];
    const { rows } = await db.query(query, values);

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error creando venta" });
  }
}

// Actualizar venta
export async function updateVenta(req, res) {
  try {
    const { id } = req.params;
    const { idCliente, total, estado } = req.body;

    const query = `
      UPDATE TB_VENTAS
      SET TB_IDCLIEN = $1,
          TB_TOTALVEN = $2,
          TB_ESTADVEN = $3
      WHERE TB_IDVENTA = $4
      RETURNING *;
    `;

    const values = [idCliente, total, estado, id];
    const { rows } = await db.query(query, values);

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error actualizando venta" });
  }
}

// Eliminar venta
export async function deleteVenta(req, res) {
  try {
    const { id } = req.params;

    // Primero eliminar detalles de venta
    await db.query(`DELETE FROM TB_DETVENT WHERE TB_IDVENTA = $1`, [id]);

    // Luego eliminar la venta
    await db.query(`DELETE FROM TB_VENTAS WHERE TB_IDVENTA = $1`, [id]);

    res.json({ message: "Venta eliminada correctamente" });
  } catch (err) {
    res.status(500).json({ error: "Error eliminando venta" });
  }
}
