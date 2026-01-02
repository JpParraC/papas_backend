import db from "../db/index.js";

// ============================
// OBTENER TODO EL PERSONAL
// ============================
export const getPersonal = async (req, res) => {
  try {
    const result = await db.pool.query(
      'SELECT * FROM bdtma_personal ORDER BY tma_nombrep ASC'
    )
    res.json(result.rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al obtener el personal' })
  }
}

// ============================
// CREAR PERSONAL
// ============================
export const createPersonal = async (req, res) => {
  const {
    tma_nombrep,
    tma_cargope,
    tma_fechcon,
    tma_salario,
    tma_telefon,
    tma_emailpe,
    tma_estadpe
  } = req.body

  try {
    const result = await db.pool.query(
      `INSERT INTO bdtma_personal 
      (tma_nombrep, tma_cargope, tma_fechcon, tma_salario, tma_telefon, tma_emailpe, tma_estadpe)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *`,
      [
        tma_nombrep,
        tma_cargope,
        tma_fechcon,
        tma_salario,
        tma_telefon,
        tma_emailpe,
        tma_estadpe
      ]
    )
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al crear personal' })
  }
}

// ============================
// ACTUALIZAR PERSONAL
// ============================
export const updatePersonal = async (req, res) => {
  const { id } = req.params
  const {
    tma_nombrep,
    tma_cargope,
    tma_fechcon,
    tma_salario,
    tma_telefon,
    tma_emailpe,
    tma_estadpe
  } = req.body

  try {
    const result = await db.pool.query(
      `UPDATE bdtma_personal SET
        tma_nombrep = $1,
        tma_cargope = $2,
        tma_fechcon = $3,
        tma_salario = $4,
        tma_telefon = $5,
        tma_emailpe = $6,
        tma_estadpe = $7
      WHERE id = $8
      RETURNING *`,
      [
        tma_nombrep,
        tma_cargope,
        tma_fechcon,
        tma_salario,
        tma_telefon,
        tma_emailpe,
        tma_estadpe,
        id
      ]
    )
    res.json(result.rows[0])
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al actualizar personal' })
  }
}

// ============================
// ELIMINAR PERSONAL
// ============================
export const deletePersonal = async (req, res) => {
  const { id } = req.params

  try {
    await db.pool.query(
      'DELETE FROM bdtma_personal WHERE id = $1',
      [id]
    )
    res.json({ message: 'Personal eliminado correctamente' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Error al eliminar personal' })
  }
}
