import db from "../db/index.js";

// ================= LISTAR REPORTES =================
export const listarReportes = async (req, res) => {
  try {
    const { nombre, generado_por, fecha_desde, fecha_hasta } = req.query;

    let query = `
      SELECT
        r.tb_idreport AS id,
        r.tb_nombrerp AS nombre_reporte,
        r.tb_fechgene AS fecha_generacion,
        r.tb_contrepo AS contenido_reporte,
        r.tb_generepo AS generado_por,       -- alias consistente
        p.tma_nombrep AS nombre_personal
      FROM tb_reportes r
      LEFT JOIN bdtma_personal p ON r.tb_generepo = p.tma_idperso
      WHERE 1=1
    `;
    const params = [];

    if (nombre) {
      params.push(`%${nombre}%`);
      query += ` AND r.tb_nombrerp ILIKE $${params.length}`;
    }

    if (generado_por) {
      params.push(generado_por);
      query += ` AND r.tb_generepo = $${params.length}`;
    }

    if (fecha_desde) {
      params.push(fecha_desde);
      query += ` AND r.tb_fechgene >= $${params.length}`;
    }

    if (fecha_hasta) {
      params.push(fecha_hasta);
      query += ` AND r.tb_fechgene <= $${params.length}`;
    }

    query += ` ORDER BY r.tb_fechgene DESC`;

    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error("Error listando reportes:", error);
    res.status(500).json({ message: "Error al obtener reportes" });
  }
};

// ================= CREAR REPORTE =================
export const crearReporte = async (req, res) => {
  try {
    const { nombre_reporte, fecha_generacion, contenido_reporte, generado_por } = req.body;

    if (!nombre_reporte || !fecha_generacion || !contenido_reporte || !generado_por) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    const insertQuery = `
      INSERT INTO tb_reportes (tb_nombrerp, tb_fechgene, tb_contrepo, tb_generepo)
      VALUES ($1, $2, $3, $4)
      RETURNING
        tb_idreport AS id,
        tb_nombrerp AS nombre_reporte,
        tb_fechgene AS fecha_generacion,
        tb_contrepo AS contenido_reporte,
        tb_generepo AS generado_por
    `;

    const { rows } = await db.query(insertQuery, [
      nombre_reporte,
      fecha_generacion,
      contenido_reporte,
      generado_por,
    ]);

    // Obtener nombre del personal
    const personalQuery = `SELECT tma_nombrep FROM bdtma_personal WHERE tma_idperso = $1`;
    const { rows: personalRows } = await db.query(personalQuery, [generado_por]);

    res.status(201).json({
      ...rows[0],
      nombre_personal: personalRows[0]?.tma_nombrep || "Desconocido",
    });
  } catch (error) {
    console.error("Error creando reporte:", error);
    res.status(500).json({ message: "Error al crear reporte" });
  }
};

// ================= ACTUALIZAR REPORTE =================
export const actualizarReporte = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_reporte, fecha_generacion, contenido_reporte, generado_por } = req.body;

    if (!nombre_reporte || !fecha_generacion || !contenido_reporte || !generado_por) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    const updateQuery = `
      UPDATE tb_reportes
      SET tb_nombrerp = $1, tb_fechgene = $2, tb_contrepo = $3, tb_generepo = $4
      WHERE tb_idreport = $5
      RETURNING
        tb_idreport AS id,
        tb_nombrerp AS nombre_reporte,
        tb_fechgene AS fecha_generacion,
        tb_contrepo AS contenido_reporte,
        tb_generepo AS generado_por
    `;

    const { rows } = await db.query(updateQuery, [
      nombre_reporte,
      fecha_generacion,
      contenido_reporte,
      generado_por,
      id,
    ]);

    if (rows.length === 0) return res.status(404).json({ message: "Reporte no encontrado" });

    const personalQuery = `SELECT tma_nombrep FROM bdtma_personal WHERE tma_idperso = $1`;
    const { rows: personalRows } = await db.query(personalQuery, [generado_por]);

    res.json({
      ...rows[0],
      nombre_personal: personalRows[0]?.tma_nombrep || "Desconocido",
    });
  } catch (error) {
    console.error("Error actualizando reporte:", error);
    res.status(500).json({ message: "Error al actualizar reporte" });
  }
};

// ================= ELIMINAR REPORTE =================
export const eliminarReporte = async (req, res) => {
  try {
    const { id } = req.params;

    const deleteQuery = `DELETE FROM tb_reportes WHERE tb_idreport = $1 RETURNING tb_idreport AS id`;
    const { rows } = await db.query(deleteQuery, [id]);

    if (rows.length === 0) return res.status(404).json({ message: "Reporte no encontrado" });

    res.json({ message: "Reporte eliminado", id: rows[0].id });
  } catch (error) {
    console.error("Error eliminando reporte:", error);
    res.status(500).json({ message: "Error al eliminar reporte" });
  }
};
