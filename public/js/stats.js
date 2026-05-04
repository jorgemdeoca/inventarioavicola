/**
 * Stats Module — Actualización del dashboard estadístico
 */
const Stats = {
  /**
   * Carga y actualiza todas las estadísticas del dashboard
   */
  async refresh() {
    try {
      const [resVentas, resGastos] = await Promise.all([
        API.getEstadisticas(),
        API.getGastosEstadisticas()
      ]);
      if (resVentas.success && resGastos.success) {
        this.render(resVentas.data, resGastos.data);
      }
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
    }
  },

  /**
   * Renderiza los datos en los KPIs del dashboard
   */
  render(ventasData, gastosData) {
    // KPI cards
    this.animateValue('statTotalPollos', ventasData.total_pollos || 0, false);
    
    const pesoEl = document.getElementById('statTotalPeso');
    if (pesoEl) pesoEl.innerHTML = `${this.formatNumber(ventasData.total_peso_kg || 0)} <small>Kg</small>`;

    const ganEl = document.getElementById('statTotalGanancias');
    if (ganEl) ganEl.textContent = `$${this.formatNumber(ventasData.total_ganancias || 0)}`;

    const pendEl = document.getElementById('statTotalPendiente');
    if (pendEl) pendEl.textContent = `$${this.formatNumber(ventasData.total_pendiente || 0)}`;

    const gastosEl = document.getElementById('statTotalGastos');
    if (gastosEl) gastosEl.textContent = `$${this.formatNumber(gastosData.gastos_totales || 0)}`;

    // Stats pills
    this.setText('statPagadas', ventasData.ventas_pagadas || 0);
    this.setText('statParciales', ventasData.ventas_parciales || 0);
    this.setText('statPendientes', ventasData.ventas_pendientes || 0);
    this.setText('statPrecioPromedio', (ventasData.precio_promedio_kg || 0).toFixed(2));
  },

  setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  },

  formatNumber(num) {
    return parseFloat(num).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  },

  /**
   * Animación simple de contador
   */
  animateValue(id, target, isCurrency = true) {
    const el = document.getElementById(id);
    if (!el) return;
    
    const duration = 600;
    const start = parseInt(el.textContent.replace(/[^0-9.-]/g, '')) || 0;
    const diff = target - start;
    const startTime = performance.now();

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const current = Math.round(start + diff * eased);
      
      if (isCurrency) {
        el.textContent = `$${current.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      } else {
        el.textContent = current.toLocaleString('en-US');
      }

      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }
};
