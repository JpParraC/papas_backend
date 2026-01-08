import db from "../db/index.js";

// Obtener todos los clientes
export async function getClientes(req, res) {
  try {
    const query = `
      SELECT * 
      FROM BDTMA_CLIENTE
      ORDER BY TMA_IDCLIEN ASC
    `;
    const { rows } = await db.query(query);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo clientes" });
  }
}

// Crear cliente
export async function createCliente(req, res) {
  try {
    const { cedula, nombre, direccion, telefono, email } = req.body;

    const query = `
      INSERT INTO BDTMA_CLIENTE 
      (TMA_CEDULA, TMA_NOMBREC, TMA_DIRECCI, TMA_TELEFON, TMA_EMAILCL, TMA_FECHREG)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *;
    `;

    const values = [cedula, nombre, direccion, telefono, email];
    const { rows } = await db.query(query, values);

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error creando cliente" });
  }
}

// Actualizar cliente
export async function updateCliente(req, res) {
  try {
    const { id } = req.params;

    const idCliente = parseInt(id);
    if (isNaN(idCliente)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const { cedula, nombre, direccion, telefono, email } = req.body;

    const query = `
      UPDATE BDTMA_CLIENTE
      SET TMA_CEDULA = $1,
          TMA_NOMBREC = $2,
          TMA_DIRECCI = $3,
          TMA_TELEFON = $4,
          TMA_EMAILCL = $5
      WHERE TMA_IDCLIEN = $6  
      RETURNING *;
    `;

    const values = [cedula, nombre, direccion, telefono, email, idCliente];
    const { rows } = await db.query(query, values);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Error actualizando cliente" });
  }
}

// Eliminar cliente
export async function deleteCliente(req, res) {
  try {
    const { id } = req.params;

    const idCliente = parseInt(id);
    if (isNaN(idCliente)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const result = await db.query(
      `DELETE FROM BDTMA_CLIENTE WHERE TMA_IDCLIEN = $1`,
      [idCliente]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    res.json({ message: "Cliente eliminado" });
  } catch (err) {
    res.status(500).json({ error: "Error eliminando cliente" });
  }
}

 
export async function getClienteByCedula(req, res) {
  try {
    const { cedula } = req.params;
    const query = `
      SELECT *
      FROM BDTMA_CLIENTE
      WHERE TMA_CEDULA = $1
    `;
    const { rows } = await db.query(query, [cedula]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error buscando cliente por cédula" });
  }
}
