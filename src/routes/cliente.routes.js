import { Router } from "express";
import {
  getClientes,
  createCliente,
  updateCliente,
  deleteCliente
} from "../controllers/cliente.controller.js";

const router = Router();

router.get("/", getClientes);
router.post("/", createCliente);
router.put("/:id", updateCliente);
router.delete("/:id", deleteCliente);

export default router;
