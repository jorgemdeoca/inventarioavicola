/**
 * App Principal — Gestión de Pollos
 * Orquesta todos los módulos: API, Validación, Estadísticas
 */
(function () {
  'use strict';

  // =============================================
  // STATE
  // =============================================
  let currentFilter = 'todos';
  let searchQuery = '';
  let searchTimeout = null;
  let editingId = null;

  // =============================================
  // DOM ELEMENTS
  // =============================================
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const els = {
    // Search
    searchInput: $('#searchInput'),
    clearSearch: $('#clearSearch'),
    // Buttons
    btnNuevaVenta: $('#btnNuevaVenta'),
    // Table
    ventasBody: $('#ventasBody'),
    emptyState: $('#emptyState'),
    loader: $('#loader'),
    // Modal venta
    modalOverlay: $('#modalOverlay'),
    modal: $('#modal'),
    modalTitle: $('#modalTitle'),
    modalClose: $('#modalClose'),
    ventaForm: $('#ventaForm'),
    ventaId: $('#ventaId'),
    btnCancelar: $('#btnCancelar'),
    btnGuardar: $('#btnGuardar'),
    // Form fields
    clienteNombre: $('#clienteNombre'),
    descripcion: $('#descripcion'),
    cantidadPollos: $('#cantidadPollos'),
    pesoTotalKg: $('#pesoTotalKg'),
    precioPorKg: $('#precioPorKg'),
    montoPagado: $('#montoPagado'),
    totalVentaDisplay: $('#totalVentaDisplay'),
    montoPendienteDisplay: $('#montoPendienteDisplay'),
    pagoStatusDisplay: $('#pagoStatusDisplay'),
    // Modal pago
    pagoModalOverlay: $('#pagoModalOverlay'),
    pagoModalClose: $('#pagoModalClose'),
    pagoForm: $('#pagoForm'),
    pagoVentaId: $('#pagoVentaId'),
    pagoInfo: $('#pagoInfo'),
    nuevoMontoPagado: $('#nuevoMontoPagado'),
    btnCancelarPago: $('#btnCancelarPago'),
    // Toast
    toastContainer: $('#toastContainer'),
    // Filters
    filterTabs: $$('.filter-tab')
  };

  // =============================================
  // INITIALIZATION
  // =============================================
  function init() {
    // Verificar sesión — redirige al login si no hay token
    if (!Auth.requireAuth()) return;
    Auth.renderUserInfo();
    initTheme();
    bindEvents();
    loadVentas();
    Stats.refresh();
  }

  // =============================================
  // THEME TOGGLE (Oscuro / Claro)
  // =============================================
  function initTheme() {
    const saved = localStorage.getItem('pollos-theme') || 'dark';
    applyTheme(saved);
  }

  function applyTheme(theme) {
    const toggle = document.getElementById('themeToggle');
    if (theme === 'light') {
      document.body.setAttribute('data-theme', 'light');
      if (toggle) toggle.textContent = '☀️';
    } else {
      document.body.removeAttribute('data-theme');
      if (toggle) toggle.textContent = '🌙';
    }
    localStorage.setItem('pollos-theme', theme);
  }

  function toggleTheme() {
    const current = document.body.getAttribute('data-theme');
    applyTheme(current === 'light' ? 'dark' : 'light');
  }

  // =============================================
  // EVENT BINDINGS
  // =============================================
  function bindEvents() {
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

    // Logout
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) btnLogout.addEventListener('click', () => Auth.logout());

    // Nueva venta
    els.btnNuevaVenta.addEventListener('click', openNewVentaModal);

    // Cerrar modales
    els.modalClose.addEventListener('click', closeVentaModal);
    els.btnCancelar.addEventListener('click', closeVentaModal);
    els.modalOverlay.addEventListener('click', (e) => {
      if (e.target === els.modalOverlay) closeVentaModal();
    });
    els.pagoModalClose.addEventListener('click', closePagoModal);
    els.btnCancelarPago.addEventListener('click', closePagoModal);
    els.pagoModalOverlay.addEventListener('click', (e) => {
      if (e.target === els.pagoModalOverlay) closePagoModal();
    });

    // ESC para cerrar modales
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeVentaModal();
        closePagoModal();
      }
    });

    // Formulario de venta
    els.ventaForm.addEventListener('submit', handleVentaSubmit);

    // Validación en tiempo real
    ['clienteNombre', 'cantidadPollos', 'pesoTotalKg', 'precioPorKg', 'montoPagado'].forEach(field => {
      const input = document.getElementById(field);
      if (input) {
        input.addEventListener('input', () => {
          Validator.validateField(field, input.value);
          updateCalculations();
        });
        input.addEventListener('blur', () => {
          Validator.validateField(field, input.value);
        });
      }
    });

    // Búsqueda con debounce
    els.searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchQuery = e.target.value;
      els.clearSearch.classList.toggle('hidden', !searchQuery);
      searchTimeout = setTimeout(() => loadVentas(), 300);
    });
    els.clearSearch.addEventListener('click', () => {
      els.searchInput.value = '';
      searchQuery = '';
      els.clearSearch.classList.add('hidden');
      loadVentas();
    });

    // Filtros
    els.filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        els.filterTabs.forEach(t => t.classList.remove('filter-tab--active'));
        tab.classList.add('filter-tab--active');
        currentFilter = tab.dataset.filter;
        loadVentas();
      });
    });

    // Formulario de pago
    els.pagoForm.addEventListener('submit', handlePagoSubmit);
  }

  // =============================================
  // LOAD & RENDER VENTAS
  // =============================================
  async function loadVentas() {
    showLoader(true);
    try {
      const estado = currentFilter !== 'todos' ? currentFilter : '';
      const res = await API.getVentas(searchQuery, estado);
      if (res.success) {
        renderVentas(res.data);
      }
    } catch (err) {
      showToast('Error al cargar ventas', 'error');
    }
    showLoader(false);
  }

  function renderVentas(ventas) {
    if (!ventas || ventas.length === 0) {
      els.ventasBody.innerHTML = '';
      els.emptyState.classList.remove('hidden');
      return;
    }

    els.emptyState.classList.add('hidden');
    els.ventasBody.innerHTML = ventas.map(v => {
      const fecha = formatDate(v.fecha);
      const estadoBadge = getEstadoBadge(v.estado_pago);
      const debeClass = v.monto_pendiente > 0 ? 'td-danger td-bold' : 'td-muted';

      return `
        <tr data-id="${v.id}">
          <td class="td-muted">${fecha}</td>
          <td class="td-bold">${escapeHtml(v.cliente_nombre)}</td>
          <td>${v.cantidad_pollos}</td>
          <td>${v.peso_total_kg.toFixed(2)}</td>
          <td>$${v.precio_por_kg.toFixed(2)}</td>
          <td class="td-bold td-success">$${v.total_venta.toFixed(2)}</td>
          <td>${estadoBadge}</td>
          <td>$${v.monto_pagado.toFixed(2)}</td>
          <td class="${debeClass}">$${v.monto_pendiente.toFixed(2)}</td>
          <td>
            <div class="td-actions">
              <button class="btn--icon" onclick="App.editVenta(${v.id})" title="Editar">✏️</button>
              <button class="btn--icon" onclick="App.openPagoModal(${v.id})" title="Pago">💵</button>
              <button class="btn--icon" onclick="App.deleteVenta(${v.id})" title="Eliminar">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function getEstadoBadge(estado) {
    const map = {
      pagado: '<span class="badge badge--pagado">✅ Pagado</span>',
      parcial: '<span class="badge badge--parcial">⚠️ Parcial</span>',
      pendiente: '<span class="badge badge--pendiente">🔴 Pendiente</span>'
    };
    return map[estado] || map.pendiente;
  }

  // =============================================
  // MODAL — NUEVA / EDITAR VENTA
  // =============================================
  function openNewVentaModal() {
    editingId = null;
    els.modalTitle.textContent = '🐔 Nueva Venta';
    els.btnGuardar.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
        <polyline points="17,21 17,13 7,13 7,21"/><polyline points="7,3 7,8 15,8"/>
      </svg>
      Guardar Venta`;
    resetForm();
    els.modalOverlay.classList.remove('hidden');
    els.clienteNombre.focus();
  }

  async function editVenta(id) {
    try {
      const res = await API.getVenta(id);
      if (res.success) {
        editingId = id;
        const v = res.data;
        els.modalTitle.textContent = '✏️ Editar Venta';
        els.btnGuardar.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17,21 17,13 7,13 7,21"/><polyline points="7,3 7,8 15,8"/>
          </svg>
          Actualizar Venta`;
        els.ventaId.value = v.id;
        els.clienteNombre.value = v.cliente_nombre;
        els.descripcion.value = v.descripcion || '';
        els.cantidadPollos.value = v.cantidad_pollos;
        els.pesoTotalKg.value = v.peso_total_kg;
        els.precioPorKg.value = v.precio_por_kg;
        els.montoPagado.value = v.monto_pagado;
        updateCalculations();
        els.modalOverlay.classList.remove('hidden');
        els.clienteNombre.focus();
      }
    } catch (err) {
      showToast('Error al cargar la venta', 'error');
    }
  }

  function closeVentaModal() {
    els.modalOverlay.classList.add('hidden');
    resetForm();
  }

  function resetForm() {
    els.ventaForm.reset();
    els.ventaId.value = '';
    els.montoPagado.value = '0';
    Validator.resetValidation();
    updateCalculations();
    editingId = null;
  }

  // =============================================
  // AUTO-CÁLCULOS EN TIEMPO REAL
  // =============================================
  function updateCalculations() {
    const peso = parseFloat(els.pesoTotalKg.value) || 0;
    const precio = parseFloat(els.precioPorKg.value) || 0;
    const pagado = parseFloat(els.montoPagado.value) || 0;

    const total = parseFloat((peso * precio).toFixed(2));
    const pendiente = Math.max(0, parseFloat((total - pagado).toFixed(2)));

    // Total de la venta
    els.totalVentaDisplay.textContent = `$${total.toFixed(2)}`;

    // Monto pendiente
    els.montoPendienteDisplay.textContent = `$${pendiente.toFixed(2)}`;

    // Estado de pago visual
    let estadoHTML;
    if (pagado >= total && total > 0) {
      estadoHTML = '<span class="badge badge--pagado">✅ Pagado</span>';
    } else if (pagado > 0 && total > 0) {
      estadoHTML = '<span class="badge badge--parcial">⚠️ Parcial</span>';
    } else {
      estadoHTML = '<span class="badge badge--pendiente">⏳ Pendiente</span>';
    }
    els.pagoStatusDisplay.innerHTML = estadoHTML;
  }

  // =============================================
  // SUBMIT VENTA
  // =============================================
  async function handleVentaSubmit(e) {
    e.preventDefault();

    if (!Validator.validateForm()) {
      showToast('Corrige los errores del formulario', 'error');
      return;
    }

    const peso = parseFloat(els.pesoTotalKg.value);
    const precio = parseFloat(els.precioPorKg.value);

    const data = {
      cliente_nombre: els.clienteNombre.value.trim(),
      descripcion: els.descripcion.value.trim(),
      cantidad_pollos: parseInt(els.cantidadPollos.value),
      precio_por_kg: precio,
      peso_total_kg: peso,
      monto_pagado: parseFloat(els.montoPagado.value) || 0
    };

    try {
      let res;
      if (editingId) {
        res = await API.actualizarVenta(editingId, data);
        showToast('Venta actualizada exitosamente', 'success');
      } else {
        res = await API.crearVenta(data);
        showToast('Venta registrada exitosamente', 'success');
      }
      closeVentaModal();
      loadVentas();
      Stats.refresh();
    } catch (err) {
      const msg = err.errors ? err.errors.join(', ') : err.error || 'Error al guardar';
      showToast(msg, 'error');
    }
  }

  // =============================================
  // DELETE VENTA
  // =============================================
  async function deleteVenta(id) {
    if (!confirm('¿Estás seguro de eliminar esta venta? Esta acción no se puede deshacer.')) return;

    try {
      await API.eliminarVenta(id);
      showToast('Venta eliminada', 'success');
      loadVentas();
      Stats.refresh();
    } catch (err) {
      showToast('Error al eliminar la venta', 'error');
    }
  }

  // =============================================
  // MODAL — PAGO
  // =============================================
  async function openPagoModal(id) {
    try {
      const res = await API.getVenta(id);
      if (res.success) {
        const v = res.data;
        els.pagoVentaId.value = v.id;
        els.nuevoMontoPagado.value = v.monto_pagado;
        els.nuevoMontoPagado.max = v.total_venta;

        els.pagoInfo.innerHTML = `
          <div class="pago-info__row">
            <span class="pago-info__label">Cliente:</span>
            <span class="pago-info__value">${escapeHtml(v.cliente_nombre)}</span>
          </div>
          <div class="pago-info__row">
            <span class="pago-info__label">Total de la Venta:</span>
            <span class="pago-info__value" style="color:var(--success)">$${v.total_venta.toFixed(2)}</span>
          </div>
          <div class="pago-info__row">
            <span class="pago-info__label">Ya pagado:</span>
            <span class="pago-info__value">$${v.monto_pagado.toFixed(2)}</span>
          </div>
          <div class="pago-info__row">
            <span class="pago-info__label">Pendiente:</span>
            <span class="pago-info__value" style="color:var(--danger)">$${v.monto_pendiente.toFixed(2)}</span>
          </div>
        `;

        els.pagoModalOverlay.classList.remove('hidden');
        els.nuevoMontoPagado.focus();
        els.nuevoMontoPagado.select();
      }
    } catch (err) {
      showToast('Error al cargar datos del pago', 'error');
    }
  }

  function closePagoModal() {
    els.pagoModalOverlay.classList.add('hidden');
    const errEl = document.getElementById('errorNuevoMontoPagado');
    if (errEl) errEl.textContent = '';
  }

  async function handlePagoSubmit(e) {
    e.preventDefault();
    const id = parseInt(els.pagoVentaId.value);
    const monto = parseFloat(els.nuevoMontoPagado.value);
    const errEl = document.getElementById('errorNuevoMontoPagado');

    if (isNaN(monto) || monto < 0) {
      if (errEl) errEl.textContent = 'Ingresa un monto válido';
      return;
    }

    try {
      await API.actualizarPago(id, monto);
      showToast('Pago actualizado exitosamente', 'success');
      closePagoModal();
      loadVentas();
      Stats.refresh();
    } catch (err) {
      const msg = err.errors ? err.errors.join(', ') : err.error || 'Error al actualizar pago';
      if (errEl) errEl.textContent = msg;
      showToast(msg, 'error');
    }
  }

  // =============================================
  // TOAST NOTIFICATIONS
  // =============================================
  function showToast(message, type = 'info') {
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
      <span class="toast__icon">${icons[type] || icons.info}</span>
      <span>${escapeHtml(message)}</span>
      <button class="toast__close" onclick="this.parentElement.remove()">&times;</button>
    `;
    els.toastContainer.appendChild(toast);
    setTimeout(() => { if (toast.parentElement) toast.remove(); }, 4000);
  }

  // =============================================
  // HELPERS
  // =============================================
  function showLoader(show) {
    const loader = $('#loader');
    if (loader) loader.classList.toggle('hidden', !show);
  }

  function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // =============================================
  // PUBLIC API (para onclick en HTML)
  // =============================================
  window.App = {
    editVenta,
    deleteVenta,
    openPagoModal
  };

  // =============================================
  // START
  // =============================================
  document.addEventListener('DOMContentLoaded', init);
})();
