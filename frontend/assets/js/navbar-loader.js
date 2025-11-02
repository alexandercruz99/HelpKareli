/* ============================================
   SPEAKLEXI - CARGADOR DE NAVBAR
   Archivo: assets/js/navbar-loader.js
   ============================================ */

/**
 * Carga el componente navbar dinámicamente
 */
class NavbarLoader {
    constructor() {
        // ✅ RUTA ABSOLUTA desde la raíz del proyecto
        this.navbarPath = '/assets/components/navbar.html';
        this.init();
    }

    async init() {
        await this.loadNavbar();
        this.setupMobileMenu();
        console.log('✅ Navbar cargado y configurado');
    }

    /**
     * Carga el navbar desde el archivo HTML
     */
    async loadNavbar() {
        try {
            console.log('📥 Cargando navbar desde:', this.navbarPath);
            const response = await fetch(this.navbarPath);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: No se pudo cargar el navbar`);
            }
            
            const html = await response.text();
            
            // Crear elemento temporal
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            
            // Remover el script inline del navbar para evitar duplicados
            const script = tempDiv.querySelector('script');
            if (script) {
                script.remove();
            }
            
            // Insertar al inicio del body
            const navElement = tempDiv.firstElementChild;
            if (navElement) {
                document.body.insertBefore(navElement, document.body.firstChild);
                console.log('✅ Navbar insertado correctamente');
            }
            
        } catch (error) {
            console.error('❌ Error al cargar navbar:', error.message);
            console.warn('⚠️ Usando navbar de respaldo');
            this.createFallbackNavbar();
        }
    }

    /**
     * Crea un navbar de respaldo si falla la carga
     */
    createFallbackNavbar() {
        const fallbackNavbar = `
            <nav class="fixed w-full z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex justify-between h-16 items-center">
                        <div class="flex items-center space-x-2">
                            <a href="/index.html" class="flex items-center space-x-2 group">
                                <div class="w-8 h-8 bg-gradient-to-r from-secondary-600 to-primary-600 rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                                    <i class="fas fa-comments text-white text-sm"></i>
                                </div>
                                <h1 class="text-2xl font-bold bg-gradient-to-r from-secondary-600 to-primary-600 bg-clip-text text-transparent">
                                    SpeakLexi
                                </h1>
                            </a>
                        </div>
                        
                        <div class="flex items-center space-x-4">
                            <button id="theme-toggle" class="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label="Cambiar tema">
                                <i class="fas fa-moon text-gray-600 dark:text-yellow-400" id="theme-icon"></i>
                            </button>
                            
                            <div class="hidden md:flex space-x-4">
                                <a href="/index.html" class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors">
                                    Inicio
                                </a>
                                <a href="/pages/auth/login.html" class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors">
                                    Iniciar Sesión
                                </a>
                                <a href="/pages/auth/registro.html" class="px-4 py-2 bg-gradient-to-r from-secondary-600 to-primary-600 text-white rounded-lg font-medium hover:from-secondary-700 hover:to-primary-700 transform hover:-translate-y-0.5 transition-all duration-200 shadow-md hover:shadow-lg">
                                    Registrarse
                                </a>
                            </div>

                            <button id="mobile-menu-toggle" class="md:hidden p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" aria-label="Abrir menú">
                                <i class="fas fa-bars text-gray-600 dark:text-gray-300"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <div id="mobile-menu" class="hidden md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                    <div class="px-4 py-4 space-y-2">
                        <a href="/index.html" class="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                            Inicio
                        </a>
                        <a href="/pages/auth/login.html" class="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                            Iniciar Sesión
                        </a>
                        <a href="/pages/auth/registro.html" class="block px-4 py-2 bg-gradient-to-r from-secondary-600 to-primary-600 text-white rounded-lg font-medium text-center">
                            Registrarse
                        </a>
                    </div>
                </div>
            </nav>
        `;

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = fallbackNavbar;
        document.body.insertBefore(tempDiv.firstElementChild, document.body.firstChild);
        console.log('✅ Navbar de respaldo insertado');
    }

    /**
     * Configura el menú móvil
     */
    setupMobileMenu() {
        // Pequeño delay para asegurar que el DOM esté listo
        setTimeout(() => {
            const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
            const mobileMenu = document.getElementById('mobile-menu');
            
            if (mobileMenuToggle && mobileMenu) {
                mobileMenuToggle.addEventListener('click', () => {
                    mobileMenu.classList.toggle('hidden');
                    const icon = mobileMenuToggle.querySelector('i');
                    if (icon) {
                        icon.classList.toggle('fa-bars');
                        icon.classList.toggle('fa-times');
                    }
                });
                console.log('✅ Menú móvil configurado');
            } else {
                console.warn('⚠️ No se encontró el menú móvil');
            }
        }, 50);
    }
}

// Inicializar automáticamente cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new NavbarLoader();
    });
} else {
    // El DOM ya está listo, inicializar inmediatamente
    new NavbarLoader();
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NavbarLoader;
}