import { Router } from "express";
import {
  getVentas,
  getVentaById,
  createVenta,
  updateVenta,
  deleteVenta
} from "../controllers/venta.controller.js";

const router = Router();

/* ===========================
   VENTAS
=========================== */

// Obtener todas las ventas
router.get("/", getVentas);

// Obtener una venta con su detalle
router.get("/:id", getVentaById);

// Crear venta con detalles
router.post("/", createVenta);

// Actualizar estado de la venta
router.put("/:id", updateVenta);

// Eliminar venta y sus detalles
router.delete("/:id", deleteVenta);

export default router;
