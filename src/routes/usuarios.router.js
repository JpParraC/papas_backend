// src/routes/usuarios.router.js
import { Router } from 'express'
import {
  getUsuarios,
  getUsuario,
  createUsuario,
  updateUsuario,
  deleteUsuario
} from '../controllers/usuarios.controller.js'

const router = Router()

router.get('/', getUsuarios)       // Listar todos los usuarios
router.get('/:id', getUsuario)     // Obtener un usuario por id
router.post('/', createUsuario)    // Crear usuario
router.put('/:id', updateUsuario)  // Actualizar usuario
router.delete('/:id', deleteUsuario) // Eliminar usuario

export default router
