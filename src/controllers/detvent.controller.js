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
    console.error("ERROR getDetVentas:", err);
    res.status(500).json({ error: "Error obteniendo detalles de venta" });
  }
}

// Crear detalle de venta
export async function createDetVenta(req, res) {
  try {
    const { idVenta, idProducto, cantidad, precioUnitario } = req.body;

    if (!idVenta || !idProducto || cantidad == null || precioUnitario == null) {
      return res.status(400).json({ error: "Faltan datos para crear detalle de venta" });
    }

    const cantidadNum = Number(cantidad) || 0;
    const precioNum = Number(precioUnitario) || 0;
    const subtotal = cantidadNum * precioNum;

    const query = `
      INSERT INTO TB_DETVENT
      (TB_IDVENTA, TB_IDPRODU, TB_CANTIDA, TB_PRECUNI, TB_SUBTOTA)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;

    const { rows } = await db.query(query, [idVenta, idProducto, cantidadNum, precioNum, subtotal]);
    res.json(rows[0]);
  } catch (err) {
    console.error("ERROR createDetVenta:", err);
    res.status(500).json({ error: "Error creando detalle de venta" });
  }
}

// Actualizar detalle de venta
export async function updateDetVenta(req, res) {
  try {
    const { id } = req.params;
    const { cantidad, precioUnitario } = req.body;

    if (cantidad == null || precioUnitario == null) {
      return res.status(400).json({ error: "Faltan datos para actualizar detalle" });
    }

    const cantidadNum = Number(cantidad) || 0;
    const precioNum = Number(precioUnitario) || 0;
    const subtotal = cantidadNum * precioNum;

    const query = `
      UPDATE TB_DETVENT
      SET TB_CANTIDA = $1,
          TB_PRECUNI = $2,
          TB_SUBTOTA = $3
      WHERE TB_IDDETVE = $4
      RETURNING *;
    `;

    const { rows } = await db.query(query, [cantidadNum, precioNum, subtotal, id]);
    if (!rows.length) return res.status(404).json({ error: "Detalle no encontrado" });

    res.json(rows[0]);
  } catch (err) {
    console.error("ERROR updateDetVenta:", err);
    res.status(500).json({ error: "Error actualizando detalle de venta" });
  }
}

// Eliminar detalle de venta
export async function deleteDetVenta(req, res) {
  try {
    const { id } = req.params;

    const result = await db.query(`DELETE FROM TB_DETVENT WHERE TB_IDDETVE = $1 RETURNING *`, [id]);
    if (!result.rows.length) return res.status(404).json({ error: "Detalle no encontrado" });

    res.json({ message: "Detalle de venta eliminado" });
  } catch (err) {
    console.error("ERROR deleteDetVenta:", err);
    res.status(500).json({ error: "Error eliminando detalle de venta" });
  }
}
