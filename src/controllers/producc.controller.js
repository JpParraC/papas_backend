// src/controllers/producc.controller.js
import pool from '../db.js' // tu pool de conexión

// ================== CREAR PRODUCCIÓN ==================
export const createProduccion = async (req, res) => {
  try {
    const {
      tb_idprodut,        // ⚡ nombre exacto de la columna
      fecha_siembra,
      fecha_cosecha,
      cantidad_esperada,
      cantidad_cosechada,
      area_cultivo,
      costo_produccion,
      responsable_id
    } = req.body

    // Validaciones básicas
    if (!tb_idprodut || !fecha_siembra || !fecha_cosecha || !cantidad_esperada || !area_cultivo || !costo_produccion || !responsable_id) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' })
    }

    // Inserción en la base de datos
    const result = await pool.query(
      `INSERT INTO tb_producc
        (tb_idprodut, fecha_siembra, fecha_cosecha, cantidad_esperada, cantidad_cosechada, area_cultivo, costo_produccion, responsable_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        tb_idprodut,
        fecha_siembra,
        fecha_cosecha,
        parseFloat(cantidad_esperada),
        cantidad_cosechada ? parseFloat(cantidad_cosechada) : 0,
        parseFloat(area_cultivo),
        parseFloat(costo_produccion),
        responsable_id
      ]
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Error creando producción:', error)
    res.status(500).json({ message: 'Error al crear producción', error: error.message })
  }
}

// ================== LISTAR PRODUCCIÓN ==================
export const getProduccion = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, pr.tma_nombrep AS producto
       FROM tb_producc p
       LEFT JOIN tb_productos pr ON pr.tma_idprodu = p.tb_idprodut
       ORDER BY p.id ASC`
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Error obteniendo producción:', error)
    res.status(500).json({ message: 'Error al obtener producción', error: error.message })
  }
}

// ================== OTRAS FUNCIONES ==================
// Aquí puedes agregar updateProduccion, deleteProduccion, etc.
