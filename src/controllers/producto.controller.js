import db from "../db/index.js";

// Obtener todos los productos
export async function getProductos(req, res) {
  try {
    const query = `SELECT * FROM BDTMA_PRODUC ORDER BY TMA_IDPRODU ASC`;
    const { rows } = await db.query(query);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo productos" });
  }
}

// Crear producto
export async function createProducto(req, res) {
  try {
    const { nombre, descripcion, unidad, precio, stock } = req.body;

    const query = `
      INSERT INTO BDTMA_PRODUC
      (TMA_NOMBREP, TMA_DESCRIP, TMA_UNIDADE, TMA_PRECIOU, TMA_STOCKMI)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;

    const values = [nombre, descripcion, unidad, precio, stock];
    const { rows } = await db.query(query, values);

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error creando producto" });
  }
}

// Actualizar producto
export async function updateProducto(req, res) {
  try {
    const { id } = req.params;
    const { nombre, descripcion, unidad, precio, stock } = req.body;

    const query = `
      UPDATE BDTMA_PRODUC
      SET TMA_NOMBREP = $1,
          TMA_DESCRIP = $2,
          TMA_UNIDADE = $3,
          TMA_PRECIOU = $4,
          TMA_STOCKMI = $5
      WHERE TMA_IDPRODU = $6
      RETURNING *;
    `;

    const values = [nombre, descripcion, unidad, precio, stock, id];
    const { rows } = await db.query(query, values);

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error actualizando producto" });
  }
}

// Eliminar producto
export async function deleteProducto(req, res) {
  try {
    const { id } = req.params;

    await db.query(
      `DELETE FROM BDTMA_PRODUC WHERE TMA_IDPRODU = $1`,
      [id]
    );

    res.json({ message: "Producto eliminado" });
  } catch (err) {
    res.status(500).json({ error: "Error eliminando producto" });
  }
}
