/**
 * Gastos Controller — async/await con @libsql/client (compatible Turso + local)
 */
const { db } = require('../database/db');

// =============================================
// SQL
// =============================================
const SQL = {
  getAll:           `SELECT * FROM gastos WHERE eliminado = 0 ORDER BY created_at DESC`,
  filterByCategoria:`SELECT * FROM gastos WHERE categoria = ? AND eliminado = 0 ORDER BY created_at DESC`,
  getById:          `SELECT * FROM gastos WHERE id = ? AND eliminado = 0`,
  create: `
    INSERT INTO gastos (fecha, categoria, descripcion, cantidad, monto, total)
    VALUES (datetime('now','localtime'), ?, ?, ?, ?, ?)`,
  update: `
    UPDATE gastos SET categoria = ?, descripcion = ?, cantidad = ?, monto = ?, total = ?
    WHERE id = ? AND eliminado = 0`,
  softDelete:       `UPDATE gastos SET eliminado = 1 WHERE id = ?`,
  stats: `
    SELECT
      COUNT(*) as total_registros,
      COALESCE(SUM(total), 0) as gastos_totales,
      COALESCE(SUM(CASE WHEN categoria = 'saco_comida' THEN total ELSE 0 END), 0) as gasto_comida,
      COALESCE(SUM(CASE WHEN categoria = 'pollos_cria' THEN total ELSE 0 END), 0) as gasto_pollos,
      COALESCE(SUM(CASE WHEN categoria = 'otro'        THEN total ELSE 0 END), 0) as gasto_otros
    FROM gastos WHERE eliminado = 0`
};

// =============================================
// VALIDACIÓN
// =============================================
function validateGasto(data) {
  const errors = [];
  if (!data.categoria || !['saco_comida', 'pollos_cria', 'otro'].includes(data.categoria))
    errors.push('Selecciona una categoría válida');
  if (data.categoria === 'otro' && (!data.descripcion || data.descripcion.trim().length < 2))
    errors.push('Para categoría "Otro", la descripción es obligatoria (mín. 2 caracteres)');
  if (!data.monto || parseFloat(data.monto) <= 0)
    errors.push('El monto debe ser mayor a 0');
  if (data.cantidad !== undefined && parseInt(data.cantidad) <= 0)
    errors.push('La cantidad debe ser mayor a 0');
  return errors;
}

// =============================================
// CONTROLADORES
// =============================================

async function getAll(req, res) {
  try {
    const { categoria } = req.query;
    let result;
    if (categoria && ['saco_comida', 'pollos_cria', 'otro'].includes(categoria)) {
      result = await db.execute({ sql: SQL.filterByCategoria, args: [categoria] });
    } else {
      result = await db.execute(SQL.getAll);
    }
    res.json({ success: true, data: result.rows, count: result.rows.length });
  } catch (error) {
    console.error('Error al obtener gastos:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
}

async function getById(req, res) {
  try {
    const result = await db.execute({ sql: SQL.getById, args: [req.params.id] });
    const gasto  = result.rows[0];
    if (!gasto) return res.status(404).json({ success: false, error: 'Gasto no encontrado' });
    res.json({ success: true, data: gasto });
  } catch (error) {
    console.error('Error al obtener gasto:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
}

async function create(req, res) {
  try {
    const errors = validateGasto(req.body);
    if (errors.length > 0) return res.status(400).json({ success: false, errors });

    const { categoria, descripcion, cantidad, monto } = req.body;
    const cant  = parseInt(cantidad) || 1;
    const montoV = parseFloat(monto);
    const total  = parseFloat((cant * montoV).toFixed(2));

    const ins = await db.execute({ sql: SQL.create, args: [
      categoria, (descripcion || '').trim(), cant, montoV, total
    ]});

    const row = await db.execute({ sql: SQL.getById, args: [ins.lastInsertRowid] });
    res.status(201).json({ success: true, data: row.rows[0], message: 'Gasto registrado exitosamente' });
  } catch (error) {
    console.error('Error al crear gasto:', error);
    res.status(500).json({ success: false, error: 'Error al registrar el gasto' });
  }
}

async function update(req, res) {
  try {
    const existing = (await db.execute({ sql: SQL.getById, args: [req.params.id] })).rows[0];
    if (!existing) return res.status(404).json({ success: false, error: 'Gasto no encontrado' });

    const errors = validateGasto(req.body);
    if (errors.length > 0) return res.status(400).json({ success: false, errors });

    const { categoria, descripcion, cantidad, monto } = req.body;
    const cant   = parseInt(cantidad) || 1;
    const montoV = parseFloat(monto);
    const total  = parseFloat((cant * montoV).toFixed(2));

    await db.execute({ sql: SQL.update, args: [
      categoria, (descripcion || '').trim(), cant, montoV, total, parseInt(req.params.id)
    ]});

    const row = await db.execute({ sql: SQL.getById, args: [req.params.id] });
    res.json({ success: true, data: row.rows[0], message: 'Gasto actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar gasto:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar el gasto' });
  }
}

async function remove(req, res) {
  try {
    const existing = (await db.execute({ sql: SQL.getById, args: [req.params.id] })).rows[0];
    if (!existing) return res.status(404).json({ success: false, error: 'Gasto no encontrado' });
    await db.execute({ sql: SQL.softDelete, args: [req.params.id] });
    res.json({ success: true, message: 'Gasto eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar gasto:', error);
    res.status(500).json({ success: false, error: 'Error al eliminar el gasto' });
  }
}

async function getStats(req, res) {
  try {
    const result = await db.execute(SQL.stats);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error al obtener estadísticas de gastos:', error);
    res.status(500).json({ success: false, error: 'Error al obtener estadísticas' });
  }
}

module.exports = { getAll, getById, create, update, remove, getStats };
