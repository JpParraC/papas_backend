import { Router } from "express";
import {
  getInventario,
} from "../controllers/inventario.controller.js";

const router = Router();

router.get("/", getInventario);
 

export default router;
