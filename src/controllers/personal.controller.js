import db from "../db/index.js";

// ============================
// OBTENER TODO EL PERSONAL
// ============================
export const getPersonal = async (req, res) => {
  try {
    const { rows } = await db.pool.query(
      `SELECT * FROM bdtma_personal ORDER BY tma_nombrep ASC`
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error('getPersonal:', error);
    res.status(500).json({ message: 'Error al obtener el personal' });
  }
};

// ============================
// CREAR PERSONAL
// ============================
export const createPersonal = async (req, res) => {
  try {
    const {
      tma_nombrep,
      tma_cargope,
      tma_fechcon,
      tma_salario,
      tma_telefon,
      tma_emailpe,
      tma_estadpe
    } = req.body;

    if (!tma_nombrep || !tma_cargope || !tma_fechcon) {
      return res.status(400).json({ message: 'Campos obligatorios faltantes' });
    }

    const salarioFinal = Number(tma_salario) || 0;

    const { rows } = await db.pool.query(
      `INSERT INTO bdtma_personal
        (tma_nombrep, tma_cargope, tma_fechcon, tma_salario, tma_telefon, tma_emailpe, tma_estadpe)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [
        tma_nombrep,
        tma_cargope,
        tma_fechcon,
        salarioFinal,
        tma_telefon || '',
        tma_emailpe || '',
        tma_estadpe || 'Activo'
      ]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('createPersonal:', error);
    res.status(500).json({ message: 'Error al crear personal' });
  }
};

// ============================
// ACTUALIZAR PERSONAL
// ============================
export const updatePersonal = async (req, res) => {
  try {
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

    if (!tma_nombrep || !tma_cargope || !tma_fechcon) {
      return res.status(400).json({ message: 'Campos obligatorios faltantes' })
    }

    const { rows, rowCount } = await db.pool.query(
      `UPDATE bdtma_personal SET
        tma_nombrep = $1,
        tma_cargope = $2,
        tma_fechcon = $3,
        tma_salario = $4,
        tma_telefon = $5,
        tma_emailpe = $6,
        tma_estadpe = $7
       WHERE tma_idperso = $8
       RETURNING *`,
      [
        tma_nombrep,
        tma_cargope,
        tma_fechcon,
        tma_salario || 0,
        tma_telefon || '',
        tma_emailpe || '',
        tma_estadpe || 'Activo',
        id
      ]
    )

    if (rowCount === 0) {
      return res.status(404).json({ message: 'Empleado no encontrado' })
    }

    res.status(200).json(rows[0])
  } catch (error) {
    console.error('updatePersonal:', error)
    res.status(500).json({ message: 'Error al actualizar personal' })
  }
}


// ============================
// ELIMINAR PERSONAL
// ============================
export const deletePersonal = async (req, res) => {
  try {
    const { id } = req.params;

    const { rowCount } = await db.pool.query(
      'DELETE FROM bdtma_personal WHERE tma_idperso = $1',
      [id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ message: 'Empleado no encontrado' });
    }

    res.status(200).json({ message: 'Personal eliminado correctamente' });
  } catch (error) {
    console.error('deletePersonal:', error);
    res.status(500).json({ message: 'Error al eliminar personal' });
  }
};
