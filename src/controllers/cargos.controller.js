import db from "../db/index.js"

// ======================
// DB
// ======================
const { pool, SCHEMA_PREFIX } = db

// ======================
// OBTENER TODOS LOS CARGOS
// GET /api/cargos
// ======================
export async function getCargos(req, res) {
  try {
    const result = await pool.query(
      `SELECT 
        id,
        nombre_cargo,
        descripcion,
        nivel,
        salario_base,
        created_at,
        updated_at
       FROM ${SCHEMA_PREFIX}cargos
       ORDER BY nombre_cargo ASC`
    )

    res.json(result.rows)
  } catch (error) {
    console.error('Error al obtener cargos:', error)
    res.status(500).json({ message: 'Error al obtener cargos' })
  }
}

// ======================
// CREAR CARGO
// POST /api/cargos
// ======================
export async function createCargo(req, res) {
  const { nombre_cargo, descripcion, nivel, salario_base } = req.body

  try {
    const result = await pool.query(
      `INSERT INTO ${SCHEMA_PREFIX}cargos
        (nombre_cargo, descripcion, nivel, salario_base)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [nombre_cargo, descripcion, nivel, salario_base]
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Error al crear cargo:', error)
    res.status(500).json({ message: 'Error al crear cargo' })
  }
}

// ======================
// ACTUALIZAR CARGO
// PUT /api/cargos/:id
// ======================
export async function updateCargo(req, res) {
  const { id } = req.params
  const { nombre_cargo, descripcion, nivel, salario_base } = req.body

  try {
    const result = await pool.query(
      `UPDATE ${SCHEMA_PREFIX}cargos
       SET nombre_cargo = $1,
           descripcion = $2,
           nivel = $3,
           salario_base = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [nombre_cargo, descripcion, nivel, salario_base, id]
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Cargo no encontrado' })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Error al actualizar cargo:', error)
    res.status(500).json({ message: 'Error al actualizar cargo' })
  }
}

// ======================
// ELIMINAR CARGO
// DELETE /api/cargos/:id
// ======================
export async function deleteCargo(req, res) {
  const { id } = req.params

  try {
    const result = await pool.query(
      `DELETE FROM ${SCHEMA_PREFIX}cargos
       WHERE id = $1
       RETURNING id`,
      [id]
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Cargo no encontrado' })
    }

    res.json({ message: 'Cargo eliminado correctamente' })
  } catch (error) {
    console.error('Error al eliminar cargo:', error)
    res.status(500).json({ message: 'Error al eliminar cargo' })
  }
}
