import express from "express";
import { createProduccion } from "../controllers/producc.controller.js";

const router = express.Router();

router.post("/producc", createProduccion);

export default router;
