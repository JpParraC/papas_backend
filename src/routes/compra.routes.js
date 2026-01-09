// src/routes/compra.router.js
import { Router } from "express";
import { imprimirFacturaCompra } from "../controllers/compra.controller.js";
import {
  crearCompra,
  listarCompras,
  obtenerCompraPorId,
  obtenerDetalleCompra,
  eliminarCompra,
  actualizarCompra,
} from "../controllers/compra.controller.js";

const router = Router();

// ================== RUTAS ==================

// LISTAR TODAS LAS COMPRAS
router.get("/", listarCompras);

// OBTENER UNA COMPRA POR ID (sin detalle)
router.get("/:id", obtenerCompraPorId);

// CREAR COMPRA
router.post("/", crearCompra);

// OBTENER DETALLE DE UNA COMPRA
router.get("/:id/detalle", obtenerDetalleCompra);

// EDITAR COMPRA
router.put("/:id", actualizarCompra);

// ELIMINAR COMPRA
router.delete("/:id", eliminarCompra);

router.get("/:id/factura", imprimirFacturaCompra);
router.get("/:id/pdf", imprimirFacturaCompra);


export default router;
