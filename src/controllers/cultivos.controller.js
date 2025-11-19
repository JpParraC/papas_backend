// src/controllers/cultivos.controller.js
import db from '../db/index.js';
const T = db.SCHEMA_PREFIX;

// Listar todos los cultivos
export async function listCultivos(req, res) {
  try {
    const { rows } = await db.query(`SELECT * FROM ${T}cultivos ORDER BY id DESC`);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error listando cultivos', error: err.message });
  }
}

// Crear un nuevo cultivo
export async function createCultivo(req, res) {
  try {
    const { fecha_siembra, costo_previsto, responsable_id, estado } = req.body;

    // Validación básica
    if (!fecha_siembra || !costo_previsto || !responsable_id) {
      return res.status(400).json({ message: 'Faltan campos obligatorios: fecha_siembra, costo_previsto, responsable_id' });
    }

    const q = `
      INSERT INTO ${T}cultivos 
      (fecha_siembra, costo_previsto, responsable_id, estado)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const { rows } = await db.query(q, [fecha_siembra, costo_previsto, responsable_id, estado || 'activo']);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creando cultivo', error: err.message });
  }
}

// Obtener un cultivo por ID
export async function getCultivo(req, res) {
  try {
    const { id } = req.params;
    const { rows } = await db.query(`SELECT * FROM ${T}cultivos WHERE id=$1`, [id]);
    if (!rows[0]) return res.status(404).json({ message: 'Cultivo no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error obteniendo cultivo', error: err.message });
  }
}

// Actualizar un cultivo
export async function updateCultivo(req, res) {
  try {
    const { id } = req.params;
    const { fecha_siembra, costo_previsto, responsable_id, estado } = req.body;

    const q = `
      UPDATE ${T}cultivos
      SET fecha_siembra=$1,
          costo_previsto=$2,
          responsable_id=$3,
          estado=$4
      WHERE id=$5
      RETURNING *
    `;

    const { rows } = await db.query(q, [fecha_siembra, costo_previsto, responsable_id, estado, id]);

    if (!rows[0]) return res.status(404).json({ message: 'Cultivo no encontrado' });
    res.json({ message: 'Cultivo actualizado', cultivo: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error actualizando cultivo', error: err.message });
  }
}
// Eliminar un cultivo // Eliminar un cultivo
export async function deleteCultivo(req, res) {
  try {
    const { id } = req.params;

    const q = `DELETE FROM ${T}cultivos WHERE id = $1 RETURNING *`;

    const { rows } = await db.query(q, [id]);

    if (!rows[0]) {
      return res.status(404).json({ message: 'Cultivo no encontrado' });
    }

    res.json({ message: 'Cultivo eliminado correctamente', cultivo: rows[0] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error eliminando cultivo', error: err.message });
  }
}