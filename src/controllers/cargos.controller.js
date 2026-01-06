import db from "../db/index.js"

// extraemos el pool correctamente
const { pool, SCHEMA_PREFIX } = db

// ====================
// Obtener todos los cargos
// ====================
export async function getCargos(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, nombre_cargo, descripcion, nivel, salario_base
       FROM ${SCHEMA_PREFIX}cargos
       ORDER BY nombre_cargo ASC`
    )

    res.json(result.rows)
  } catch (error) {
    console.error('Error al obtener cargos:', error)
    res.status(500).json({
      message: 'Error al obtener cargos',
      error: error.message
    })
  }
}
