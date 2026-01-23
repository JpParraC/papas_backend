import db from '../db/index.js'

export async function getDashboard(req, res) {
  try {
    // Total de ventas
    const { rows: ventasRows } = await db.query(`SELECT COALESCE(SUM(tb_totalven),0) as total FROM tb_ventas`)
    const totalVentas = ventasRows[0].total

    // Total de compras
    const { rows: comprasRows } = await db.query(`SELECT COALESCE(SUM(tb_totalcom),0) as total FROM tb_compras`)
    const totalCompras = comprasRows[0].total

    // Total de clientes
    const { rows: clientesRows } = await db.query(`SELECT COUNT(*) as total FROM bdtma_cliente`)
    const totalClientes = parseInt(clientesRows[0].total)

    // Total de personal
    const { rows: personalRows } = await db.query(`SELECT COUNT(*) as total FROM bdtma_personal`)
    const totalPersonal = parseInt(personalRows[0].total)

    // Total inventario
    const { rows: inventarioRows } = await db.query(`SELECT COALESCE(SUM(cantidad),0) as total FROM tb_stock`)
    const totalInventario = inventarioRows[0].total

    // Producción activa
    const { rows: produccionRows } = await db.query(`SELECT COUNT(*) as total FROM tb_producc`)
    const totalProduccion = parseInt(produccionRows[0].total)

    // Balance
    const balance = totalVentas - totalCompras

    // Ventas y compras de hoy
    const { rows: ventasHoyRows } = await db.query(`SELECT COALESCE(SUM(tb_totalven),0) as total FROM tb_ventas WHERE tb_fechvent::date = CURRENT_DATE`)
    const ventasHoy = ventasHoyRows[0].total

    const { rows: comprasHoyRows } = await db.query(`SELECT COALESCE(SUM(tb_totalcom),0) as total FROM tb_compras WHERE tb_fechcomp = CURRENT_DATE`)
    const comprasHoy = comprasHoyRows[0].total

    // Ventas recientes
    const { rows: ventasRecientes } = await db.query(`
      SELECT v.tb_idventa, c.tma_nombrec as cliente, v.tb_fechvent as fecha, v.tb_totalven as total, v.tb_estadven as estado
      FROM tb_ventas v
      JOIN bdtma_cliente c ON v.tb_idclien = c.tma_idclien
      ORDER BY v.tb_fechvent DESC
      LIMIT 5
    `)

    // Compras recientes
    const { rows: comprasRecientes } = await db.query(`
      SELECT c.tb_idcompra, p.tma_nombrep as proveedor, c.tb_fechcomp as fecha, c.tb_totalcom as total, c.tb_estadcom as estado
      FROM tb_compras c
      JOIN bdtma_proveed p ON c.tb_idproveed = p.tma_idprove
      ORDER BY c.tb_fechcomp DESC
      LIMIT 5
    `)

    // Inventario bajo
    const { rows: inventarioBajo } = await db.query(`
      SELECT s.producto_id as id, p.tma_nombrep as producto, s.cantidad
      FROM tb_stock s
      JOIN bdtma_produc p ON s.producto_id = p.tma_idprodu
      WHERE s.cantidad < 100
      ORDER BY s.cantidad ASC
      LIMIT 5
    `)

 


    res.json({
      resumen: { totalVentas, totalCompras, totalClientes, totalPersonal, totalInventario, totalProduccion, balance, ventasHoy, comprasHoy },
      ventasRecientes,
      comprasRecientes,
      inventarioBajo,
 
  
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error obteniendo dashboard' })
  }
}
