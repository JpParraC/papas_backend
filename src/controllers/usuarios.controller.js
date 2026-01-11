import db from '../db/index.js'
import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 10

// =============================
// Obtener todos los usuarios
// =============================
export const getUsuarios = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT u.id, u.usuario, u.nombre, u.apellido, u.email, u.telefono,
             r.rol_name AS rol, u.estado, u.rol_id
      FROM tb_usuarios u
      LEFT JOIN tb_roles r ON u.rol_id = r.id
      ORDER BY u.id
    `)

    res.json(result.rows)
  } catch (err) {
    console.error('getUsuarios:', err)
    res.status(500).json({ error: 'Error obteniendo usuarios' })
  }
}

// =============================
// Obtener usuario por ID
// =============================
export const getUsuario = async (req, res) => {
  try {
    const { id } = req.params

    const result = await db.query(`
      SELECT u.id, u.usuario, u.nombre, u.apellido, u.email, u.telefono,
             r.rol_name AS rol, u.estado, u.rol_id
      FROM tb_usuarios u
      LEFT JOIN tb_roles r ON u.rol_id = r.id
      WHERE u.id = $1
    `, [id])

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    res.json(result.rows[0])
  } catch (err) {
    console.error('getUsuario:', err)
    res.status(500).json({ error: 'Error obteniendo usuario' })
  }
}

// =============================
// Crear usuario
// =============================
export const createUsuario = async (req, res) => {
  try {
    const {
      usuario,
      password,
      nombre,
      apellido,
      email,
      telefono,
      rol_id,
      estado = 'A'
    } = req.body

    if (!usuario || !password || !nombre || !apellido || !email || !rol_id) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' })
    }

    // 🔍 Verificar duplicados
    const exists = await db.query(
      'SELECT id FROM tb_usuarios WHERE usuario=$1 OR email=$2',
      [usuario, email]
    )
    if (exists.rows.length) {
      return res.status(409).json({ error: 'Usuario o email ya registrado' })
    }

    // 🔐 Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

    const result = await db.query(`
      INSERT INTO tb_usuarios
      (usuario, password, nombre, apellido, email, telefono, rol_id, estado, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())
      RETURNING id, usuario, nombre, apellido, email, telefono, estado, rol_id
    `, [
      usuario,
      hashedPassword,
      nombre,
      apellido,
      email,
      telefono,
      rol_id,
      estado
    ])

    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('createUsuario:', err)
    res.status(500).json({ error: 'Error creando usuario' })
  }
}

// =============================
// Actualizar usuario
// =============================
export const updateUsuario = async (req, res) => {
  try {
    const { id } = req.params
    const {
      usuario,
      password,
      nombre,
      apellido,
      email,
      telefono,
      rol_id,
      estado
    } = req.body

    const existing = await db.query(
      'SELECT id FROM tb_usuarios WHERE id=$1',
      [id]
    )
    if (!existing.rows.length) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    let query = `
      UPDATE tb_usuarios SET
        usuario=$1,
        nombre=$2,
        apellido=$3,
        email=$4,
        telefono=$5,
        rol_id=$6,
        estado=$7,
        updated_at=NOW()
    `
    let params = [
      usuario,
      nombre,
      apellido,
      email,
      telefono,
      rol_id,
      estado
    ]

    // 🔐 Solo si se cambia contraseña
    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)
      query += `, password=$8 WHERE id=$9`
      params.push(hashedPassword, id)
    } else {
      query += ` WHERE id=$8`
      params.push(id)
    }

    query += `
      RETURNING id, usuario, nombre, apellido, email, telefono, estado, rol_id
    `

    const result = await db.query(query, params)
    res.json(result.rows[0])
  } catch (err) {
    console.error('updateUsuario:', err)
    res.status(500).json({ error: 'Error actualizando usuario' })
  }
}

// =============================
// Eliminar usuario
// =============================
export const deleteUsuario = async (req, res) => {
  try {
    const { id } = req.params

    const existing = await db.query(
      'SELECT id FROM tb_usuarios WHERE id=$1',
      [id]
    )
    if (!existing.rows.length) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    await db.query('DELETE FROM tb_usuarios WHERE id=$1', [id])

    res.json({ message: 'Usuario eliminado correctamente' })
  } catch (err) {
    console.error('deleteUsuario:', err)
    res.status(500).json({ error: 'Error eliminando usuario' })
  }
}
