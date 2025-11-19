import db from "../db/index.js";

// Obtener todo el inventario
export async function getInventario(req, res) {
  try {
    const query = `
      SELECT i.TB_IDINVEN, i.TB_IDPRODU, p.TMA_NOMBREP, i.TB_CANTIDIS, i.TB_FECHULT
      FROM TB_INVINVEN i
      JOIN BDTMA_PRODUC p ON i.TB_IDPRODU = p.TMA_IDPRODU
      ORDER BY i.TB_IDINVEN ASC
    `;
    const { rows } = await db.query(query);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo inventario" });
  }
}

// Crear entrada en inventario
export async function createInventario(req, res) {
  try {
    const { idProducto, cantidad } = req.body;

    const query = `
      INSERT INTO TB_INVINVEN (TB_IDPRODU, TB_CANTIDIS, TB_FECHULT)
      VALUES ($1, $2, NOW())
      RETURNING *;
    `;
    const values = [idProducto, cantidad];
    const { rows } = await db.query(query, values);

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error creando inventario" });
  }
}

// Actualizar inventario
export async function updateInventario(req, res) {
  try {
    const { id } = req.params;
    const { cantidad } = req.body;

    const query = `
      UPDATE TB_INVINVEN
      SET TB_CANTIDIS = $1, TB_FECHULT = NOW()
      WHERE TB_IDINVEN = $2
      RETURNING *;
    `;

    const values = [cantidad, id];
    const { rows } = await db.query(query, values);

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error actualizando inventario" });
  }
}

// Eliminar registro de inventario
export async function deleteInventario(req, res) {
  try {
    const { id } = req.params;

    await db.query(
      `DELETE FROM TB_INVINVEN WHERE TB_IDINVEN = $1`,
      [id]
    );

    res.json({ message: "Registro de inventario eliminado" });
  } catch (err) {
    res.status(500).json({ error: "Error eliminando inventario" });
  }
}
