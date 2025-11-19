import db from "../db/index.js";

// Obtener detalles de una venta específica
export async function getDetVentas(req, res) {
  try {
    const { ventaId } = req.params;

    const query = `
      SELECT d.TB_IDDETVE, d.TB_IDVENTA, d.TB_IDPRODU, p.TMA_NOMBREP,
             d.TB_CANTIDA, d.TB_PRECUNI, d.TB_SUBTOTA
      FROM TB_DETVENT d
      JOIN BDTMA_PRODUC p ON d.TB_IDPRODU = p.TMA_IDPRODU
      WHERE d.TB_IDVENTA = $1
      ORDER BY d.TB_IDDETVE ASC
    `;
    const { rows } = await db.query(query, [ventaId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo detalles de venta" });
  }
}

// Crear detalle de venta
export async function createDetVenta(req, res) {
  try {
    const { idVenta, idProducto, cantidad, precioUnitario } = req.body;
    const subtotal = cantidad * precioUnitario;

    const query = `
      INSERT INTO TB_DETVENT
      (TB_IDVENTA, TB_IDPRODU, TB_CANTIDA, TB_PRECUNI, TB_SUBTOTA)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;

    const values = [idVenta, idProducto, cantidad, precioUnitario, subtotal];
    const { rows } = await db.query(query, values);

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error creando detalle de venta" });
  }
}

// Actualizar detalle de venta
export async function updateDetVenta(req, res) {
  try {
    const { id } = req.params;
    const { cantidad, precioUnitario } = req.body;
    const subtotal = cantidad * precioUnitario;

    const query = `
      UPDATE TB_DETVENT
      SET TB_CANTIDA = $1,
          TB_PRECUNI = $2,
          TB_SUBTOTA = $3
      WHERE TB_IDDETVE = $4
      RETURNING *;
    `;

    const values = [cantidad, precioUnitario, subtotal, id];
    const { rows } = await db.query(query, values);

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error actualizando detalle de venta" });
  }
}

// Eliminar detalle de venta
export async function deleteDetVenta(req, res) {
  try {
    const { id } = req.params;

    await db.query(
      `DELETE FROM TB_DETVENT WHERE TB_IDDETVE = $1`,
      [id]
    );

    res.json({ message: "Detalle de venta eliminado" });
  } catch (err) {
    res.status(500).json({ error: "Error eliminando detalle de venta" });
  }
}
