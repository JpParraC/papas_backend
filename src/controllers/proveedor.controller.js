import db from "../db/index.js";

// Obtener todos los proveedores
export async function getProveedores(req, res) {
  try {
    const query = `SELECT * FROM BDTMA_PROVEED ORDER BY TMA_IDPROVE ASC`;
    const { rows } = await db.query(query);
    res.json(rows);
  } catch (err) {
    console.error("Error obteniendo proveedores:", err);
    res.status(500).json({ error: "Error obteniendo proveedores" });
  }
}

// Crear proveedor
export async function createProveedor(req, res) {
  try {
    const { nombre, direccion, telefono, email, rif } = req.body;

    console.log("Datos recibidos:", { nombre, direccion, telefono, email, rif });

    const query = `
      INSERT INTO BDTMA_PROVEED
      (TMA_NOMBREP, TMA_DIRECC, TMA_TELEFON, TMA_EMAILPRO, TMA_RIF)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [
      nombre?.trim() || null,
      direccion?.trim() || null,
      telefono?.trim() || null,
      email?.trim() || null,
      rif?.trim() || null,
    ];

    const { rows } = await db.query(query, values);
    res.json(rows[0]);
  } catch (err) {
    console.error("Error creando proveedor:", err);
    res.status(500).json({ error: err.message });
  }
}

// Actualizar proveedor
export async function updateProveedor(req, res) {
  try {
    const { id } = req.params;
    const { nombre, direccion, telefono, email, rif } = req.body;

    console.log("Actualizar proveedor:", { id, nombre, direccion, telefono, email, rif });

    const query = `
      UPDATE BDTMA_PROVEED
      SET TMA_NOMBREP = $1,
          TMA_DIRECC = $2,
          TMA_TELEFON = $3,
          TMA_EMAILPRO = $4,
          TMA_RIF = $5
      WHERE TMA_IDPROVE = $6
      RETURNING *;
    `;

    const values = [
      nombre?.trim() || null,
      direccion?.trim() || null,
      telefono?.trim() || null,
      email?.trim() || null,
      rif?.trim() || null,
      id,
    ];

    const { rows } = await db.query(query, values);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Proveedor no encontrado" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Error actualizando proveedor:", err);
    res.status(500).json({ error: err.message });
  }
}

// Eliminar proveedor
export async function deleteProveedor(req, res) {
  try {
    const { id } = req.params;

    const result = await db.query(
      `DELETE FROM BDTMA_PROVEED WHERE TMA_IDPROVE = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Proveedor no encontrado" });
    }

    res.json({ message: "Proveedor eliminado", proveedor: result.rows[0] });
  } catch (err) {
    console.error("Error eliminando proveedor:", err);
    res.status(500).json({ error: err.message });
  }
}
