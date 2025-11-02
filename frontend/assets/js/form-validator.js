/* ============================================
   SPEAKLEXI - VALIDADOR DE FORMULARIOS
   Archivo: assets/js/form-validator.js
   ============================================ */

/**
 * Clase para validación de formularios
 */
class FormValidator {
    constructor() {
        console.log('✅ Form Validator inicializado');
    }

    /**
     * Valida un email
     * @param {string} email - Email a validar
     * @returns {boolean}
     */
    static validateEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    /**
     * Valida una contraseña
     * @param {string} password - Contraseña a validar
     * @returns {Object} - {isValid: boolean, strength: number, errors: string[]}
     */
    static validatePassword(password) {
        const errors = [];
        let strength = 0;

        if (password.length < 8) {
            errors.push('Debe tener al menos 8 caracteres');
        } else {
            strength++;
        }

        if (password.match(/[a-z]/) && password.match(/[A-Z]/)) {
            strength++;
        } else {
            errors.push('Debe incluir mayúsculas y minúsculas');
        }

        if (password.match(/\d/)) {
            strength++;
        } else {
            errors.push('Debe incluir al menos un número');
        }

        if (password.match(/[^a-zA-Z\d]/)) {
            strength++;
        } else {
            errors.push('Debe incluir al menos un carácter especial');
        }

        return {
            isValid: errors.length === 0,
            strength: strength,
            errors: errors
        };
    }

    /**
     * Calcula la fortaleza de la contraseña
     * @param {string} password - Contraseña
     * @returns {number} - Nivel de fortaleza (0-4)
     */
    static calculatePasswordStrength(password) {
        let score = 0;

        if (password.length >= 8) score++;
        if (password.match(/[a-z]/) && password.match(/[A-Z]/)) score++;
        if (password.match(/\d/)) score++;
        if (password.match(/[^a-zA-Z\d]/)) score++;

        return score;
    }

    /**
     * Actualiza la UI de fortaleza de contraseña
     * @param {string} password - Contraseña
     * @param {HTMLElement[]} strengthBars - Array de barras de fortaleza
     * @param {HTMLElement} feedbackElement - Elemento para mostrar feedback
     */
    static updatePasswordStrengthUI(password, strengthBars, feedbackElement) {
        if (!strengthBars || strengthBars.length === 0) return;

        const strength = this.calculatePasswordStrength(password);
        const colors = [
            'bg-gray-200 dark:bg-gray-700',
            'bg-red-500',
            'bg-orange-500',
            'bg-yellow-500',
            'bg-green-500'
        ];
        const labels = ['', 'Muy débil', 'Débil', 'Regular', 'Buena', 'Excelente'];
        const textColors = ['text-gray-500', 'text-red-600', 'text-orange-600', 'text-yellow-600', 'text-blue-600', 'text-green-600'];

        strengthBars.forEach((bar, index) => {
            // Reset classes
            bar.className = 'password-strength flex-1 rounded transition-all duration-300';
            
            if (index < strength) {
                bar.classList.add(colors[strength]);
            } else {
                bar.classList.add('bg-gray-200', 'dark:bg-gray-700');
            }
        });

        if (feedbackElement) {
            feedbackElement.textContent = labels[strength];
            feedbackElement.className = `text-xs ${textColors[strength]} dark:text-gray-400 transition-colors duration-300`;
        }
    }

    /**
     * Valida que dos contraseñas coincidan
     * @param {string} password - Primera contraseña
     * @param {string} confirmPassword - Contraseña de confirmación
     * @returns {boolean}
     */
    static validatePasswordMatch(password, confirmPassword) {
        return password === confirmPassword;
    }

    /**
     * Valida un campo requerido
     * @param {string} value - Valor del campo
     * @returns {boolean}
     */
    static validateRequired(value) {
        return value !== null && value !== undefined && value.trim() !== '';
    }

    /**
     * Valida la longitud mínima
     * @param {string} value - Valor a validar
     * @param {number} minLength - Longitud mínima
     * @returns {boolean}
     */
    static validateMinLength(value, minLength) {
        return value && value.length >= minLength;
    }

    /**
     * Valida la longitud máxima
     * @param {string} value - Valor a validar
     * @param {number} maxLength - Longitud máxima
     * @returns {boolean}
     */
    static validateMaxLength(value, maxLength) {
        return !value || value.length <= maxLength;
    }

    /**
     * Valida un número de teléfono
     * @param {string} phone - Número de teléfono
     * @returns {boolean}
     */
    static validatePhone(phone) {
        const regex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
        return regex.test(phone);
    }

    /**
     * Valida una URL
     * @param {string} url - URL a validar
     * @returns {boolean}
     */
    static validateURL(url) {
        try {
            new URL(url);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Muestra un mensaje de error en un elemento
     * @param {HTMLElement} errorAlert - Elemento de alerta
     * @param {HTMLElement} errorMessage - Elemento de mensaje
     * @param {string} message - Mensaje a mostrar
     */
    static showError(errorAlert, errorMessage, message) {
        if (!errorAlert || !errorMessage) return;

        errorMessage.innerHTML = message;
        errorAlert.classList.remove('hidden');
        errorAlert.classList.add('animate-slide-in');
    }

    /**
     * Oculta el mensaje de error
     * @param {HTMLElement} errorAlert - Elemento de alerta
     * @param {HTMLElement} errorMessage - Elemento de mensaje
     */
    static hideError(errorAlert, errorMessage) {
        if (!errorAlert || !errorMessage) return;

        errorMessage.innerHTML = '';
        errorAlert.classList.add('hidden');
    }

    /**
     * Muestra errores detallados de validación
     * @param {string} titulo - Título del error
     * @param {Array} errores - Array de objetos {campo, mensaje}
     */
    static mostrarErrorDetallado(titulo, errores) {
        const errorAlert = document.getElementById('error-alert');
        const errorMessage = document.getElementById('error-message');

        if (!errorAlert || !errorMessage) return;

        let html = `<strong class="block mb-2">${titulo}</strong>`;
        html += `<ul class="ml-4 list-disc list-inside text-sm space-y-1">`;
        
        errores.forEach(err => {
            html += `<li><strong>${err.campo}</strong>: ${err.mensaje}</li>`;
        });
        
        html += `</ul>`;

        errorMessage.innerHTML = html;
        errorAlert.classList.remove('hidden');
        errorAlert.classList.add('animate-slide-in');
    }

    /**
     * Valida un campo en tiempo real
     * @param {HTMLElement} input - Campo de input
     * @param {Function} validationFn - Función de validación
     */
    static setupRealtimeValidation(input, validationFn) {
        if (!input) return;

        const validateAndStyle = () => {
            const isValid = validationFn(input.value);
            
            if (input.value && !isValid) {
                input.classList.add('border-red-500', 'dark:border-red-400');
                input.classList.remove('border-green-500', 'dark:border-green-400');
            } else if (input.value && isValid) {
                input.classList.add('border-green-500', 'dark:border-green-400');
                input.classList.remove('border-red-500', 'dark:border-red-400');
            } else {
                input.classList.remove('border-red-500', 'border-green-500', 'dark:border-red-400', 'dark:border-green-400');
            }
        };

        input.addEventListener('input', validateAndStyle);
        input.addEventListener('blur', validateAndStyle);
    }

    /**
     * Sanitiza un string para prevenir XSS
     * @param {string} str - String a sanitizar
     * @returns {string}
     */
    static sanitize(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

// Exportar para uso global
window.FormValidator = FormValidator;

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FormValidator;
}