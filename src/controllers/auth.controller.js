// src/controllers/auth.controller.js
import db from '../db/index.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { hashPassword, comparePassword } from '../utils/hash.js';
dotenv.config();

const T = db.SCHEMA_PREFIX;

export async function register(req, res) {
  try {
    const { usuario, contrasena, nombre, apellido, rol_id } = req.body;

    // Validación básica
    if (!usuario || !contrasena || !rol_id)
      return res.status(400).json({ message: 'Campos faltantes: usuario, contrasena, rol_id' });

    // Hashear la contraseña
    const hashed = await hashPassword(contrasena);

    // Query sin email
    const q = `INSERT INTO ${T}usuarios (usuario, contrasena, nombre, apellido, rol_id)
               VALUES ($1,$2,$3,$4,$5) RETURNING id, usuario, nombre, apellido, rol_id`;
    const { rows } = await db.query(q, [usuario, hashed, nombre, apellido, rol_id]);

    res.status(201).json({ user: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error registrando usuario', error: err.message });
  }
}

export async function login(req, res) {
  try {
    const { usuario, contrasena } = req.body;
    if (!usuario || !contrasena) return res.status(400).json({ message: 'Campos faltantes' });

    const q = `SELECT id, usuario, contrasena, rol_id, nombre, apellido FROM ${T}usuarios WHERE usuario=$1`;
    const { rows } = await db.query(q, [usuario]);
    const user = rows[0];
    if (!user) return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });

    const match = await comparePassword(contrasena, user.contrasena);
    if (!match) return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });

    const token = jwt.sign(
      { id: user.id, usuario: user.usuario, rol_id: user.rol_id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({ token, user: { id: user.id, usuario: user.usuario, nombre: user.nombre, apellido: user.apellido } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error en login', error: err.message });
  }
}
