// controllers/cargos.controller.js
import db from "../db/index.js"; // o tu conexión a la DB

// ====================
// Obtener todos los cargos
// ====================
const getCargos = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nombre_cargo, descripcion, nivel, salario_base 
       FROM cargos
       ORDER BY nombre_cargo ASC`
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Error al obtener cargos:', error)
    res.status(500).json({ message: 'Error al obtener cargos' })
  }
}

module.exports = {
  getCargos,
}
