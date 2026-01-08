import express from "express";
import { createProduccion, getProduccion, deleteProduccion, updateProduccion } from "../controllers/producc.controller.js";

const router = express.Router();

router.get("/producc", getProduccion);
router.post("/producc", createProduccion);
router.delete("/producc/:id", deleteProduccion);
router.put("/producc/:id", updateProduccion);

export default router;
