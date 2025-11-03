/* ============================================
   SPEAKLEXI - GESTOR DE TEMA OSCURO/CLARO MEJORADO
   Archivo: assets/js/core/theme-manager.js
   ============================================ */

class ThemeManager {
    constructor() {
        this.config = window.APP_CONFIG || {};
        this.storageKey = this.config.STORAGE?.KEYS?.THEME || 'color-theme';
        this.themes = this.config.UI?.THEMES || ['light', 'dark', 'auto'];
        this.currentTheme = 'light';
        this.isInitialized = false;
        
        this.init();
    }

    /**
     * Inicializa el gestor de temas
     */
    init() {
        if (this.isInitialized) {
            console.warn('⚠️ Theme Manager ya estaba inicializado');
            return;
        }

        try {
            this.loadTheme();
            this.setupEventListeners();
            this.setupMutationObserver();
            this.isInitialized = true;
            
            console.log('✅ Theme Manager inicializado correctamente');
            
            // Disparar evento personalizado
            this.dispatchThemeChangeEvent();
            
        } catch (error) {
            console.error('💥 Error inicializando Theme Manager:', error);
        }
    }

    /**
     * Carga el tema guardado o preferencia del sistema
     */
    loadTheme() {
        const savedTheme = localStorage.getItem(this.storageKey);
        
        // Si no hay tema guardado, usar 'auto' por defecto
        if (!savedTheme || savedTheme === 'auto') {
            this.setTheme('auto');
            return;
        }

        // Validar que el tema guardado sea válido
        if (this.themes.includes(savedTheme)) {
            this.setTheme(savedTheme);
        } else {
            console.warn(`Tema no válido: ${savedTheme}, usando auto`);
            this.setTheme('auto');
        }
    }

    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        // Buscar y configurar botones de tema
        this.setupThemeButtons();
        
        // Escuchar cambios del sistema para tema 'auto'
        this.setupSystemPreferenceListener();
        
        // Escuchar mensajes entre pestañas
        this.setupStorageSync();
    }

    /**
     * Configura observador de mutaciones para botones dinámicos
     */
    setupMutationObserver() {
        // Observar cambios en el DOM para detectar botones de tema que se agreguen dinámicamente
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    this.setupThemeButtons();
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Busca y configura todos los botones de tema
     */
    setupThemeButtons() {
        // Buscar por ID específico
        const themeButton = document.getElementById('theme-toggle');
        if (themeButton && !themeButton.hasAttribute('data-theme-bound')) {
            themeButton.setAttribute('data-theme-bound', 'true');
            themeButton.addEventListener('click', () => this.toggleTheme());
        }

        // Buscar por clase común
        const themeButtons = document.querySelectorAll('.theme-toggle, [data-theme-toggle]');
        themeButtons.forEach(button => {
            if (!button.hasAttribute('data-theme-bound')) {
                button.setAttribute('data-theme-bound', 'true');
                button.addEventListener('click', () => this.toggleTheme());
            }
        });

        // Buscar por data attribute
        const dataThemeButtons = document.querySelectorAll('[data-theme]');
        dataThemeButtons.forEach(button => {
            if (!button.hasAttribute('data-theme-bound')) {
                button.setAttribute('data-theme-bound', 'true');
                const theme = button.getAttribute('data-theme');
                button.addEventListener('click', () => this.setTheme(theme));
            }
        });
    }

    /**
     * Escucha cambios del sistema para tema 'auto'
     */
    setupSystemPreferenceListener() {
        this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        this.mediaQuery.addEventListener('change', (e) => {
            if (this.currentTheme === 'auto') {
                this.applyTheme(e.matches ? 'dark' : 'light');
                this.dispatchThemeChangeEvent();
            }
        });
    }

    /**
     * Sincroniza tema entre pestañas
     */
    setupStorageSync() {
        window.addEventListener('storage', (e) => {
            if (e.key === this.storageKey && e.newValue) {
                this.setTheme(e.newValue, false); // false = no guardar en storage
            }
        });
    }

    /**
     * Establece el tema
     * @param {string} theme - Tema a aplicar ('light', 'dark', 'auto')
     * @param {boolean} saveToStorage - Si guardar en localStorage
     */
    setTheme(theme, saveToStorage = true) {
        // Validar tema
        if (!this.themes.includes(theme)) {
            console.warn(`Tema no válido: ${theme}. Temas válidos:`, this.themes);
            return;
        }

        const previousTheme = this.currentTheme;
        this.currentTheme = theme;

        // Aplicar tema visual
        if (theme === 'auto') {
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.applyTheme(systemPrefersDark ? 'dark' : 'light');
        } else {
            this.applyTheme(theme);
        }

        // Guardar en storage si es necesario
        if (saveToStorage) {
            localStorage.setItem(this.storageKey, theme);
        }

        // Actualizar UI
        this.updateThemeUI();

        // Disparar evento si el tema cambió
        if (previousTheme !== theme) {
            this.dispatchThemeChangeEvent();
        }

        console.log(`🎨 Tema cambiado a: ${theme}`);
    }

    /**
     * Aplica el tema visual al documento
     */
    applyTheme(theme) {
        // Remover todas las clases de tema
        document.documentElement.classList.remove('light', 'dark');
        
        // Agregar clase del tema actual
        document.documentElement.classList.add(theme);
        
        // Actualizar meta theme-color
        this.updateMetaThemeColor(theme);
    }

    /**
     * Actualiza el color del meta tag theme-color
     */
    updateMetaThemeColor(theme) {
        let themeColor = '#ffffff'; // light default
        
        if (theme === 'dark') {
            themeColor = '#1f2937'; // gray-800
        }

        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }
        metaThemeColor.content = themeColor;
    }

    /**
     * Actualiza la UI (íconos, textos, etc.)
     */
    updateThemeUI() {
        // Actualizar íconos
        this.updateIcons();
        
        // Actualizar textos en botones
        this.updateButtonTexts();
        
        // Actualizar aria-labels para accesibilidad
        this.updateAccessibility();
    }

    /**
     * Actualiza los íconos de tema
     */
    updateIcons() {
        const isDark = document.documentElement.classList.contains('dark');
        const themeIcons = document.querySelectorAll('#theme-icon, .theme-icon, [data-theme-icon]');
        
        themeIcons.forEach(icon => {
            if (isDark) {
                // Tema oscuro: mostrar sol
                icon.classList.remove('fa-moon', 'fa-moon-stars');
                icon.classList.add('fa-sun');
            } else {
                // Tema claro: mostrar luna
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
        });
    }

    /**
     * Actualiza textos de botones
     */
    updateButtonTexts() {
        const isDark = document.documentElement.classList.contains('dark');
        const themeTexts = document.querySelectorAll('[data-theme-text]');
        
        themeTexts.forEach(element => {
            if (isDark) {
                element.textContent = element.getAttribute('data-theme-text-dark') || 'Modo claro';
            } else {
                element.textContent = element.getAttribute('data-theme-text-light') || 'Modo oscuro';
            }
        });
    }

    /**
     * Actualiza accesibilidad
     */
    updateAccessibility() {
        const isDark = document.documentElement.classList.contains('dark');
        const themeButtons = document.querySelectorAll('#theme-toggle, .theme-toggle');
        
        themeButtons.forEach(button => {
            button.setAttribute('aria-label', isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
            button.setAttribute('aria-pressed', isDark.toString());
        });
    }

    /**
     * Cambia entre temas
     */
    toggleTheme() {
        const themes = ['light', 'dark', 'auto'];
        const currentIndex = themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        
        this.setTheme(themes[nextIndex]);
    }

    /**
     * Obtiene el tema actual efectivo (light/dark)
     */
    getEffectiveTheme() {
        return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }

    /**
     * Obtiene el tema configurado
     */
    getConfiguredTheme() {
        return this.currentTheme;
    }

    /**
     * Dispara evento personalizado para notificar cambios
     */
    dispatchThemeChangeEvent() {
        const event = new CustomEvent('themeChange', {
            detail: {
                theme: this.currentTheme,
                effectiveTheme: this.getEffectiveTheme(),
                timestamp: new Date()
            }
        });
        
        document.dispatchEvent(event);
    }

    /**
     * Suscribirse a cambios de tema
     */
    onThemeChange(callback) {
        document.addEventListener('themeChange', callback);
    }

    /**
     * Destruye el theme manager y limpia event listeners
     */
    destroy() {
        if (this.mediaQuery) {
            this.mediaQuery.removeEventListener('change', this.systemPreferenceHandler);
        }
        
        const themeButtons = document.querySelectorAll('[data-theme-bound]');
        themeButtons.forEach(button => {
            button.removeAttribute('data-theme-bound');
            button.replaceWith(button.cloneNode(true));
        });
        
        this.isInitialized = false;
        console.log('🗑️ Theme Manager destruido');
    }
}

// Exportación para diferentes entornos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}

// Inicialización automática mejorada
function initializeThemeManager() {
    if (window.themeManager) {
        console.warn('⚠️ Theme Manager ya existe');
        return window.themeManager;
    }

    try {
        window.themeManager = new ThemeManager();
        return window.themeManager;
    } catch (error) {
        console.error('💥 Error crítico inicializando Theme Manager:', error);
        
        // Fallback básico
        document.documentElement.classList.remove('dark');
        return null;
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeThemeManager);
} else {
    setTimeout(initializeThemeManager, 0);
}

// Hacer disponible globalmente
window.ThemeManager = ThemeManager;