// src/controllers/auth.controller.js
import db from '../db/index.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { comparePassword } from '../utils/hash.js';
dotenv.config();

const T = db.SCHEMA_PREFIX || ''; // si no usas schema, deja vacío

// ================== LOGIN ==================
export async function login(req, res) {
  try {
    const { usuario, password } = req.body;

    // Validación básica
    if (!usuario || !password)
      return res.status(400).json({ message: 'Campos faltantes' });

    // Buscar usuario en la base de datos
    const q = `SELECT id, usuario, password, rol_id, nombre, apellido, estado 
               FROM ${T}tb_usuarios 
               WHERE usuario=$1 LIMIT 1`;
    const { rows } = await db.query(q, [usuario]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    }

    // Validar que el usuario esté activo
    if (user.estado !== 'A') {
      return res.status(403).json({ message: 'Cuenta inactiva. Contacta al administrador.' });
    }

    // Comparar contraseña
    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: user.id, usuario: user.usuario, rol_id: user.rol_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    // Retornar token y datos del usuario
    res.json({
      token,
      user: {
        id: user.id,
        usuario: user.usuario,
        nombre: user.nombre,
        apellido: user.apellido,
        rol_id: user.rol_id,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error en login', error: err.message });
  }
}
