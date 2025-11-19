// src/routes/usuarios.router.js
import express from "express";
import { loginUsuario, registrarUsuario } from "../controllers/users.controller.js";

const router = express.Router();

// LOGIN
router.post("/login", loginUsuario);

// REGISTRO (opcional)
router.post("/register", registrarUsuario);

export default router;
