import { Router } from "express";
import {
  getClientes,
  createCliente,
  updateCliente,
  deleteCliente, getClienteByCedula  
} from "../controllers/cliente.controller.js";

const router = Router();

router.get("/", getClientes);
router.post("/", createCliente);
router.put("/:id", updateCliente);
router.delete("/:id", deleteCliente);
router.get("/cedula/:cedula", getClienteByCedula );

export default router;
