import db from "../db/index.js";
import PDFDocument from "pdfkit";

const T = db.SCHEMA_PREFIX || "";

// ===========================================================
// CREAR COMPRA + STOCK + MOVIMIENTOS
// ===========================================================
export const crearCompra = async (req, res) => {
  const client = await db.pool.connect();

  try {
    let { idProveedor, estado, tb_detalle, tb_totalcom, tb_fechcomp } = req.body;

    if (!idProveedor || !estado || !Array.isArray(tb_detalle) || !tb_detalle.length) {
      return res.status(400).json({ message: "Faltan datos" });
    }

    estado = estado.toUpperCase();

    await client.query("BEGIN");

    // --------- COMPRA ----------
    const compraRes = await client.query(`
      INSERT INTO ${T}tb_compras
      (tb_idproveed, tb_estadcom, tb_totalcom, tb_fechcomp)
      VALUES ($1,$2,$3,$4)
      RETURNING *
    `, [idProveedor, estado, tb_totalcom, tb_fechcomp]);

    const idCompra = compraRes.rows[0].tb_idcompra;

    // --------- DETALLE + STOCK + MOV ----------
    for (const item of tb_detalle) {
      // Detalle compra
      await client.query(`
        INSERT INTO ${T}tb_detcomp
        (tb_idcompr, tb_idprodu, tb_cantidad, tb_precunic, tb_subtotal)
        VALUES ($1,$2,$3,$4,$5)
      `, [
        idCompra,
        item.producto_id,
        item.cantidad,
        item.precio_unitario_compra,
        item.subtotal
      ]);

      // Si la compra está PAGADA, actualizar stock y movimientos
      if (estado === "PAGADA") {
        // Stock
        await client.query(`
          INSERT INTO ${T}tb_stock (producto_id, cantidad)
          VALUES ($1,$2)
          ON CONFLICT (producto_id)
          DO UPDATE SET cantidad = tb_stock.cantidad + EXCLUDED.cantidad
        `, [item.producto_id, item.cantidad]);

        // Movimiento
        await client.query(`
          INSERT INTO ${T}tb_movstock
          (producto_id, tipo, modulo, cantidad, referencia_id, fecha)
          VALUES ($1,'ENTRADA','COMPRA',$2,$3,NOW())
        `, [item.producto_id, item.cantidad, idCompra]);
      }
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Compra creada correctamente",
      compra: compraRes.rows[0]
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("ERROR crearCompra:", error);
    res.status(500).json({ message: "Error creando compra", error: error.message });
  } finally {
    client.release();
  }
};

// ===========================================================
// ACTUALIZAR COMPRA + STOCK + MOVIMIENTOS
// ===========================================================
export const actualizarCompra = async (req, res) => {
  const client = await db.pool.connect();

  try {
    const { id } = req.params;
    let { idProveedor, estado, tb_detalle, tb_totalcom } = req.body;
    estado = estado.toUpperCase();

    await client.query("BEGIN");

    // --------- OBTENER ESTADO ANTERIOR ----------
    const oldCompraRes = await client.query(
      `SELECT tb_estadcom FROM ${T}tb_compras WHERE tb_idcompra=$1`,
      [id]
    );
    const estadoAnterior = oldCompraRes.rows[0]?.tb_estadcom;

    // --------- OBTENER DETALLE ANTERIOR ----------
    const oldDetails = await client.query(
      `SELECT * FROM ${T}tb_detcomp WHERE tb_idcompr=$1`,
      [id]
    );

    // --------- REVERTIR STOCK SI ANTERIOR ESTABA PAGADA Y NUEVO NO ----------
    if (estadoAnterior === "PAGADA" && estado !== "PAGADA") {
      for (const d of oldDetails.rows) {
        // Quitar stock
        await client.query(`
          UPDATE ${T}tb_stock
          SET cantidad = cantidad - $1
          WHERE producto_id = $2
        `, [d.tb_cantidad, d.tb_idprodu]);

        // Registrar movimiento SALIDA
        await client.query(`
          INSERT INTO ${T}tb_movstock
          (producto_id, tipo, modulo, cantidad, referencia_id, fecha)
          VALUES ($1,'SALIDA','COMPRA',$2,$3,NOW())
        `, [d.tb_idprodu, d.tb_cantidad, id]);
      }
    }

    // --------- ELIMINAR DETALLE ANTERIOR ----------
    await client.query(`DELETE FROM ${T}tb_detcomp WHERE tb_idcompr=$1`, [id]);

    // --------- INSERTAR NUEVO DETALLE ----------
    for (const item of tb_detalle) {
      await client.query(`
        INSERT INTO ${T}tb_detcomp
        (tb_idcompr, tb_idprodu, tb_cantidad, tb_precunic, tb_subtotal)
        VALUES ($1,$2,$3,$4,$5)
      `, [id, item.producto_id, item.cantidad, item.precio_unitario_compra, item.subtotal]);

      // --------- AGREGAR STOCK SI NUEVO ESTADO ES PAGADA Y ANTERIOR NO ----------
      if (estado === "PAGADA" && estadoAnterior !== "PAGADA") {
        // Agregar stock
        await client.query(`
          INSERT INTO ${T}tb_stock (producto_id, cantidad)
          VALUES ($1,$2)
          ON CONFLICT (producto_id)
          DO UPDATE SET cantidad = tb_stock.cantidad + EXCLUDED.cantidad
        `, [item.producto_id, item.cantidad]);

        // Registrar movimiento ENTRADA
        await client.query(`
          INSERT INTO ${T}tb_movstock
          (producto_id, tipo, modulo, cantidad, referencia_id, fecha)
          VALUES ($1,'ENTRADA','COMPRA',$2,$3,NOW())
        `, [item.producto_id, item.cantidad, id]);
      }
    }

    // --------- ACTUALIZAR COMPRA ----------
    await client.query(`
      UPDATE ${T}tb_compras
      SET tb_idproveed=$1, tb_estadcom=$2, tb_totalcom=$3
      WHERE tb_idcompra=$4
    `, [idProveedor, estado, tb_totalcom, id]);

    await client.query("COMMIT");
    res.json({ message: "Compra actualizada correctamente" });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("ERROR actualizarCompra:", error);
    res.status(500).json({ message: "Error actualizando compra", error: error.message });
  } finally {
    client.release();
  }
};


// ===========================================================
// LISTAR COMPRAS
// ===========================================================
export const listarCompras = async (req, res) => {
  const result = await db.query(`SELECT * FROM ${T}tb_compras ORDER BY tb_idcompra DESC`);
  res.json(result.rows);
};

// ===========================================================
// OBTENER COMPRA POR ID
// ===========================================================
export const obtenerCompraPorId = async (req, res) => {
  const { id } = req.params;
  const result = await db.query(`SELECT * FROM ${T}tb_compras WHERE tb_idcompra=$1`, [id]);
  if (!result.rows.length) return res.status(404).json({ message: "Compra no encontrada" });
  res.json(result.rows[0]);
};

// ===========================================================
// DETALLE COMPRA
// ===========================================================
export const obtenerDetalleCompra = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(`
      SELECT
        c.tb_idcompra                     AS compra_id,
        c.tb_fechcomp                     AS fecha_compra,
        prov.tma_nombrep                  AS proveedor,

        p.tma_nombrep                     AS producto,
        d.tb_cantidad                     AS cantidad,
        d.tb_precunic                     AS precio_unitario,
        d.tb_subtotal                     AS subtotal

      FROM ${T}tb_detcomp d
      JOIN ${T}tb_compras c
        ON c.tb_idcompra = d.tb_idcompr

      JOIN ${T}bdtma_proveed prov
        ON prov.tma_idprove = c.tb_idproveed

      JOIN ${T}bdtma_produc p
        ON p.tma_idprodu = d.tb_idprodu

      WHERE d.tb_idcompr = $1
      ORDER BY p.tma_nombrep ASC
    `, [id]);

    res.json(result.rows);

  } catch (error) {
    console.error("ERROR obtenerDetalleCompra:", error);
    res.status(500).json({ message: "Error obteniendo detalle de compra" });
  }
};

// ===========================================================
// ELIMINAR COMPRA + STOCK + MOVIMIENTOS
// ===========================================================
export const eliminarCompra = async (req, res) => {
  const client = await db.pool.connect();

  try {
    const { id } = req.params;
    await client.query("BEGIN");

    // Obtener detalle
    const detalles = await client.query(`SELECT * FROM ${T}tb_detcomp WHERE tb_idcompr=$1`, [id]);

    for (const d of detalles.rows) {
      // Revertir stock
      await client.query(`
        UPDATE ${T}tb_stock
        SET cantidad = cantidad - $1
        WHERE producto_id = $2
      `, [d.tb_cantidad, d.tb_idprodu]);

      // Registrar movimiento de salida
      await client.query(`
        INSERT INTO ${T}tb_movstock
        (producto_id, tipo, modulo, cantidad, referencia_id, fecha)
        VALUES ($1,'SALIDA','COMPRA',$2,$3,NOW())
      `, [d.tb_idprodu, d.tb_cantidad, id]);
    }

    // Eliminar detalle y compra
    await client.query(`DELETE FROM ${T}tb_detcomp WHERE tb_idcompr=$1`, [id]);
    await client.query(`DELETE FROM ${T}tb_compras WHERE tb_idcompra=$1`, [id]);

    await client.query("COMMIT");
    res.json({ message: "Compra eliminada correctamente" });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("ERROR eliminarCompra:", error);
    res.status(500).json({ message: "Error eliminando compra", error: error.message });
  } finally {
    client.release();
  }
};

// ===========================================================
// PDF COMPRA (pendiente)
// ===========================================================
export const imprimirFacturaCompra = async (req, res) => {
  res.status(501).json({ message: "PDF pendiente" });
};
