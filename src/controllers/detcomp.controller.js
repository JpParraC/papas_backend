import db from "../db/index.js";

// Obtener detalles de una compra específica
export async function getDetCompras(req, res) {
  try {
    const { compraId } = req.params;

    const query = `
      SELECT d.TB_IDDETCO, d.TB_IDCOMPR, d.TB_IDPRODU, p.TMA_NOMBREP,
             d.TB_CANTIDAD, d.TB_PRECUNIC, d.TB_SUBTOTAL
      FROM TB_DETCOMP d
      JOIN BDTMA_PRODUC p ON d.TB_IDPRODU = p.TMA_IDPRODU
      WHERE d.TB_IDCOMPR = $1
      ORDER BY d.TB_IDDETCO ASC
    `;
    const { rows } = await db.query(query, [compraId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo detalles de compra" });
  }
}

// Crear detalle de compra
export async function createDetCompra(req, res) {
  try {
    const { idCompra, idProducto, cantidad, precioUnitario } = req.body;
    const subtotal = cantidad * precioUnitario;

    const query = `
      INSERT INTO TB_DETCOMP
      (TB_IDCOMPR, TB_IDPRODU, TB_CANTIDAD, TB_PRECUNIC, TB_SUBTOTAL)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;

    const values = [idCompra, idProducto, cantidad, precioUnitario, subtotal];
    const { rows } = await db.query(query, values);

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error creando detalle de compra" });
  }
}

// Actualizar detalle de compra
export async function updateDetCompra(req, res) {
  try {
    const { id } = req.params;
    const { cantidad, precioUnitario } = req.body;
    const subtotal = cantidad * precioUnitario;

    const query = `
      UPDATE TB_DETCOMP
      SET TB_CANTIDAD = $1,
          TB_PRECUNIC = $2,
          TB_SUBTOTAL = $3
      WHERE TB_IDDETCO = $4
      RETURNING *;
    `;

    const values = [cantidad, precioUnitario, subtotal, id];
    const { rows } = await db.query(query, values);

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error actualizando detalle de compra" });
  }
}

// Eliminar detalle de compra
export async function deleteDetCompra(req, res) {
  try {
    const { id } = req.params;

    await db.query(
      `DELETE FROM TB_DETCOMP WHERE TB_IDDETCO = $1`,
      [id]
    );

    res.json({ message: "Detalle de compra eliminado" });
  } catch (err) {
    res.status(500).json({ error: "Error eliminando detalle de compra" });
  }
}
