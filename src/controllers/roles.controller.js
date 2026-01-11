import db from "../db/index.js";

// Obtener todos los roles
export async function getRoles(req, res) {
  try {
    const query = `SELECT id, rol_name FROM tb_roles ORDER BY id ASC`;
    const { rows } = await db.query(query);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo roles" });
  }
}

// Crear rol
export async function createRole(req, res) {
  try {
    const { rol_name } = req.body;

    const query = `
      INSERT INTO tb_roles (rol_name)
      VALUES ($1)
      RETURNING *;
    `;

    const { rows } = await db.query(query, [rol_name]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creando rol" });
  }
}

// Actualizar rol
export async function updateRole(req, res) {
  try {
    const { id } = req.params;
    const { rol_name } = req.body;

    const query = `
      UPDATE tb_roles
      SET rol_name = $1
      WHERE id = $2
      RETURNING *;
    `;

    const { rows } = await db.query(query, [rol_name, id]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error actualizando rol" });
  }
}

// Eliminar rol
export async function deleteRole(req, res) {
  try {
    const { id } = req.params;

    await db.query(
      `DELETE FROM tb_roles WHERE id = $1`,
      [id]
    );

    res.json({ message: "Rol eliminado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error eliminando rol" });
  }
}
