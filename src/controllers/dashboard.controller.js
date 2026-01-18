// src/controllers/dashboard.controller.js
import db from '../db/index.js' // ajusta la ruta si es diferente

// ===============================
// TOTAL DE VENTAS
// ===============================
export const getTotalVentas = async (req, res) => {
  try {
    const query = `
      SELECT 
        COALESCE(SUM(tb_totalven), 0) AS total_ventas
      FROM tb_ventas
      WHERE tb_estadven = 'Completada'
    `

    const { rows } = await db.query(query)

    res.json({
      totalVentas: parseFloat(rows[0].total_ventas)
    })
  } catch (error) {
    console.error('Error total ventas:', error)
    res.status(500).json({ message: 'Error al obtener total de ventas' })
  }
}

// ===============================
// VENTAS RECIENTES
// ===============================
export const getVentasRecientes = async (req, res) => {
  try {
    const query = `
      SELECT
        tb_idventa AS id,
        tb_idclien AS cliente,
        tb_fechvent,
        tb_totalven,
        tb_estadven
      FROM tb_ventas
      ORDER BY tb_fechvent DESC
      LIMIT 5
    `

    const { rows } = await db.query(query)

    const ventas = rows.map(v => ({
      id: v.id,
      cliente: v.cliente, // luego lo unimos con clientes
      fecha: v.tb_fechvent,
      total: parseFloat(v.tb_totalven),
      estado: v.tb_estadven
    }))

    res.json(ventas)
  } catch (error) {
    console.error('Error ventas recientes:', error)
    res.status(500).json({ message: 'Error al obtener ventas recientes' })
  }
}
