/**
 * API Client — Comunicación con el backend
 * Incluye el JWT automáticamente en cada petición
 */
const API = {
  BASE: '/api',

  async request(url, options = {}) {
    try {
      // Adjuntar token JWT si existe
      const token = localStorage.getItem('pollos-token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(options.headers || {})
      };

      const res = await fetch(`${this.BASE}${url}`, { ...options, headers });
      const data = await res.json();

      // Token expirado o inválido → redirigir al login
      if (res.status === 401) {
        localStorage.removeItem('pollos-token');
        localStorage.removeItem('pollos-user');
        window.location.replace('/login.html');
        return;
      }

      if (!res.ok) throw { status: res.status, ...data };
      return data;
    } catch (err) {
      if (err.success === false) throw err;
      if (err.status) throw err;
      throw { success: false, error: 'Error de conexión con el servidor' };
    }
  },

  // --- VENTAS ---
  getVentas(query = '', estado = '') {
    let url = '/ventas?';
    if (query) url += `q=${encodeURIComponent(query)}&`;
    if (estado && estado !== 'todos') url += `estado=${estado}`;
    return this.request(url);
  },

  getVenta(id)           { return this.request(`/ventas/${id}`); },

  crearVenta(data) {
    return this.request('/ventas', { method: 'POST', body: JSON.stringify(data) });
  },

  actualizarVenta(id, data) {
    return this.request(`/ventas/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  actualizarPago(id, monto_pagado) {
    return this.request(`/ventas/${id}/pago`, {
      method: 'PATCH', body: JSON.stringify({ monto_pagado })
    });
  },

  eliminarVenta(id) {
    return this.request(`/ventas/${id}`, { method: 'DELETE' });
  },

  getEstadisticas() { return this.request('/estadisticas'); },

  // --- GASTOS ---
  getGastos(categoria = '') {
    let url = '/gastos?';
    if (categoria && categoria !== 'todos') url += `categoria=${categoria}`;
    return this.request(url);
  },

  getGasto(id)            { return this.request(`/gastos/${id}`); },

  crearGasto(data) {
    return this.request('/gastos', { method: 'POST', body: JSON.stringify(data) });
  },

  actualizarGasto(id, data) {
    return this.request(`/gastos/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  eliminarGasto(id) {
    return this.request(`/gastos/${id}`, { method: 'DELETE' });
  },

  getGastosEstadisticas() { return this.request('/gastos/estadisticas'); },

  // --- USUARIOS (solo admin) ---
  getUsuarios()           { return this.request('/users'); },
  crearUsuario(data) {
    return this.request('/users', { method: 'POST', body: JSON.stringify(data) });
  },
  actualizarUsuario(id, data) {
    return this.request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  eliminarUsuario(id) {
    return this.request(`/users/${id}`, { method: 'DELETE' });
  }
};
