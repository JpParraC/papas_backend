import db from "../db/index.js";
const T = db.SCHEMA_PREFIX

// -----------------------------------------------------------
export const crearCompra = async (req, res) => {
  console.log('REQ BODY recibidos en crearCompra:', req.body);

  const client = await db.pool.connect(); // 🔹 usar pool.connect()
  try {
    const { idProveedor, estado, tb_detalle } = req.body;

    if (!idProveedor || !estado || !tb_detalle) {
      return res.status(400).json({
        message: "Faltan datos: idProveedor, estado o tb_detalle",
      });
    }

    // 1️⃣ Iniciar transacción
    await client.query('BEGIN');

    // 2️⃣ Calcular total a partir del string de detalle
    const totalCompra = tb_detalle
      .split(';')
      .reduce((acc, item) => {
        const match = item.match(/Subtotal:\s*(\d+(\.\d+)?)/);
        return acc + (match ? parseFloat(match[1]) : 0);
      }, 0);

    const fechaCompra = new Date().toISOString().split('T')[0];

    // 3️⃣ Insertar compra en tb_compras
    const queryCompra = `
      INSERT INTO ${T}tb_compras
      (tb_idproveed, tb_estadcom, tb_detalle, tb_totalcom, tb_fechcomp)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;

    const compraResult = await client.query(queryCompra, [
      Number(idProveedor),
      estado,
      tb_detalle,
      totalCompra,
      fechaCompra,
    ]);

    const idCompra = compraResult.rows[0].tb_idcompra;

    // 4️⃣ Parsear productos del string
    const productos = tb_detalle.split(';').map((item) => {
      const idMatch = item.match(/Producto:\s*(\d+)/);
      const cantidadMatch = item.match(/Cantidad:\s*(\d+(\.\d+)?)/);
      const precioMatch = item.match(/Precio:\s*(\d+(\.\d+)?)/);
      const subtotalMatch = item.match(/Subtotal:\s*(\d+(\.\d+)?)/);

      return {
        producto_id: idMatch ? parseInt(idMatch[1]) : null,
        cantidad: cantidadMatch ? parseFloat(cantidadMatch[1]) : 0,
        precio_unitario_compra: precioMatch ? parseFloat(precioMatch[1]) : 0,
        subtotal: subtotalMatch ? parseFloat(subtotalMatch[1]) : 0,
      };
    });

    // 5️⃣ Insertar cada detalle en tb_detcomp
    const queryDetalle = `
      INSERT INTO ${T}tb_detcomp
      (tb_idcompr, tb_idprodu, tb_cantidad, tb_precunic, tb_subtotal)
      VALUES ($1, $2, $3, $4, $5);
    `;

    for (const item of productos) {
      if (item.producto_id) {
        await client.query(queryDetalle, [
          idCompra,
          item.producto_id,
          item.cantidad,
          item.precio_unitario_compra,
          item.subtotal,
        ]);
      }
    }

    // 6️⃣ Confirmar transacción
    await client.query('COMMIT');

    return res.status(201).json({
      message: "Compra registrada correctamente con detalle separado",
      compra: compraResult.rows[0],
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("ERROR al crear compra:", error);
    return res.status(500).json({ message: "Error en servidor", error });
  } finally {
    client.release();
  }
};



// -----------------------------------------------------------
export const listarCompras = async (req, res) => {
  try {
    const query = `SELECT * FROM ${T}tb_compras ORDER BY tb_idcompra DESC;`;
    const result = await db.query(query);

    const compras = result.rows.map(compra => ({
      ...compra,
      tb_detalle: compra.tb_detalle || '',
    }));

    return res.json(compras);
  } catch (error) {
    console.error("ERROR al listar compras:", error);
    return res.status(500).json([]);
  }
};

// -----------------------------------------------------------
// OBTENER COMPRA POR ID
// -----------------------------------------------------------
export const obtenerCompraPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `SELECT * FROM ${T}tb_compras WHERE tb_idcompra = $1;`;
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Compra no encontrada" });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error("ERROR al obtener compra:", error);
    return res.status(500).json({ message: "Error en servidor", error });
  }
};

// -----------------------------------------------------------
// ELIMINAR COMPRA
// -----------------------------------------------------------
export const eliminarCompra = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `DELETE FROM ${T}tb_compras WHERE tb_idcompra = $1 RETURNING *;`;
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Compra no encontrada" });
    }

    return res.json({ message: "Compra eliminada correctamente" });
  } catch (error) {
    console.error("ERROR al eliminar compra:", error);
    return res.status(500).json({ message: "Error en servidor", error });
  }
};

export const obtenerDetalleCompra = async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT d.tb_cantidad, d.tb_precunic, d.tb_subtotal, p.tma_nombrep AS nombre_producto
      FROM tb_detcomp d
      JOIN bdtma_produc p ON d.tb_idprodu = p.tma_idprodu
      WHERE d.tb_idcompr = $1
    `;
    const result = await db.query(query, [id]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error obteniendo detalle de compra' });
  }
};
