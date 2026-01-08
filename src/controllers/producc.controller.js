import db from "../db/index.js";

// ================== CREAR PRODUCCIÓN ==================
export const createProduccion = async (req, res) => {
  try {
    const {
      tb_idprodut,
      tb_fechsiem,
      tb_fechcose,
      tb_canespel,
      tb_canoscoh,
      tb_areacult,
      tb_costprod,
      tb_idrespon
    } = req.body;

    // Validación segura
    if (
      tb_idprodut == null ||
      !tb_fechsiem ||
      !tb_fechcose ||
      tb_canespel == null ||
      tb_areacult == null ||
      tb_costprod == null ||
      tb_idrespon == null
    ) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    const result = await db.query(
      `INSERT INTO tb_producc
       (tb_idprodut, tb_fechsiem, tb_fechcose, tb_canespel, tb_canoscoh, tb_areacult, tb_costprod, tb_idrespon)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        tb_idprodut,
        tb_fechsiem,
        tb_fechcose,
        parseFloat(tb_canespel),
        tb_canoscoh ? parseFloat(tb_canoscoh) : 0,
        parseFloat(tb_areacult),
        parseFloat(tb_costprod),
        tb_idrespon
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creando producción:", error);
    res.status(500).json({
      message: "Error al crear producción",
      error: error.message
    });
  }
};

// ================== LISTAR PRODUCCIÓN ==================
export const getProduccion = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
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
       LEFT JOIN bdtma_produc prod
         ON prod.tma_idprodu = p.tb_idprodut
       LEFT JOIN bdtma_personal per
         ON per.tma_idperso = p.tb_idrespon
       ORDER BY p.tb_idproduc ASC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error obteniendo producción:", error);
    res.status(500).json({
      message: "Error al obtener producción",
      error: error.message
    });
  }
};

// ================== ELIMINAR PRODUCCIÓN ==================
export const deleteProduccion = async (req, res) => {
  try {
    const { id } = req.params;

    // Borra la producción según el id
    const result = await db.query(
      `DELETE FROM tb_producc WHERE tb_idproduc = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Producción no encontrada' });
    }

    res.json({ message: 'Producción eliminada correctamente', deleted: result.rows[0] });
  } catch (error) {
    console.error('Error eliminando producción:', error);
    res.status(500).json({ message: 'Error al eliminar producción', error: error.message });
  }
};

// ================== EDITAR PRODUCCIÓN ==================
export const updateProduccion = async (req, res) => {
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
      tb_idrespon
    } = req.body;

    // Validación básica
    if (
      tb_idprodut == null ||
      !tb_fechsiem ||
      !tb_fechcose ||
      tb_canespel == null ||
      tb_areacult == null ||
      tb_costprod == null ||
      tb_idrespon == null
    ) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    // Actualiza la producción
    const result = await db.query(
      `UPDATE tb_producc
       SET tb_idprodut = $1,
           tb_fechsiem = $2,
           tb_fechcose = $3,
           tb_canespel = $4,
           tb_canoscoh = $5,
           tb_areacult = $6,
           tb_costprod = $7,
           tb_idrespon = $8
       WHERE tb_idproduc = $9
       RETURNING *`,
      [
        tb_idprodut,
        tb_fechsiem,
        tb_fechcose,
        parseFloat(tb_canespel),
        tb_canoscoh ? parseFloat(tb_canoscoh) : 0,
        parseFloat(tb_areacult),
        parseFloat(tb_costprod),
        tb_idrespon,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Producción no encontrada' });
    }

    res.json({ message: 'Producción actualizada correctamente', updated: result.rows[0] });

  } catch (error) {
    console.error('Error actualizando producción:', error);
    res.status(500).json({ message: 'Error al actualizar producción', error: error.message });
  }
};
