// src/controllers/usuarios.controller.js
import db from "../db/index.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = "mi_secreto_super_seguro"; // cámbialo antes de producción

// ----------------------
// LOGIN
// ----------------------
export async function loginUsuario(req, res) {
  try {
    const { usuario, password } = req.body;

    if (!usuario || !password) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    // Buscar usuario por nombre de usuario o email
    const q = `
      SELECT u.id, u.usuario, u.password, u.nombre, u.apellido, u.email,
             u.telefono, u.rol_id, r.rol_name
      FROM tb_usuarios u
      LEFT JOIN tb_roles r ON r.id = u.rol_id
      WHERE u.usuario = $1
      LIMIT 1
    `;

    const { rows } = await db.query(q, [usuario]);

    if (rows.length === 0) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    const user = rows[0];

    // Comparar contraseñas
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    // Generar token
    const token = jwt.sign(
      { id: user.id, rol: user.rol_name },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      message: "Login exitoso",
      token,
      usuario: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        rol: user.rol_name
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en el servidor" });
  }
}



// ----------------------
// REGISTRO (Opcional)
// ----------------------
export async function registrarUsuario(req, res) {
  try {
    const { usuario, password, nombre, apellido, email, telefono, rol_id } = req.body;

    if (!usuario || !password || !nombre || !apellido) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const q = `
      INSERT INTO tb_usuarios (usuario, password, nombre, apellido, email, telefono, rol_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      usuario,
      passwordHash,
      nombre,
      apellido,
      email,
      telefono,
      rol_id || 2, // por defecto "usuario"
    ];

    const { rows } = await db.query(q, values);

    res.json({ message: "Usuario registrado", usuario: rows[0] });

  } catch (err) {
    res.status(500).json({ error: "Error registrando usuario" });
  }
}
