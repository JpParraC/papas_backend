// src/routes/cosechas.routes.js
import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';

import {
  crearCosecha,
  listarCosechas,
  obtenerCosecha,
  actualizarCosecha,
  eliminarCosecha
} from '../controllers/cosechas.controller.js';

const r = Router();

// Crear cosecha
r.post('/', auth, crearCosecha);

// Listar todas las cosechas
r.get('/', auth, listarCosechas);

// Obtener una cosecha por ID
r.get('/:id', auth, obtenerCosecha);

// Actualizar cosecha por ID
r.put('/:id', auth, actualizarCosecha);

// Eliminar cosecha por ID
r.delete('/:id', auth, eliminarCosecha);

export default r;
