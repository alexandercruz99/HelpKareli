/* ============================================
   SPEAKLEXI - GESTOR DE TEMA OSCURO/CLARO
   Archivo: assets/js/theme-manager.js
   ============================================ */

/**
 * Clase para gestionar el tema oscuro/claro de la aplicación
 */
class ThemeManager {
    constructor() {
        this.storageKey = 'color-theme';
        this.isInitialized = false;
        
        this.init();
    }

    /**
     * Inicializa el gestor de temas
     */
    init() {
        this.loadThemePreference();
        
        // Esperar a que el DOM esté listo para buscar elementos
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupEventListeners();
                this.isInitialized = true;
                console.log('✅ Theme Manager inicializado');
            });
        } else {
            this.setupEventListeners();
            this.isInitialized = true;
            console.log('✅ Theme Manager inicializado');
        }
    }

    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        // Buscar el botón de tema en el DOM (puede cargarse dinámicamente)
        this.findAndAttachThemeToggle();
        
        // Escuchar cambios en la preferencia del sistema
        this.setupSystemPreferenceListener();
        
        // Observar cambios en el DOM para detectar navbar dinámico
        this.setupDOMObserver();
    }

    /**
     * Busca y adjunta event listeners al botón de tema
     */
    findAndAttachThemeToggle() {
        // Buscar el botón actual
        this.themeToggle = document.getElementById('theme-toggle');
        this.themeIcon = document.getElementById('theme-icon');
        
        if (this.themeToggle && this.themeIcon) {
            // Remover event listeners existentes para evitar duplicados
            this.themeToggle.replaceWith(this.themeToggle.cloneNode(true));
            this.themeToggle = document.getElementById('theme-toggle');
            this.themeIcon = document.getElementById('theme-icon');
            
            this.themeToggle.addEventListener('click', () => this.toggleTheme());
            console.log('🎯 Botón de tema encontrado y configurado');
        } else {
            console.log('⚠️ Botón de tema no encontrado, se intentará más tarde');
        }
    }

    /**
     * Configura el observer para detectar cambios en el DOM
     */
    setupDOMObserver() {
        // Observer para detectar cuando se carga el navbar dinámicamente
        this.observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        // Buscar el botón de tema en los nuevos nodos
                        if (node.querySelector) {
                            const toggle = node.querySelector('#theme-toggle');
                            const icon = node.querySelector('#theme-icon');
                            
                            if (toggle && icon && !this.themeToggle) {
                                this.themeToggle = toggle;
                                this.themeIcon = icon;
                                this.themeToggle.addEventListener('click', () => this.toggleTheme());
                                console.log('🎯 Botón de tema detectado dinámicamente');
                                
                                // Actualizar ícono según tema actual
                                const currentTheme = this.getCurrentTheme();
                                this.updateIcon(currentTheme);
                            }
                        }
                    }
                });
            });
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Configura el listener para preferencias del sistema
     */
    setupSystemPreferenceListener() {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
            // Solo actualizar si no hay preferencia guardada
            if (!localStorage.getItem(this.storageKey)) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    /**
     * Carga la preferencia de tema guardada
     */
    loadThemePreference() {
        const savedTheme = localStorage.getItem(this.storageKey);
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // Aplicar tema guardado o preferencia del sistema
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            this.setTheme('dark');
        } else {
            this.setTheme('light');
        }
    }

    /**
     * Establece el tema especificado
     * @param {string} theme - 'dark' o 'light'
     */
    setTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            this.updateIcon('dark');
        } else {
            document.documentElement.classList.remove('dark');
            this.updateIcon('light');
        }
        
        // Guardar preferencia
        localStorage.setItem(this.storageKey, theme);
        
        console.log(`🎨 Tema cambiado a: ${theme}`);
    }

    /**
     * Actualiza el ícono del botón de tema
     * @param {string} theme - 'dark' o 'light'
     */
    updateIcon(theme) {
        // Buscar el ícono actual si no está en cache
        if (!this.themeIcon) {
            this.themeIcon = document.getElementById('theme-icon');
        }
        
        if (!this.themeIcon) return;
        
        if (theme === 'dark') {
            this.themeIcon.classList.remove('fa-moon');
            this.themeIcon.classList.add('fa-sun');
        } else {
            this.themeIcon.classList.remove('fa-sun');
            this.themeIcon.classList.add('fa-moon');
        }
    }

    /**
     * Alterna entre tema oscuro y claro
     */
    toggleTheme() {
        const isDark = document.documentElement.classList.contains('dark');
        const newTheme = isDark ? 'light' : 'dark';
        
        this.setTheme(newTheme);
        
        // Animación opcional del botón
        if (this.themeToggle) {
            this.themeToggle.classList.add('animate-wiggle');
            setTimeout(() => {
                this.themeToggle.classList.remove('animate-wiggle');
            }, 500);
        }
    }

    /**
     * Obtiene el tema actual
     * @returns {string} - 'dark' o 'light'
     */
    getCurrentTheme() {
        return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }

    /**
     * Resetea la preferencia de tema
     */
    resetTheme() {
        localStorage.removeItem(this.storageKey);
        this.loadThemePreference();
    }

    /**
     * Forza la reconexión del botón de tema (útil para componentes dinámicos)
     */
    reconnectThemeButton() {
        console.log('🔄 Reconectando botón de tema...');
        this.themeToggle = null;
        this.themeIcon = null;
        this.findAndAttachThemeToggle();
        
        // Actualizar el ícono según el tema actual
        const currentTheme = this.getCurrentTheme();
        this.updateIcon(currentTheme);
    }
}

// Inicializar automáticamente cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.themeManager = new ThemeManager();
    });
} else {
    window.themeManager = new ThemeManager();
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}