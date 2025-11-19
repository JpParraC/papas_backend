import { Router } from "express";
import {
  getDetVentas,
  createDetVenta,
  updateDetVenta,
  deleteDetVenta
} from "../controllers/detvent.controller.js";

const router = Router();

// Listar detalles de una venta específica
router.get("/:ventaId", getDetVentas);

router.post("/", createDetVenta);
router.put("/:id", updateDetVenta);
router.delete("/:id", deleteDetVenta);

export default router;
