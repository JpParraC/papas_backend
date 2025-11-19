import { Router } from "express";
import {
  crearCompra,
  listarCompras,
  obtenerCompraPorId,
  obtenerDetalleCompra, // ✅ Asegúrate de importar esta función
} from "../controllers/compra.controller.js";

const router = Router();

// LISTAR TODAS LAS COMPRAS
router.get("/", listarCompras);

// OBTENER UNA COMPRA POR ID (sin detalle, opcional)
router.get("/:id", obtenerCompraPorId);

// CREAR COMPRA
router.post("/", crearCompra);

// OBTENER DETALLE DE UNA COMPRA
router.get("/:id/detalle", obtenerDetalleCompra);

// (Opcional) actualizar compra — aún no lo creamos
// router.put("/:id", updateCompra);

// (Opcional) eliminar compra — si lo quieres lo agrego
// router.delete("/:id", deleteCompra);

export default router;
