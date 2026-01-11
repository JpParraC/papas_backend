import express from "express";
import { createProduccion, getProduccion, deleteProduccion, updateProduccion } from "../controllers/producc.controller.js";

const router = express.Router();

// Todas las rutas aquí son relativas a /api/produccion
router.get("/", getProduccion);
router.post("/", createProduccion);
router.delete("/:id", deleteProduccion);
router.put("/:id", updateProduccion);

export default router;
