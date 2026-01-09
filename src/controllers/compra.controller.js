// src/controllers/comprasController.js
import db from "../db/index.js";
const T = db.SCHEMA_PREFIX || "";
import PDFDocument from "pdfkit";

// -----------------------------------------------------------
// CREAR COMPRA
// -----------------------------------------------------------
export const crearCompra = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { idProveedor, estado, tb_detalle, tb_totalcom, tb_fechcomp } = req.body;
    if (!idProveedor || !estado || !tb_detalle || !Array.isArray(tb_detalle) || !tb_detalle.length) {
      return res.status(400).json({ message: "Faltan datos" });
    }

    await client.query("BEGIN");

    const queryCompra = `
      INSERT INTO ${T}tb_compras
      (tb_idproveed, tb_estadcom, tb_totalcom, tb_fechcomp)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const compraResult = await client.query(queryCompra, [
      Number(idProveedor),
      estado,
      tb_totalcom,
      tb_fechcomp,
    ]);
    const idCompra = compraResult.rows[0].tb_idcompra;

    const queryDetalle = `
      INSERT INTO ${T}tb_detcomp
      (tb_idcompr, tb_idprodu, tb_cantidad, tb_precunic, tb_subtotal)
      VALUES ($1, $2, $3, $4, $5);
    `;
    for (const item of tb_detalle) {
      await client.query(queryDetalle, [
        idCompra,
        item.producto_id,
        item.cantidad,
        item.precio_unitario_compra,
        item.subtotal,
      ]);
    }

    await client.query("COMMIT");
    return res.status(201).json({ message: "Compra creada", compra: compraResult.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("ERROR crearCompra:", error);
    return res.status(500).json({ message: "Error en servidor", error });
  } finally {
    client.release();
  }
};

// -----------------------------------------------------------
// OBTENER DETALLE DE UNA COMPRA (incluye unidad y producto_id)
// -----------------------------------------------------------
export const obtenerDetalleCompra = async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT 
        d.tb_iddetco AS id_detalle,
        d.tb_idprodu,
        d.tb_cantidad,
        d.tb_precunic,
        d.tb_subtotal,
        p.tma_nombrep AS nombre_producto,
        p.tma_unidade AS unidad
      FROM ${T}tb_detcomp d
      JOIN ${T}bdtma_produc p ON d.tb_idprodu = p.tma_idprodu
      WHERE d.tb_idcompr = $1
      ORDER BY d.tb_iddetco;
    `;
    const result = await db.query(query, [id]);
    if (!result.rows.length) {
      return res.status(404).json({ message: "No hay detalles para esta compra" });
    }
    res.json(result.rows);
  } catch (error) {
    console.error("ERROR obtenerDetalleCompra:", error);
    res.status(500).json({ message: "Error en servidor", error });
  }
};

// -----------------------------------------------------------
// ACTUALIZAR COMPRA
// -----------------------------------------------------------
export const actualizarCompra = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { id } = req.params;
    const { idProveedor, estado, tb_detalle, tb_totalcom } = req.body;
    if (!idProveedor || !estado || !tb_detalle || !tb_detalle.length) {
      return res.status(400).json({ message: "Faltan datos" });
    }

    await client.query("BEGIN");

    const queryUpdateCompra = `
      UPDATE ${T}tb_compras
      SET tb_idproveed=$1, tb_estadcom=$2, tb_totalcom=$3
      WHERE tb_idcompra=$4 RETURNING *;
    `;
    const result = await client.query(queryUpdateCompra, [
      idProveedor,
      estado,
      tb_totalcom,
      id,
    ]);
    if (!result.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Compra no encontrada" });
    }

    await client.query(`DELETE FROM ${T}tb_detcomp WHERE tb_idcompr = $1`, [id]);

    const queryDetalle = `
      INSERT INTO ${T}tb_detcomp
      (tb_idcompr, tb_idprodu, tb_cantidad, tb_precunic, tb_subtotal)
      VALUES ($1,$2,$3,$4,$5);
    `;
    for (const item of tb_detalle) {
      await client.query(queryDetalle, [
        id,
        item.producto_id,
        item.cantidad,
        item.precio_unitario_compra,
        item.subtotal,
      ]);
    }

    await client.query("COMMIT");
    res.json({ message: "Compra actualizada", compra: result.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("ERROR actualizarCompra:", error);
    res.status(500).json({ message: "Error en servidor", error });
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
    res.json(result.rows);
  } catch (error) {
    console.error("ERROR listarCompras:", error);
    res.status(500).json([]);
  }
};

// -----------------------------------------------------------
// OBTENER COMPRA POR ID (con nombre de proveedor)
// -----------------------------------------------------------
export const obtenerCompraPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT c.*, p.tma_nombre AS proveedor
      FROM ${T}tb_compras c
      JOIN ${T}bdtma_proveed p ON c.tb_idproveed = p.tma_idprove
      WHERE c.tb_idcompra = $1
    `;
    const result = await db.query(query, [id]);
    if (!result.rows.length) return res.status(404).json({ message: "Compra no encontrada" });
    res.json(result.rows[0]);
  } catch (error) {
    console.error("ERROR obtenerCompraPorId:", error);
    res.status(500).json({ message: "Error en servidor", error });
  }
};

// -----------------------------------------------------------
// ELIMINAR COMPRA
// -----------------------------------------------------------
export const eliminarCompra = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { id } = req.params;
    await client.query("BEGIN");
    await client.query(`DELETE FROM ${T}tb_detcomp WHERE tb_idcompr=$1`, [id]);
    const result = await client.query(`DELETE FROM ${T}tb_compras WHERE tb_idcompra=$1 RETURNING *`, [id]);
    if (!result.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Compra no encontrada" });
    }
    await client.query("COMMIT");
    res.json({ message: "Compra eliminada correctamente" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("ERROR eliminarCompra:", error);
    res.status(500).json({ message: "Error en servidor", error });
  } finally {
    client.release();
  }
};

// -----------------------------------------------------------
// IMPRIMIR FACTURA DE COMPRA (PDF)
// -----------------------------------------------------------
export const imprimirFacturaCompra = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener compra con nombre de proveedor
    const compraQuery = `
      SELECT c.*, p.tma_nombrep AS proveedor
      FROM ${T}tb_compras c
      JOIN ${T}bdtma_proveed p ON c.tb_idproveed = p.tma_idprove
      WHERE c.tb_idcompra = $1
    `;
    const compraResult = await db.query(compraQuery, [id]);
    if (!compraResult.rows.length) return res.status(404).json({ message: "Compra no encontrada" });
    const compra = compraResult.rows[0];

    // Obtener detalles
    const detalleQuery = `
      SELECT d.*, pr.tma_nombrep AS nombre_producto, pr.tma_unidade AS unidad
      FROM ${T}tb_detcomp d
      JOIN ${T}bdtma_produc pr ON d.tb_idprodu = pr.tma_idprodu
      WHERE d.tb_idcompr = $1
      ORDER BY d.tb_iddetco
    `;
    const detalleResult = await db.query(detalleQuery, [id]);
    const detalles = detalleResult.rows;

    // Crear PDF
    const doc = new PDFDocument({ margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=factura_compra_${compra.tb_idcompra}.pdf`);
    doc.pipe(res);

    // ====== ENCABEZADO ======
    doc
      .fontSize(18)
      .text("FACTURA DE COMPRA", { align: "center" })
      .moveDown();
    doc.fontSize(12);
    doc.text(`Compra Nº: ${compra.tb_idcompra}`, { align: "left" });
    doc.text(`Fecha: ${new Date(compra.tb_fechcomp).toLocaleDateString('es-ES')}`, { align: "left" });
    doc.text(`Proveedor: ${compra.proveedor}`, { align: "left" });
    doc.text(`Estado: ${compra.tb_estadcom}`, { align: "left" });
    doc.moveDown();

    // ====== TABLA DETALLES ======
    doc.fontSize(11).text("Detalle de productos", { underline: true });
    doc.moveDown(0.5);

    const tableTop = doc.y;
    const col = { producto: 40, cantidad: 300, precio: 380, subtotal: 460 };

    doc.font("Helvetica-Bold");
    doc.text("Producto", col.producto, tableTop);
    doc.text("Cant.", col.cantidad, tableTop);
    doc.text("Precio", col.precio, tableTop);
    doc.text("Subtotal", col.subtotal, tableTop);
    doc.moveDown(0.5);
    doc.font("Helvetica");

    let total = 0;
    detalles.forEach(d => {
      const y = doc.y;
      doc.text(d.nombre_producto, col.producto, y);
      doc.text(`${d.tb_cantidad} ${d.unidad}`, col.cantidad, y);
      doc.text(`$${Number(d.tb_precunic).toFixed(2)}`, col.precio, y);
      doc.text(`$${Number(d.tb_subtotal).toFixed(2)}`, col.subtotal, y);
      total += Number(d.tb_subtotal);
      doc.moveDown(0.5);
    });

    doc.moveDown();
    doc.font("Helvetica-Bold").text(`TOTAL: $${total.toFixed(2)}`, { align: "right" });

    // ====== PIE ======
    doc.moveDown(2);
    doc.fontSize(9).text("Gracias por su compra", { align: "center" });

    doc.end();
  } catch (error) {
    console.error("ERROR PDF COMPRA:", error);
    res.status(500).json({ message: "Error generando factura PDF", error });
  }
};
