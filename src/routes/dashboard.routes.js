// src/routes/dashboard.routes.js
import { Router } from 'express'
import {
  getTotalVentas,
  getVentasRecientes
} from '../controllers/dashboard.controller.js'

const router = Router()

router.get('/total-ventas', getTotalVentas)
router.get('/ventas-recientes', getVentasRecientes)

export default router
