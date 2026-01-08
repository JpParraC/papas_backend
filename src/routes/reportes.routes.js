import express from "express";
import {
  listarReportes,
  crearReporte,
  actualizarReporte,
  eliminarReporte,
} from "../controllers/reportes.controller.js";

const router = express.Router();

router.get("/", listarReportes);
router.post("/", crearReporte);
router.put("/:id", actualizarReporte);
router.delete("/:id", eliminarReporte);

export default router;
