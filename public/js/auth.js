/**
 * Auth Client — Gestión de sesión JWT en el frontend
 * Incluir este script ANTES de app.js y gastos.js
 */
const Auth = {
  TOKEN_KEY: 'pollos-token',
  USER_KEY:  'pollos-user',

  /** Obtiene el token guardado */
  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  /** Obtiene el usuario guardado */
  getUser() {
    try {
      return JSON.parse(localStorage.getItem(this.USER_KEY)) || null;
    } catch { return null; }
  },

  /** Verifica si hay sesión activa */
  isLoggedIn() {
    return !!this.getToken();
  },

  /** Verifica si el usuario es admin */
  isAdmin() {
    const user = this.getUser();
    return user && user.rol === 'admin';
  },

  /** Cierra sesión y redirige al login */
  logout() {
    // Notificar al servidor (fire-and-forget)
    const token = this.getToken();
    if (token) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(() => {});
    }
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    window.location.replace('/login.html');
  },

  /**
   * Verifica la sesión al cargar cualquier página protegida.
   * Si no hay token, redirige al login.
   */
  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.replace('/login.html');
      return false;
    }
    return true;
  },

  /**
   * Headers estándar para todas las peticiones autenticadas.
   * Usado por el módulo API.
   */
  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getToken()}`
    };
  },

  /**
   * Maneja respuesta 401 (token expirado/inválido):
   * cierra sesión y redirige al login.
   */
  handleUnauthorized(status) {
    if (status === 401) {
      this.logout();
      return true;
    }
    return false;
  },

  /**
   * Renderiza el nombre del usuario en el header.
   * Busca el elemento #userDisplay y lo actualiza.
   */
  renderUserInfo() {
    const user = this.getUser();
    if (!user) return;

    const display = document.getElementById('userDisplay');
    if (display) {
      display.textContent = user.nombre;
    }

    // Mostrar badge admin si aplica
    const adminBadge = document.getElementById('adminBadge');
    if (adminBadge && user.rol === 'admin') {
      adminBadge.classList.remove('hidden');
    }
  }
};
