/* ============================================
   SPEAKLEXI - UTILIDADES GENERALES
   Archivo: assets/js/utils.js
   ============================================ */

/**
 * Utilidades generales para la aplicación
 */
class Utils {
    /**
     * Formatea una fecha
     * @param {Date|string} date - Fecha a formatear
     * @param {string} format - Formato ('short', 'long', 'time')
     * @returns {string}
     */
    static formatDate(date, format = 'short') {
        const d = new Date(date);
        
        const formats = {
            short: { day: '2-digit', month: '2-digit', year: 'numeric' },
            long: { day: 'numeric', month: 'long', year: 'numeric' },
            time: { hour: '2-digit', minute: '2-digit' },
            full: { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
            }
        };
        
        return d.toLocaleDateString('es-ES', formats[format] || formats.short);
    }

    /**
     * Espera un tiempo determinado
     * @param {number} ms - Milisegundos a esperar
     * @returns {Promise}
     */
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Genera un ID único
     * @returns {string}
     */
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Copia texto al portapapeles
     * @param {string} text - Texto a copiar
     * @returns {Promise<boolean>}
     */
    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.error('Error al copiar:', err);
            return false;
        }
    }

    /**
     * Detecta si es un dispositivo móvil
     * @returns {boolean}
     */
    static isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    /**
     * Detecta el navegador
     * @returns {string}
     */
    static getBrowser() {
        const userAgent = navigator.userAgent;
        
        if (userAgent.includes('Chrome')) return 'Chrome';
        if (userAgent.includes('Safari')) return 'Safari';
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Edge')) return 'Edge';
        if (userAgent.includes('Opera')) return 'Opera';
        
        return 'Unknown';
    }

    /**
     * Formatea un número con separadores de miles
     * @param {number} num - Número a formatear
     * @returns {string}
     */
    static formatNumber(num) {
        return new Intl.NumberFormat('es-ES').format(num);
    }

    /**
     * Capitaliza la primera letra de un string
     * @param {string} str - String a capitalizar
     * @returns {string}
     */
    static capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    /**
     * Trunca un texto
     * @param {string} text - Texto a truncar
     * @param {number} maxLength - Longitud máxima
     * @returns {string}
     */
    static truncate(text, maxLength = 100) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    /**
     * Obtiene parámetros de la URL
     * @param {string} param - Nombre del parámetro
     * @returns {string|null}
     */
    static getURLParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    }

    /**
     * Actualiza un parámetro de la URL sin recargar
     * @param {string} param - Nombre del parámetro
     * @param {string} value - Valor del parámetro
     */
    static setURLParam(param, value) {
        const url = new URL(window.location);
        url.searchParams.set(param, value);
        window.history.pushState({}, '', url);
    }

    /**
     * Valida si un objeto está vacío
     * @param {Object} obj - Objeto a validar
     * @returns {boolean}
     */
    static isEmpty(obj) {
        return Object.keys(obj).length === 0;
    }

    /**
     * Debounce function
     * @param {Function} func - Función a ejecutar
     * @param {number} wait - Tiempo de espera en ms
     * @returns {Function}
     */
    static debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Throttle function
     * @param {Function} func - Función a ejecutar
     * @param {number} limit - Límite de tiempo en ms
     * @returns {Function}
     */
    static throttle(func, limit = 300) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Scroll suave a un elemento
     * @param {string|HTMLElement} target - Selector o elemento
     * @param {number} offset - Offset en píxeles
     */
    static scrollTo(target, offset = 0) {
        const element = typeof target === 'string' 
            ? document.querySelector(target) 
            : target;
            
        if (!element) return;
        
        const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
        
        window.scrollTo({
            top: top,
            behavior: 'smooth'
        });
    }

    /**
     * Detecta si un elemento está visible en el viewport
     * @param {HTMLElement} element - Elemento a verificar
     * @returns {boolean}
     */
    static isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    /**
     * Guarda datos en localStorage de forma segura
     * @param {string} key - Clave
     * @param {any} value - Valor
     */
    static saveToStorage(key, value) {
        try {
            const serialized = JSON.stringify(value);
            localStorage.setItem(key, serialized);
        } catch (error) {
            console.error('Error al guardar en localStorage:', error);
        }
    }

    /**
     * Obtiene datos de localStorage de forma segura
     * @param {string} key - Clave
     * @param {any} defaultValue - Valor por defecto
     * @returns {any}
     */
    static getFromStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error al leer de localStorage:', error);
            return defaultValue;
        }
    }

    /**
     * Limpia un valor de localStorage
     * @param {string} key - Clave
     */
    static removeFromStorage(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Error al eliminar de localStorage:', error);
        }
    }

    /**
     * Limpia todo el localStorage
     */
    static clearStorage() {
        try {
            localStorage.clear();
        } catch (error) {
            console.error('Error al limpiar localStorage:', error);
        }
    }

    /**
     * Escapa caracteres HTML
     * @param {string} text - Texto a escapar
     * @returns {string}
     */
    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Genera un color aleatorio
     * @returns {string}
     */
    static randomColor() {
        return '#' + Math.floor(Math.random()*16777215).toString(16);
    }

    /**
     * Convierte un string a slug
     * @param {string} text - Texto a convertir
     * @returns {string}
     */
    static slugify(text) {
        return text
            .toString()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]+/g, '')
            .replace(/--+/g, '-');
    }

    /**
     * Obtiene el tiempo transcurrido desde una fecha
     * @param {Date|string} date - Fecha
     * @returns {string}
     */
    static timeAgo(date) {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        
        const intervals = {
            año: 31536000,
            mes: 2592000,
            semana: 604800,
            día: 86400,
            hora: 3600,
            minuto: 60,
            segundo: 1
        };
        
        for (const [name, value] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / value);
            if (interval >= 1) {
                return `Hace ${interval} ${name}${interval > 1 ? 's' : ''}`;
            }
        }
        
        return 'Justo ahora';
    }
}

// Exportar para uso global
window.Utils = Utils;

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}