// controllers/inventario.controller.js
import db from "../db/index.js";

export async function getInventario(req, res) {
  try {
    const query = `
      SELECT 
        s.producto_id,
        p.tma_nombrep AS producto,
        s.cantidad AS cantidad_disponible,
        s.fecha_actualizacion AS fecha_ultima_actualizacion
      FROM tb_stock s
      LEFT JOIN bdtma_produc p
        ON p.tma_idprodu = s.producto_id
      ORDER BY p.tma_nombrep ASC
    `;
    const { rows } = await db.query(query);
    res.json(rows);
  } catch (err) {
    console.error("Error obteniendo inventario:", err);
    res.status(500).json({ error: "Error obteniendo inventario" });
  }
}
