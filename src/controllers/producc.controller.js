import db from "../db/index.js";

// ===========================================================
// CREAR PRODUCCIÓN + STOCK + MOVIMIENTOS
// ===========================================================
export const createProduccion = async (req, res) => {
  const client = await db.pool.connect();

  try {
    const {
      tb_idprodut,          // Producto COSECHA
      tb_fechsiem,
      tb_fechcose,
      tb_canespel,
      tb_canoscoh,
      tb_areacult,
      tb_costprod,
      tb_idrespon,
      insumos               // [{ producto_id, cantidad }]
    } = req.body;

    if (
      tb_idprodut == null ||
      !tb_fechsiem ||
      !tb_fechcose ||
      tb_canespel == null ||
      tb_canoscoh == null ||
      !Array.isArray(insumos) ||
      insumos.length === 0 ||
      !tb_areacult ||
      !tb_costprod ||
      !tb_idrespon
    ) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    await client.query("BEGIN");

    // Validar producto cosecha
    const prodCheck = await client.query(
      `SELECT tma_tipo FROM bdtma_produc WHERE tma_idprodu = $1`,
      [tb_idprodut]
    );

    if (!prodCheck.rows.length || prodCheck.rows[0].tma_tipo.trim().toUpperCase() !== "COSECHA") {
      throw new Error("El producto producido debe ser tipo COSECHA");
    }

    // Crear producción
    const produccionRes = await client.query(
      `INSERT INTO tb_producc
       (tb_idprodut, tb_fechsiem, tb_fechcose, tb_canespel, tb_canoscoh, tb_areacult, tb_costprod, tb_idrespon)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [tb_idprodut, tb_fechsiem, tb_fechcose, tb_canespel, tb_canoscoh, tb_areacult, tb_costprod, tb_idrespon]
    );

    const produccionId = produccionRes.rows[0].tb_idproduc;

    // ================= CONSUMO DE INSUMOS =================
    for (const insumo of insumos) {
      const insCheck = await client.query(
        `SELECT tma_tipo FROM bdtma_produc WHERE tma_idprodu = $1`,
        [insumo.producto_id]
      );

      if (!insCheck.rows.length || insCheck.rows[0].tma_tipo.trim().toUpperCase() !== "INSUMO") {
        throw new Error("Solo se pueden consumir productos tipo INSUMO");
      }

      await client.query(
        `INSERT INTO tb_detproducc (tb_idproducc, producto_id, cantidad)
         VALUES ($1,$2,$3)`,
        [produccionId, insumo.producto_id, insumo.cantidad]
      );

      await client.query(
        `UPDATE tb_stock SET cantidad = cantidad - $1 WHERE producto_id = $2`,
        [insumo.cantidad, insumo.producto_id]
      );

      await client.query(
        `INSERT INTO tb_movstock (producto_id, tipo, modulo, cantidad, referencia_id, fecha)
         VALUES ($1,'SALIDA','PRODUCCION',$2,$3,NOW())`,
        [insumo.producto_id, insumo.cantidad, produccionId]
      );
    }

    // ================= ENTRADA DE COSECHA =================
    await client.query(
      `INSERT INTO tb_stock (producto_id, cantidad)
       VALUES ($1,$2)
       ON CONFLICT (producto_id)
       DO UPDATE SET cantidad = tb_stock.cantidad + EXCLUDED.cantidad`,
      [tb_idprodut, tb_canoscoh]
    );

    await client.query(
      `INSERT INTO tb_movstock (producto_id, tipo, modulo, cantidad, referencia_id, fecha)
       VALUES ($1,'ENTRADA','PRODUCCION',$2,$3,NOW())`,
      [tb_idprodut, tb_canoscoh, produccionId]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Producción registrada correctamente",
      produccion: produccionRes.rows[0]
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("ERROR producción:", error);
    res.status(500).json({ message: "Error al crear producción", error: error.message });
  } finally {
    client.release();
  }
};

// ===========================================================
// LISTAR PRODUCCIÓN
// ===========================================================
export const getProduccion = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        p.tb_idproduc AS id,
        p.tb_idprodut,
        prod.tma_nombrep AS producto,
        p.tb_fechsiem AS fecha_siembra,
        p.tb_fechcose AS fecha_cosecha,
        p.tb_canespel AS cantidad_esperada,
        p.tb_canoscoh AS cantidad_cosechada,
        p.tb_areacult AS area_cultivo,
        p.tb_costprod AS costo_produccion,
        p.tb_idrespon,
        per.tma_nombrep AS responsable
      FROM tb_producc p
      LEFT JOIN bdtma_produc prod ON prod.tma_idprodu = p.tb_idprodut
      LEFT JOIN bdtma_personal per ON per.tma_idperso = p.tb_idrespon
      ORDER BY p.tb_idproduc ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error obteniendo producción:", error);
    res.status(500).json({ message: "Error al obtener producción" });
  }
};

// ===========================================================
// ELIMINAR PRODUCCIÓN
// ===========================================================
export const deleteProduccion = async (req, res) => {
  const client = await db.pool.connect();

  try {
    const { id } = req.params;
    await client.query("BEGIN");

    const insumos = await client.query(
      `SELECT * FROM tb_detproducc WHERE tb_idproducc = $1`,
      [id]
    );

    for (const i of insumos.rows) {
      await client.query(
        `UPDATE tb_stock SET cantidad = cantidad + $1 WHERE producto_id = $2`,
        [i.cantidad, i.producto_id]
      );

      await client.query(
        `INSERT INTO tb_movstock (producto_id, tipo, modulo, cantidad, referencia_id, fecha)
         VALUES ($1,'ENTRADA','PRODUCCION',$2,$3,NOW())`,
        [i.producto_id, i.cantidad, id]
      );
    }

    const prod = await client.query(
      `SELECT tb_canoscoh, tb_idprodut FROM tb_producc WHERE tb_idproduc = $1`,
      [id]
    );

    if (prod.rows.length) {
      const cosecha = prod.rows[0];

      await client.query(
        `UPDATE tb_stock SET cantidad = cantidad - $1 WHERE producto_id = $2`,
        [cosecha.tb_canoscoh, cosecha.tb_idprodut]
      );

      await client.query(
        `INSERT INTO tb_movstock (producto_id, tipo, modulo, cantidad, referencia_id, fecha)
         VALUES ($1,'SALIDA','PRODUCCION',$2,$3,NOW())`,
        [cosecha.tb_idprodut, cosecha.tb_canoscoh, id]
      );
    }

    await client.query(`DELETE FROM tb_detproducc WHERE tb_idproducc = $1`, [id]);
    await client.query(`DELETE FROM tb_producc WHERE tb_idproduc = $1`, [id]);

    await client.query("COMMIT");

    res.json({ message: "Producción eliminada correctamente" });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error eliminando producción:", error);
    res.status(500).json({ message: "Error al eliminar producción" });
  } finally {
    client.release();
  }
};

// ===========================================================
// ACTUALIZAR PRODUCCIÓN
// ===========================================================
export const updateProduccion = async (req, res) => {
  const client = await db.pool.connect();

  try {
    const { id } = req.params;
    const {
      tb_idprodut,
      tb_fechsiem,
      tb_fechcose,
      tb_canespel,
      tb_canoscoh,
      tb_areacult,
      tb_costprod,
      tb_idrespon,
      insumos
    } = req.body;

    if (
      tb_idprodut == null ||
      !tb_fechsiem ||
      !tb_fechcose ||
      tb_canespel == null ||
      tb_canoscoh == null ||
      !Array.isArray(insumos) ||
      !tb_areacult ||
      !tb_costprod ||
      !tb_idrespon
    ) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    await client.query("BEGIN");

    const oldProduccion = await client.query(
      `SELECT * FROM tb_producc WHERE tb_idproduc = $1`,
      [id]
    );

    if (!oldProduccion.rows.length) throw new Error("Producción no encontrada");

    const oldInsumos = await client.query(
      `SELECT * FROM tb_detproducc WHERE tb_idproducc = $1`,
      [id]
    );

    // Revertir insumos
    for (const i of oldInsumos.rows) {
      await client.query(
        `UPDATE tb_stock SET cantidad = cantidad + $1 WHERE producto_id = $2`,
        [i.cantidad, i.producto_id]
      );

      await client.query(
        `INSERT INTO tb_movstock (producto_id, tipo, modulo, cantidad, referencia_id, fecha)
         VALUES ($1,'ENTRADA','PRODUCCION',$2,$3,NOW())`,
        [i.producto_id, i.cantidad, id]
      );
    }

    // Revertir cosecha
    const oldCosecha = oldProduccion.rows[0];
    await client.query(
      `UPDATE tb_stock SET cantidad = cantidad - $1 WHERE producto_id = $2`,
      [oldCosecha.tb_canoscoh, oldCosecha.tb_idprodut]
    );

    await client.query(
      `INSERT INTO tb_movstock (producto_id, tipo, modulo, cantidad, referencia_id, fecha)
       VALUES ($1,'SALIDA','PRODUCCION',$2,$3,NOW())`,
      [oldCosecha.tb_idprodut, oldCosecha.tb_canoscoh, id]
    );

    await client.query(`DELETE FROM tb_detproducc WHERE tb_idproducc = $1`, [id]);

    // Nuevos insumos
    for (const insumo of insumos) {
      await client.query(
        `INSERT INTO tb_detproducc (tb_idproducc, producto_id, cantidad)
         VALUES ($1,$2,$3)`,
        [id, insumo.producto_id, insumo.cantidad]
      );

      await client.query(
        `UPDATE tb_stock SET cantidad = cantidad - $1 WHERE producto_id = $2`,
        [insumo.cantidad, insumo.producto_id]
      );

      await client.query(
        `INSERT INTO tb_movstock (producto_id, tipo, modulo, cantidad, referencia_id, fecha)
         VALUES ($1,'SALIDA','PRODUCCION',$2,$3,NOW())`,
        [insumo.producto_id, insumo.cantidad, id]
      );
    }

    // Nueva cosecha
    await client.query(
      `INSERT INTO tb_stock (producto_id, cantidad)
       VALUES ($1,$2)
       ON CONFLICT (producto_id)
       DO UPDATE SET cantidad = tb_stock.cantidad + EXCLUDED.cantidad`,
      [tb_idprodut, tb_canoscoh]
    );

    await client.query(
      `INSERT INTO tb_movstock (producto_id, tipo, modulo, cantidad, referencia_id, fecha)
       VALUES ($1,'ENTRADA','PRODUCCION',$2,$3,NOW())`,
      [tb_idprodut, tb_canoscoh, id]
    );

    await client.query(
      `UPDATE tb_producc
       SET tb_idprodut=$1, tb_fechsiem=$2, tb_fechcose=$3,
           tb_canespel=$4, tb_canoscoh=$5, tb_areacult=$6,
           tb_costprod=$7, tb_idrespon=$8
       WHERE tb_idproduc=$9`,
      [tb_idprodut, tb_fechsiem, tb_fechcose, tb_canespel, tb_canoscoh, tb_areacult, tb_costprod, tb_idrespon, id]
    );

    await client.query("COMMIT");
    res.json({ message: "Producción actualizada correctamente" });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("ERROR actualizar producción:", error);
    res.status(500).json({ message: "Error al actualizar producción", error: error.message });
  } finally {
    client.release();
  }
};
