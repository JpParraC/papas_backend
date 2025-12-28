import db from "../db/index.js";
const T = db.SCHEMA_PREFIX || "";

// -----------------------------------------------------------
// CREAR COMPRA
// -----------------------------------------------------------
export const crearCompra = async (req, res) => {
  console.log("REQ BODY recibidos en crearCompra:", req.body);

  const client = await db.pool.connect();
  try {
    const { idProveedor, estado, tb_detalle } = req.body;

    if (!idProveedor || !estado || !tb_detalle || !Array.isArray(tb_detalle) || tb_detalle.length === 0) {
      return res.status(400).json({
        message: "Faltan datos: idProveedor, estado o tb_detalle",
      });
    }

    await client.query("BEGIN");

    // Calcular total
    const totalCompra = tb_detalle.reduce((acc, item) => acc + (item.subtotal || 0), 0);

    const fechaCompra = new Date().toISOString().split("T")[0];

    // Insertar compra
    const queryCompra = `
      INSERT INTO ${T}tb_compras
      (tb_idproveed, tb_estadcom, tb_totalcom, tb_fechcomp)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;

    const compraResult = await client.query(queryCompra, [
      Number(idProveedor),
      estado,
      totalCompra,
      fechaCompra,
    ]);

    const idCompra = compraResult.rows[0].tb_idcompra;

    // Insertar detalle
    const queryDetalle = `
      INSERT INTO ${T}tb_detcomp
      (tb_idcompr, tb_idprodu, tb_cantidad, tb_precunic, tb_subtotal)
      VALUES ($1, $2, $3, $4, $5);
    `;

    for (const item of tb_detalle) {
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

    await client.query("COMMIT");

    return res.status(201).json({
      message: "Compra registrada correctamente con detalle separado",
      compra: compraResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("ERROR al crear compra:", error);
    return res.status(500).json({ message: "Error en servidor", error });
  } finally {
    client.release();
  }
};

// -----------------------------------------------------------
// ACTUALIZAR COMPRA
// -----------------------------------------------------------
export const actualizarCompra = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { id } = req.params;
    const { idProveedor, estado, tb_detalle } = req.body;

    if (!idProveedor || !estado || !tb_detalle || !Array.isArray(tb_detalle) || tb_detalle.length === 0) {
      return res.status(400).json({
        message: "Faltan datos: idProveedor, estado o tb_detalle",
      });
    }

    await client.query("BEGIN");

    // Calcular total
    const totalCompra = tb_detalle.reduce((acc, item) => acc + (item.subtotal || 0), 0);

    // Actualizar compra
    const queryUpdateCompra = `
      UPDATE ${T}tb_compras
      SET tb_idproveed = $1, tb_estadcom = $2, tb_totalcom = $3
      WHERE tb_idcompra = $4
      RETURNING *;
    `;
    const result = await client.query(queryUpdateCompra, [
      idProveedor,
      estado,
      totalCompra,
      id,
    ]);

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Compra no encontrada" });
    }

    // Borrar detalles antiguos
    await client.query(`DELETE FROM ${T}tb_detcomp WHERE tb_idcompr = $1;`, [id]);

    // Insertar nuevos detalles
    const queryDetalle = `
      INSERT INTO ${T}tb_detcomp
      (tb_idcompr, tb_idprodu, tb_cantidad, tb_precunic, tb_subtotal)
      VALUES ($1, $2, $3, $4, $5);
    `;

    for (const item of tb_detalle) {
      if (item.producto_id) {
        await client.query(queryDetalle, [
          id,
          item.producto_id,
          item.cantidad,
          item.precio_unitario_compra,
          item.subtotal,
        ]);
      }
    }

    await client.query("COMMIT");

    return res.json({ message: "Compra actualizada correctamente", compra: result.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("ERROR al actualizar compra:", error);
    return res.status(500).json({ message: "Error en servidor", error });
  } finally {
    client.release();
  }
};

// -----------------------------------------------------------
// LISTAR COMPRAS
// -----------------------------------------------------------
export const listarCompras = async (req, res) => {
  try {
    const query = `SELECT * FROM ${T}tb_compras ORDER BY tb_idcompra DESC;`;
    const result = await db.query(query);

    return res.json(result.rows);
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
// ELIMINAR COMPRA (con detalle)
// -----------------------------------------------------------
export const eliminarCompra = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { id } = req.params;

    await client.query("BEGIN");

    // Eliminar primero detalles
    await client.query(`DELETE FROM ${T}tb_detcomp WHERE tb_idcompr = $1;`, [id]);

    // Eliminar compra
    const result = await client.query(
      `DELETE FROM ${T}tb_compras WHERE tb_idcompra = $1 RETURNING *;`,
      [id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Compra no encontrada" });
    }

    await client.query("COMMIT");
    return res.json({ message: "Compra eliminada correctamente" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("ERROR al eliminar compra:", error);
    return res.status(500).json({ message: "Error en servidor", error });
  } finally {
    client.release();
  }
};

// -----------------------------------------------------------
// OBTENER DETALLE DE UNA COMPRA (JOIN con productos)
// -----------------------------------------------------------
export const obtenerDetalleCompra = async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT 
        d.tb_iddetco AS id_detalle,
        d.tb_cantidad,
        d.tb_precunic,
        d.tb_subtotal,
        p.tma_nombrep AS nombre_producto
      FROM ${T}tb_detcomp d
      JOIN ${T}bdtma_produc p ON d.tb_idprodu = p.tma_idprodu
      WHERE d.tb_idcompr = $1
      ORDER BY d.tb_iddetco;
    `;
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No se encontraron detalles para esta compra' });
    }

    res.json(result.rows);
  } catch (error) {
    console.error("ERROR al obtener detalle de compra:", error);
    res.status(500).json({ message: "Error en servidor", error });
  }
};
