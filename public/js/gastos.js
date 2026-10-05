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

    // Event Delegation para botones de la tabla Gastos
    els.gastosBody.addEventListener('click', (e) => {
      const btnEdit = e.target.closest('.action-edit');
      if (btnEdit) return editGasto(btnEdit.dataset.id);

      const btnDelete = e.target.closest('.action-delete');
      if (btnDelete) return deleteGasto(btnDelete.dataset.id);
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
      saco_comida: '<span class="badge badge--comida"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon"><path d="M2 22 22 2"/><path d="M11 11a4 4 0 0 1-5.66-5.66l5.66 5.66Z"/><path d="M11 15a4 4 0 0 1-5.66-5.66l5.66 5.66Z"/><path d="M15 11a4 4 0 0 1-5.66-5.66l5.66 5.66Z"/><path d="M15 15a4 4 0 0 1-5.66-5.66l5.66 5.66Z"/><path d="M7 19a4 4 0 0 1-5.66-5.66l5.66 5.66Z"/><path d="M19 7a4 4 0 0 1-5.66-5.66l5.66 5.66Z"/></svg> Comida</span>',
      pollos_cria: '<span class="badge badge--pollos"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon"><path d="M12 22c4.4 0 8-4.4 8-9.8S16.4 2 12 2 4 6.8 4 12.2 7.6 22 12 22Z"/></svg> Pollos (Cría)</span>',
      otro: '<span class="badge badge--otro"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg> Otro</span>'
    };
    return map[cat] || map.otro;
  }

  function renderGastos(gastos) {
    if (!gastos || gastos.length === 0) {
      els.gastosBody.innerHTML = '';
      if (currentFilter !== 'todos') {
        els.emptyState.querySelector('.empty-state__title').textContent = 'No se encontraron resultados';
        els.emptyState.querySelector('.empty-state__text').textContent = 'Intenta con otro filtro de categoría.';
      } else {
        els.emptyState.querySelector('.empty-state__title').textContent = 'No hay gastos registrados';
        els.emptyState.querySelector('.empty-state__text').textContent = 'Haz clic en "Nuevo Gasto" para comenzar';
      }
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
              <button type="button" class="btn--icon action-edit" data-id="${g.id}" title="Editar"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg></button>
              <button type="button" class="btn--icon action-delete" data-id="${g.id}" title="Eliminar"><svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg></button>
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
    els.modalTitle.textContent = '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg> Nuevo Gasto';
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
        els.modalTitle.textContent = '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg> Editar Gasto';
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
      const firstInvalid = $('.form__input--invalid');
      if (firstInvalid) firstInvalid.focus();
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
    const icons = { success: '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>', error: '❌', info: 'ℹ️' };
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
    const tableContainer = $('.table-container');
    if (tableContainer) tableContainer.setAttribute('aria-busy', show ? 'true' : 'false');
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
