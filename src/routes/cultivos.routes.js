// src/routes/cultivos.routes.js
import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';

import { 
  listCultivos, 
  createCultivo, 
  getCultivo, 
  updateCultivo,
  deleteCultivo   // ✅ Agregado
} from '../controllers/cultivos.controller.js';

const r = Router();

r.get('/', auth, listCultivos);
r.post('/', auth, createCultivo);
r.get('/:id', auth, getCultivo);
r.put('/:id', auth, updateCultivo);
r.delete('/:id', auth, deleteCultivo);  // ✅ Agregado

export default r;
