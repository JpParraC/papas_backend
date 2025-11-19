import { Router } from "express";
import {
  getInventario,
  createInventario,
  updateInventario,
  deleteInventario
} from "../controllers/inventario.controller.js";

const router = Router();

router.get("/", getInventario);
router.post("/", createInventario);
router.put("/:id", updateInventario);
router.delete("/:id", deleteInventario);

export default router;
