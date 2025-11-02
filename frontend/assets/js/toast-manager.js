/* ============================================
   SPEAKLEXI - GESTOR DE NOTIFICACIONES TOAST
   Archivo: assets/js/toast-manager.js
   ============================================ */

/**
 * Clase para gestionar notificaciones toast
 */
class ToastManager {
    constructor(containerId = 'toast-container') {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        
        if (!this.container) {
            this.createContainer();
        }
        
        console.log('✅ Toast Manager inicializado');
    }

    /**
     * Crea el contenedor de toasts si no existe
     */
    createContainer() {
        this.container = document.createElement('div');
        this.container.id = this.containerId;
        this.container.className = 'fixed top-20 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none';
        document.body.appendChild(this.container);
    }

    /**
     * Muestra una notificación toast
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo de toast ('success', 'error', 'warning', 'info')
     * @param {number} duration - Duración en milisegundos (0 = no se cierra automáticamente)
     */
    show(message, type = 'info', duration = 4000) {
        const toast = this.createToast(message, type);
        this.container.appendChild(toast);
        
        // Trigger animation
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
            toast.style.opacity = '1';
        }, 10);
        
        // Auto-remove if duration is set
        if (duration > 0) {
            setTimeout(() => this.remove(toast), duration);
        }
        
        return toast;
    }

    /**
     * Crea el elemento HTML del toast
     * @param {string} message - Mensaje
     * @param {string} type - Tipo de toast
     * @returns {HTMLElement}
     */
    createToast(message, type) {
        const toast = document.createElement('div');
        const config = this.getToastConfig(type);
        
        toast.className = `${config.bg} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 transform transition-all duration-300 translate-x-full opacity-0 pointer-events-auto`;
        
        toast.innerHTML = `
            <i class="fas ${config.icon} text-lg flex-shrink-0"></i>
            <span class="flex-1 text-sm font-medium">${this.escapeHtml(message)}</span>
            <button class="toast-close text-white/80 hover:text-white transition-colors flex-shrink-0 ml-2">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Botón de cerrar
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.remove(toast));
        
        return toast;
    }

    /**
     * Obtiene la configuración de colores e íconos según el tipo
     * @param {string} type - Tipo de toast
     * @returns {Object}
     */
    getToastConfig(type) {
        const configs = {
            success: { 
                bg: 'bg-gradient-to-r from-green-500 to-green-600', 
                icon: 'fa-check-circle' 
            },
            error: { 
                bg: 'bg-gradient-to-r from-red-500 to-red-600', 
                icon: 'fa-exclamation-circle' 
            },
            warning: { 
                bg: 'bg-gradient-to-r from-yellow-500 to-yellow-600', 
                icon: 'fa-exclamation-triangle' 
            },
            info: { 
                bg: 'bg-gradient-to-r from-blue-500 to-blue-600', 
                icon: 'fa-info-circle' 
            }
        };
        
        return configs[type] || configs.info;
    }

    /**
     * Remueve un toast del DOM
     * @param {HTMLElement} toast - Elemento toast
     */
    remove(toast) {
        if (!toast || !toast.parentNode) return;
        
        toast.style.transform = 'translateX(100%)';
        toast.style.opacity = '0';
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }

    /**
     * Limpia todos los toasts
     */
    clearAll() {
        const toasts = this.container.querySelectorAll('.toast, [class*="bg-gradient"]');
        toasts.forEach(toast => this.remove(toast));
    }

    /**
     * Escapa HTML para prevenir XSS
     * @param {string} text - Texto a escapar
     * @returns {string}
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Métodos de acceso rápido
     */
    success(message, duration = 4000) {
        return this.show(message, 'success', duration);
    }

    error(message, duration = 5000) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration = 4000) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration = 4000) {
        return this.show(message, 'info', duration);
    }
}

// Crear instancia global automáticamente
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.toastManager = new ToastManager();
    });
} else {
    window.toastManager = new ToastManager();
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ToastManager;
}