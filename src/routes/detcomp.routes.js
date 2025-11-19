import { Router } from "express";
import {
  getDetCompras,
  createDetCompra,
  updateDetCompra,
  deleteDetCompra
} from "../controllers/detcomp.controller.js";

const router = Router();

// Listar detalles de una compra específica
router.get("/:compraId", getDetCompras);

router.post("/", createDetCompra);
router.put("/:id", updateDetCompra);
router.delete("/:id", deleteDetCompra);

export default router;
