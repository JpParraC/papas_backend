// src/controllers/pagos.controller.js
import db from '../db/index.js';
const T = db.SCHEMA_PREFIX;

export async function pagarVenta(req, res) {
  try {
    const venta_id = req.params.venta_id;
    const { monto, metodo_pago, referencia_pago } = req.body;
    const user_id = req.user?.id || null;

    const q = `INSERT INTO ${T}pagos_clientes (venta_id, monto, fecha, metodo_pago, observacion)
               VALUES ($1,$2,CURRENT_DATE,$3,$4) RETURNING *`;
    const { rows } = await db.query(q, [venta_id, monto, metodo_pago, referencia_pago]);

    res.json({ message: 'Pago registrado', pago: rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Error registrando pago', error: err.message }); }
}

export async function pagarCompra(req, res) {
  try {
    const compra_id = req.params.compra_id;
    const { monto, metodo_pago, referencia_pago } = req.body;
    const user_id = req.user?.id || null;

    const q = `INSERT INTO ${T}pagos_proveedores (compra_id, monto, fecha, metodo_pago, observacion)
               VALUES ($1,$2,CURRENT_DATE,$3,$4) RETURNING *`;
    const { rows } = await db.query(q, [compra_id, monto, metodo_pago, referencia_pago]);

    res.json({ message: 'Pago a proveedor registrado', pago: rows[0] });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Error registrando pago proveedor', error: err.message }); }
}
