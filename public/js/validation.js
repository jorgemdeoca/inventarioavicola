/**
 * Validación en Tiempo Real — Formularios
 */
const Validator = {
  rules: {
    clienteNombre: {
      required: true,
      minLength: 2,
      maxLength: 100,
      messages: {
        required: 'El nombre del cliente es obligatorio',
        minLength: 'Mínimo 2 caracteres',
        maxLength: 'Máximo 100 caracteres'
      }
    },
    cantidadPollos: {
      required: true,
      min: 1,
      integer: true,
      messages: {
        required: 'La cantidad es obligatoria',
        min: 'Debe ser al menos 1',
        integer: 'Debe ser un número entero'
      }
    },
    pesoTotalKg: {
      required: true,
      min: 0.01,
      messages: {
        required: 'El peso es obligatorio',
        min: 'Debe ser mayor a 0'
      }
    },
    precioPorKg: {
      required: true,
      min: 0.01,
      messages: {
        required: 'El precio es obligatorio',
        min: 'Debe ser mayor a 0'
      }
    },
    montoPagado: {
      required: false,
      min: 0,
      messages: {
        min: 'No puede ser negativo'
      }
    }
  },

  /**
   * Valida un campo individual y muestra el error
   */
  validateField(inputId, value) {
    const input = document.getElementById(inputId);
    const errorEl = document.getElementById('error' + inputId.charAt(0).toUpperCase() + inputId.slice(1));
    const fieldName = inputId;
    const rule = this.rules[fieldName];

    if (!rule) return { valid: true };

    let error = '';
    const trimmed = typeof value === 'string' ? value.trim() : value;

    if (rule.required && (!trimmed && trimmed !== 0)) {
      error = rule.messages.required;
    } else if (trimmed || trimmed === 0) {
      if (rule.minLength && typeof trimmed === 'string' && trimmed.length < rule.minLength) {
        error = rule.messages.minLength;
      }
      if (rule.maxLength && typeof trimmed === 'string' && trimmed.length > rule.maxLength) {
        error = rule.messages.maxLength;
      }
      if (rule.min !== undefined && parseFloat(trimmed) < rule.min) {
        error = rule.messages.min;
      }
      if (rule.integer && !Number.isInteger(Number(trimmed))) {
        error = rule.messages.integer;
      }
    }

    // Validación especial: monto pagado no puede exceder total
    if (fieldName === 'montoPagado' && !error) {
      const totalDisplay = document.getElementById('totalVentaDisplay');
      if (totalDisplay) {
        const totalText = totalDisplay.textContent.replace('$', '').replace(',', '');
        const total = parseFloat(totalText) || 0;
        if (parseFloat(value) > total) {
          error = 'No puede exceder el total ($' + total.toFixed(2) + ')';
        }
      }
    }

    // Aplicar estilos visuales
    if (input) {
      input.classList.remove('form__input--valid', 'form__input--invalid');
      if (error) {
        input.classList.add('form__input--invalid');
      } else if (trimmed || trimmed === 0) {
        input.classList.add('form__input--valid');
      }
    }

    if (errorEl) {
      errorEl.textContent = error;
    }

    return { valid: !error, error };
  },

  /**
   * Valida todos los campos del formulario
   */
  validateForm() {
    const fields = ['clienteNombre', 'cantidadPollos', 'pesoTotalKg', 'precioPorKg', 'montoPagado'];
    let allValid = true;

    fields.forEach(field => {
      const input = document.getElementById(field);
      if (input) {
        const result = this.validateField(field, input.value);
        if (!result.valid) allValid = false;
      }
    });

    return allValid;
  },

  /**
   * Resetea los estilos de validación
   */
  resetValidation() {
    const inputs = document.querySelectorAll('.form__input');
    inputs.forEach(input => {
      input.classList.remove('form__input--valid', 'form__input--invalid');
    });
    const errors = document.querySelectorAll('.form__error');
    errors.forEach(el => { el.textContent = ''; });
  }
};
