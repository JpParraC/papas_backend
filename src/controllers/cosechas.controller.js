// src/controllers/cosechas.controller.js
import db from '../db/index.js';
const T = db.SCHEMA_PREFIX;

// Crear cosecha
export async function crearCosecha(req, res) {
  try {
    const { cultivo_id, cantidad_obtenida_kg, fecha_cosecha } = req.body;

    if (!cultivo_id || !cantidad_obtenida_kg || !fecha_cosecha) {
      return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    const q = `
      INSERT INTO ${T}cosechas (cultivo_id, cantidad_obtenida_kg, fecha_cosecha)
      VALUES ($1, $2, $3) RETURNING *
    `;

    const { rows } = await db.query(q, [
      cultivo_id,
      cantidad_obtenida_kg,
      fecha_cosecha
    ]);

    res.status(201).json(rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creando cosecha", error: err.message });
  }
}

// Listar todas las cosechas
export async function listarCosechas(req, res) {
  try {
    const q = `SELECT * FROM ${T}cosechas ORDER BY id DESC`;
    const { rows } = await db.query(q);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error listando cosechas", error: err.message });
  }
}

// Obtener cosecha por ID
export async function obtenerCosecha(req, res) {
  try {
    const q = `SELECT * FROM ${T}cosechas WHERE id = $1`;
    const { rows } = await db.query(q, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Cosecha no encontrada" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error obteniendo cosecha", error: err.message });
  }
}

// Actualizar cosecha
export async function actualizarCosecha(req, res) {
  try {
    const { id } = req.params;
    const { cultivo_id, cantidad_obtenida_kg, fecha_cosecha } = req.body;

    const q = `
      UPDATE ${T}cosechas
      SET cultivo_id=$1, cantidad_obtenida_kg=$2, fecha_cosecha=$3, updated_at=NOW()
      WHERE id=$4 RETURNING *
    `;

    const { rows } = await db.query(q, [
      cultivo_id,
      cantidad_obtenida_kg,
      fecha_cosecha,
      id
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Cosecha no encontrada" });
    }

    res.json(rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error actualizando cosecha", error: err.message });
  }
}

// Eliminar cosecha
export async function eliminarCosecha(req, res) {
  try {
    const q = `DELETE FROM ${T}cosechas WHERE id=$1 RETURNING *`;
    const { rows } = await db.query(q, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Cosecha no encontrada" });
    }

    res.json({ message: "Cosecha eliminada correctamente" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error eliminando cosecha", error: err.message });
  }
}
