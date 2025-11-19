import { Router } from "express";
import {
  getProductos,
  createProducto,
  updateProducto,
  deleteProducto
} from "../controllers/producto.controller.js";

const router = Router();

router.get("/", getProductos);
router.post("/", createProducto);
router.put("/:id", updateProducto);
router.delete("/:id", deleteProducto);

export default router;
