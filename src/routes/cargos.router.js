import { Router } from "express";
import { getCargos } from "../controllers/cargos.controller.js";

const router = Router();

router.get('/', getCargos);

export default router;
