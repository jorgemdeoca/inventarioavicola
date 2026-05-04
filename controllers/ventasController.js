/**
 * Ventas Controller — async/await con @libsql/client (compatible Turso + local)
 */
const { db } = require('../database/db');

// =============================================
// HELPERS de consulta
// =============================================
const SQL = {
  getAll:          `SELECT * FROM ventas WHERE eliminado = 0 ORDER BY created_at DESC`,
  search:          `SELECT * FROM ventas WHERE cliente_nombre LIKE ? AND eliminado = 0 ORDER BY created_at DESC`,
  getById:         `SELECT * FROM ventas WHERE id = ? AND eliminado = 0`,
  create: `
    INSERT INTO ventas (fecha, cliente_nombre, descripcion, cantidad_pollos,
      precio_por_kg, peso_total_kg, total_venta, estado_pago, monto_pagado, monto_pendiente)
    VALUES (datetime('now','localtime'), ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  update: `
    UPDATE ventas SET
      cliente_nombre = ?, descripcion = ?, cantidad_pollos = ?,
      precio_por_kg = ?, peso_total_kg = ?, total_venta = ?,
      estado_pago = ?, monto_pagado = ?, monto_pendiente = ?
    WHERE id = ?`,
  updatePago:      `UPDATE ventas SET monto_pagado = ?, monto_pendiente = ?, estado_pago = ? WHERE id = ?`,
  softDelete:      `UPDATE ventas SET eliminado = 1 WHERE id = ?`,
  stats: `
    SELECT
      COUNT(*) as total_ventas,
      COALESCE(SUM(cantidad_pollos), 0) as total_pollos,
      COALESCE(SUM(peso_total_kg), 0) as total_peso_kg,
      COALESCE(SUM(total_venta), 0) as total_ganancias,
      COALESCE(SUM(monto_pagado), 0) as total_cobrado,
      COALESCE(SUM(monto_pendiente), 0) as total_pendiente,
      COALESCE(AVG(precio_por_kg), 0) as precio_promedio_kg,
      COALESCE(AVG(peso_total_kg), 0) as peso_promedio_kg,
      COUNT(CASE WHEN estado_pago = 'pagado'   THEN 1 END) as ventas_pagadas,
      COUNT(CASE WHEN estado_pago = 'parcial'  THEN 1 END) as ventas_parciales,
      COUNT(CASE WHEN estado_pago = 'pendiente'THEN 1 END) as ventas_pendientes
    FROM ventas WHERE eliminado = 0`
};

// =============================================
// VALIDACIÓN
// =============================================
function validateVenta(data) {
  const errors = [];
  if (!data.cliente_nombre || data.cliente_nombre.trim().length < 2)
    errors.push('El nombre del cliente debe tener al menos 2 caracteres');
  if (!data.cantidad_pollos || parseInt(data.cantidad_pollos) <= 0)
    errors.push('La cantidad de pollos debe ser mayor a 0');
  if (!data.precio_por_kg || parseFloat(data.precio_por_kg) <= 0)
    errors.push('El precio por Kg debe ser mayor a 0');
  if (!data.peso_total_kg || parseFloat(data.peso_total_kg) <= 0)
    errors.push('El peso total debe ser mayor a 0');
  if (data.monto_pagado !== undefined && parseFloat(data.monto_pagado) < 0)
    errors.push('El monto pagado no puede ser negativo');
  return errors;
}

function calcPago(peso, precio, montoPagado) {
  const total_venta  = parseFloat((peso * precio).toFixed(2));
  const pagado       = parseFloat(montoPagado) || 0;
  const pendiente    = Math.max(0, parseFloat((total_venta - pagado).toFixed(2)));
  const estado_pago  = pagado >= total_venta ? 'pagado' : pagado > 0 ? 'parcial' : 'pendiente';
  return { total_venta, pagado, pendiente, estado_pago };
}

// =============================================
// CONTROLADORES
// =============================================

async function getAll(req, res) {
  try {
    const { q, estado } = req.query;
    let result;

    if (q && q.trim().length > 0) {
      result = await db.execute({ sql: SQL.search, args: [`%${q.trim()}%`] });
    } else {
      result = await db.execute(SQL.getAll);
    }

    let ventas = result.rows;
    if (estado && ['pendiente', 'parcial', 'pagado'].includes(estado)) {
      ventas = ventas.filter(v => v.estado_pago === estado);
    }
    res.json({ success: true, data: ventas, count: ventas.length });
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
}

async function getById(req, res) {
  try {
    const result = await db.execute({ sql: SQL.getById, args: [req.params.id] });
    const venta  = result.rows[0];
    if (!venta) return res.status(404).json({ success: false, error: 'Venta no encontrada' });
    res.json({ success: true, data: venta });
  } catch (error) {
    console.error('Error al obtener venta:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
}

async function create(req, res) {
  try {
    const errors = validateVenta(req.body);
    if (errors.length > 0) return res.status(400).json({ success: false, errors });

    const { cliente_nombre, descripcion, cantidad_pollos, precio_por_kg, peso_total_kg, monto_pagado } = req.body;
    const { total_venta, pagado, pendiente, estado_pago } = calcPago(
      parseFloat(peso_total_kg), parseFloat(precio_por_kg), monto_pagado
    );

    const ins = await db.execute({ sql: SQL.create, args: [
      cliente_nombre.trim(),
      (descripcion || '').trim(),
      parseInt(cantidad_pollos),
      parseFloat(precio_por_kg),
      parseFloat(peso_total_kg),
      total_venta, estado_pago, pagado, pendiente
    ]});

    const row = await db.execute({ sql: SQL.getById, args: [ins.lastInsertRowid] });
    res.status(201).json({ success: true, data: row.rows[0], message: 'Venta registrada exitosamente' });
  } catch (error) {
    console.error('Error al crear venta:', error);
    res.status(500).json({ success: false, error: 'Error al registrar la venta' });
  }
}

async function update(req, res) {
  try {
    const existing = (await db.execute({ sql: SQL.getById, args: [req.params.id] })).rows[0];
    if (!existing) return res.status(404).json({ success: false, error: 'Venta no encontrada' });

    const errors = validateVenta(req.body);
    if (errors.length > 0) return res.status(400).json({ success: false, errors });

    const { cliente_nombre, descripcion, cantidad_pollos, precio_por_kg, peso_total_kg, monto_pagado } = req.body;
    const { total_venta, pagado, pendiente, estado_pago } = calcPago(
      parseFloat(peso_total_kg), parseFloat(precio_por_kg), monto_pagado
    );

    await db.execute({ sql: SQL.update, args: [
      cliente_nombre.trim(),
      (descripcion || '').trim(),
      parseInt(cantidad_pollos),
      parseFloat(precio_por_kg),
      parseFloat(peso_total_kg),
      total_venta, estado_pago, pagado, pendiente,
      parseInt(req.params.id)
    ]});

    const row = await db.execute({ sql: SQL.getById, args: [req.params.id] });
    res.json({ success: true, data: row.rows[0], message: 'Venta actualizada exitosamente' });
  } catch (error) {
    console.error('Error al actualizar venta:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar la venta' });
  }
}

async function updatePago(req, res) {
  try {
    const existing = (await db.execute({ sql: SQL.getById, args: [req.params.id] })).rows[0];
    if (!existing) return res.status(404).json({ success: false, error: 'Venta no encontrada' });

    const pagado = parseFloat(req.body.monto_pagado);
    if (isNaN(pagado) || pagado < 0)
      return res.status(400).json({ success: false, errors: ['El monto pagado debe ser un número válido ≥ 0'] });
    if (pagado > existing.total_venta)
      return res.status(400).json({ success: false, errors: ['El monto pagado no puede superar el total de la venta'] });

    const pendiente  = Math.max(0, parseFloat((existing.total_venta - pagado).toFixed(2)));
    const estado_pago = pagado >= existing.total_venta ? 'pagado' : pagado > 0 ? 'parcial' : 'pendiente';

    await db.execute({ sql: SQL.updatePago, args: [pagado, pendiente, estado_pago, parseInt(req.params.id)] });
    const row = await db.execute({ sql: SQL.getById, args: [req.params.id] });
    res.json({ success: true, data: row.rows[0], message: 'Pago actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar pago:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar el pago' });
  }
}

async function remove(req, res) {
  try {
    const existing = (await db.execute({ sql: SQL.getById, args: [req.params.id] })).rows[0];
    if (!existing) return res.status(404).json({ success: false, error: 'Venta no encontrada' });
    await db.execute({ sql: SQL.softDelete, args: [req.params.id] });
    res.json({ success: true, message: 'Venta eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar venta:', error);
    res.status(500).json({ success: false, error: 'Error al eliminar la venta' });
  }
}

async function getStats(req, res) {
  try {
    const result = await db.execute(SQL.stats);
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ success: false, error: 'Error al obtener estadísticas' });
  }
}

module.exports = { getAll, getById, create, update, updatePago, remove, getStats };
