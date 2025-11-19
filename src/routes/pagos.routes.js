// src/routes/pagos.routes.js
import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import { pagarVenta, pagarCompra } from '../controllers/pagos.controller.js';
const r = Router();
r.post('/clientes/:venta_id', auth, pagarVenta);
r.post('/proveedores/:compra_id', auth, pagarCompra);
export default r;
