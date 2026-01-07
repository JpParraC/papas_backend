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
      const { nombre, descripcion, unidad, precio, stock, tipo } = req.body;

      const query = `
        INSERT INTO BDTMA_PRODUC
        (TMA_NOMBREP, TMA_DESCRIP, TMA_UNIDADE, TMA_PRECIOU, TMA_STOCKMI, TMA_TIPO)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
      `;

      const values = [nombre, descripcion, unidad, precio, stock, tipo];
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
      const { nombre, descripcion, unidad, precio, stock, tipo } = req.body;

      const query = `
        UPDATE BDTMA_PRODUC
        SET TMA_NOMBREP = $1,
            TMA_DESCRIP = $2,
            TMA_UNIDADE = $3,
            TMA_PRECIOU = $4,
            TMA_STOCKMI = $5,
            TMA_TIPO = $6
        WHERE TMA_IDPRODU = $7
        RETURNING *;
      `;

      const values = [nombre, descripcion, unidad, precio, stock, tipo, id];
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

  // Obtener solo productos de cosecha
export async function getProductosCosecha(req, res) {
  try {
    const query = `
      SELECT 
        TMA_IDPRODU   AS id,
        TMA_NOMBREP   AS nombre,
        TMA_PRECIOU   AS precio,
        TMA_TIPO      AS tipo
      FROM BDTMA_PRODUC
      WHERE UPPER(TMA_TIPO) = 'COSECHA'
      ORDER BY TMA_NOMBREP ASC
    `

    const { rows } = await db.query(query)
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo productos de cosecha" })
  }
}
  