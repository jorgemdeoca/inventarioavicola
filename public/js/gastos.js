/**
 * App Principal — Gestión de Gastos
 */
(function () {
  'use strict';

  // =============================================
  // STATE
  // =============================================
  let currentFilter = 'todos';
  let editingId = null;

  // =============================================
  // DOM ELEMENTS
  // =============================================
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const els = {
    // Buttons
    btnNuevoGasto: $('#btnNuevoGasto'),
    // Table
    gastosBody: $('#gastosBody'),
    emptyState: $('#emptyState'),
    loader: $('#loader'),
    // Modal
    modalOverlay: $('#modalOverlay'),
    modalTitle: $('#modalTitle'),
    modalClose: $('#modalClose'),
    gastoForm: $('#gastoForm'),
    gastoId: $('#gastoId'),
    btnCancelar: $('#btnCancelar'),
    btnGuardar: $('#btnGuardar'),
    // Form fields
    categoriaGasto: $('#categoriaGasto'),
    cantidadGasto: $('#cantidadGasto'),
    descripcionGasto: $('#descripcionGasto'),
    montoGasto: $('#montoGasto'),
    totalGastoDisplay: $('#totalGastoDisplay'),
    descRequired: $('#descRequired'),
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
    loadGastos();
    refreshStats();
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

    // Nuevo gasto
    els.btnNuevoGasto.addEventListener('click', openNuevoGastoModal);

    // Cerrar modales
    els.modalClose.addEventListener('click', closeGastoModal);
    els.btnCancelar.addEventListener('click', closeGastoModal);
    els.modalOverlay.addEventListener('click', (e) => {
      if (e.target === els.modalOverlay) closeGastoModal();
    });

    // ESC para cerrar modales
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeGastoModal();
    });

    // Formulario de gasto
    els.gastoForm.addEventListener('submit', handleGastoSubmit);

    // Cálculos y validaciones en tiempo real
    els.cantidadGasto.addEventListener('input', updateCalculations);
    els.montoGasto.addEventListener('input', updateCalculations);
    els.categoriaGasto.addEventListener('change', () => {
      const cat = els.categoriaGasto.value;
      if (cat === 'otro') {
        els.descRequired.classList.remove('hidden');
      } else {
        els.descRequired.classList.add('hidden');
      }
    });

    // Filtros
    els.filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        els.filterTabs.forEach(t => t.classList.remove('filter-tab--active'));
        tab.classList.add('filter-tab--active');
        currentFilter = tab.dataset.filter;
        loadGastos();
      });
    });
  }

  // =============================================
  // LOAD & RENDER GASTOS
  // =============================================
  async function loadGastos() {
    showLoader(true);
    try {
      const res = await API.getGastos(currentFilter);
      if (res.success) {
        renderGastos(res.data);
      }
    } catch (err) {
      showToast('Error al cargar gastos', 'error');
    }
    showLoader(false);
  }

  function getCategoriaBadge(cat) {
    const map = {
      saco_comida: '<span class="badge badge--comida">🌾 Comida</span>',
      pollos_cria: '<span class="badge badge--pollos">🐣 Pollos (Cría)</span>',
      otro: '<span class="badge badge--otro">📦 Otro</span>'
    };
    return map[cat] || map.otro;
  }

  function renderGastos(gastos) {
    if (!gastos || gastos.length === 0) {
      els.gastosBody.innerHTML = '';
      els.emptyState.classList.remove('hidden');
      return;
    }

    els.emptyState.classList.add('hidden');
    els.gastosBody.innerHTML = gastos.map(g => {
      const fecha = formatDate(g.fecha);
      const catBadge = getCategoriaBadge(g.categoria);

      return `
        <tr data-id="${g.id}">
          <td class="td-muted">${fecha}</td>
          <td>${catBadge}</td>
          <td>${escapeHtml(g.descripcion || '-')}</td>
          <td>${g.cantidad}</td>
          <td>$${g.monto.toFixed(2)}</td>
          <td class="td-bold td-danger">-$${g.total.toFixed(2)}</td>
          <td>
            <div class="td-actions">
              <button type="button" class="btn--icon" onclick="GastosApp.editGasto(${g.id})" title="Editar">✏️</button>
              <button type="button" class="btn--icon" onclick="GastosApp.deleteGasto(${g.id})" title="Eliminar">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // =============================================
  // ESTADÍSTICAS (KPIs en la página de gastos)
  // =============================================
  async function refreshStats() {
    try {
      const res = await API.getGastosEstadisticas();
      if (res.success) {
        const d = res.data;
        animateValue('statTotalGastos', d.gastos_totales || 0);
        animateValue('statGastoComida', d.gasto_comida || 0);
        animateValue('statGastoPollos', d.gasto_pollos || 0);
        animateValue('statGastoOtros', d.gasto_otros || 0);
      }
    } catch (err) {
      console.error('Error estadísticas:', err);
    }
  }

  function animateValue(id, target) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = `$${parseFloat(target).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  // =============================================
  // MODAL — NUEVO / EDITAR GASTO
  // =============================================
  function openNuevoGastoModal() {
    editingId = null;
    els.modalTitle.textContent = '💸 Nuevo Gasto';
    els.btnGuardar.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
        <polyline points="17,21 17,13 7,13 7,21"/><polyline points="7,3 7,8 15,8"/>
      </svg>
      Guardar Gasto`;
    resetForm();
    els.modalOverlay.classList.remove('hidden');
    els.categoriaGasto.focus();
  }

  async function editGasto(id) {
    try {
      const res = await API.getGasto(id);
      if (res.success) {
        editingId = id;
        const g = res.data;
        els.modalTitle.textContent = '✏️ Editar Gasto';
        els.btnGuardar.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17,21 17,13 7,13 7,21"/><polyline points="7,3 7,8 15,8"/>
          </svg>
          Actualizar Gasto`;
        els.gastoId.value = g.id;
        els.categoriaGasto.value = g.categoria;
        els.descripcionGasto.value = g.descripcion || '';
        els.cantidadGasto.value = g.cantidad;
        els.montoGasto.value = g.monto;
        
        if (g.categoria === 'otro') {
          els.descRequired.classList.remove('hidden');
        }

        updateCalculations();
        els.modalOverlay.classList.remove('hidden');
        els.categoriaGasto.focus();
      }
    } catch (err) {
      showToast('Error al cargar el gasto', 'error');
    }
  }

  function closeGastoModal() {
    els.modalOverlay.classList.add('hidden');
    resetForm();
  }

  function resetForm() {
    els.gastoForm.reset();
    els.gastoId.value = '';
    els.descRequired.classList.add('hidden');
    document.querySelectorAll('.form__error').forEach(e => e.textContent = '');
    document.querySelectorAll('.form__input').forEach(i => i.classList.remove('form__input--invalid'));
    updateCalculations();
    editingId = null;
  }

  // =============================================
  // AUTO-CÁLCULOS
  // =============================================
  function updateCalculations() {
    const cant = parseInt(els.cantidadGasto.value) || 0;
    const monto = parseFloat(els.montoGasto.value) || 0;
    const total = parseFloat((cant * monto).toFixed(2));

    els.totalGastoDisplay.textContent = `$${total.toFixed(2)}`;
  }

  // =============================================
  // SUBMIT GASTO
  // =============================================
  async function handleGastoSubmit(e) {
    e.preventDefault();

    // Limpiar errores previos
    document.querySelectorAll('.form__error').forEach(e => e.textContent = '');
    document.querySelectorAll('.form__input').forEach(i => i.classList.remove('form__input--invalid'));

    let hasErrors = false;
    const showError = (id, msg) => {
      document.getElementById(`error${id}`).textContent = msg;
      document.getElementById(id.charAt(0).toLowerCase() + id.slice(1)).classList.add('form__input--invalid');
      hasErrors = true;
    };

    const categoria = els.categoriaGasto.value;
    const descripcion = els.descripcionGasto.value.trim();
    const cantidad = parseInt(els.cantidadGasto.value);
    const monto = parseFloat(els.montoGasto.value);

    if (!categoria) showError('CategoriaGasto', 'Selecciona una categoría');
    if (categoria === 'otro' && descripcion.length < 2) showError('DescripcionGasto', 'Obligatorio (mín 2 caracteres)');
    if (!cantidad || cantidad <= 0) showError('CantidadGasto', 'Debe ser mayor a 0');
    if (!monto || monto <= 0) showError('MontoGasto', 'Debe ser mayor a 0');

    if (hasErrors) {
      showToast('Corrige los errores del formulario', 'error');
      return;
    }

    const data = { categoria, descripcion, cantidad, monto };

    try {
      let res;
      if (editingId) {
        res = await API.actualizarGasto(editingId, data);
        showToast('Gasto actualizado exitosamente', 'success');
      } else {
        res = await API.crearGasto(data);
        showToast('Gasto registrado exitosamente', 'success');
      }
      closeGastoModal();
      loadGastos();
      refreshStats();
    } catch (err) {
      const msg = err.errors ? err.errors.join(', ') : err.error || 'Error al guardar';
      showToast(msg, 'error');
    }
  }

  // =============================================
  // DELETE GASTO
  // =============================================
  async function deleteGasto(id) {
    if (!confirm('¿Estás seguro de eliminar este gasto? Esta acción no se puede deshacer.')) return;

    try {
      await API.eliminarGasto(id);
      showToast('Gasto eliminado', 'success');
      loadGastos();
      refreshStats();
    } catch (err) {
      showToast('Error al eliminar el gasto', 'error');
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
  // PUBLIC API
  // =============================================
  window.GastosApp = {
    editGasto,
    deleteGasto
  };

  // =============================================
  // START
  // =============================================
  document.addEventListener('DOMContentLoaded', init);
})();
