// frontend/public/js/config.js

const API_CONFIG = {
    BASE_URL: 'http://localhost:5000',
    API_URL: 'http://localhost:5000/api',
    
    ENDPOINTS: {
        // Auth
        REGISTRO: '/auth/registro',
        LOGIN: '/auth/login',
        VERIFICAR: '/auth/verificar',
        REENVIAR_CODIGO: '/auth/reenviar-verificacion',
        RECUPERAR: '/auth/recuperar-contrasena',
        RESTABLECER: '/auth/restablecer-contrasena',
        ACTUALIZAR_NIVEL: '/auth/actualizar-nivel',
        
        // Health
        HEALTH: '/health',
        CONFIG: '/config'
    },
    
    // Configuración de almacenamiento local
    STORAGE: {
        TOKEN_KEY: 'token',
        USER_KEY: 'usuario',
        THEME_KEY: 'color-theme',
        EMAIL_KEY: 'correo',
        IDIOMA_KEY: 'idioma'
    }
};

// Helper simple para peticiones
const API = {
    /**
     * Realizar petición HTTP a la API
     */
    async request(endpoint, options = {}) {
        const url = `${API_CONFIG.BASE_URL}${endpoint}`;
        const token = localStorage.getItem(API_CONFIG.STORAGE.TOKEN_KEY);
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            ...options
        };
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `Error ${response.status}`);
            }
            
            return { success: true, data };
        } catch (error) {
            console.error('❌ API Error:', error);
            return { success: false, error: error.message };
        }
    },
    
    /**
     * Petición POST
     */
    async post(endpoint, body) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    },
    
    /**
     * Petición GET
     */
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },
    
    /**
     * Petición PATCH
     */
    async patch(endpoint, body) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(body)
        });
    },
    
    /**
     * Petición DELETE
     */
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
};

// Utilidades de autenticación
const Auth = {
    /**
     * Guardar token y usuario
     */
    login(token, usuario) {
        localStorage.setItem(API_CONFIG.STORAGE.TOKEN_KEY, token);
        localStorage.setItem(API_CONFIG.STORAGE.USER_KEY, JSON.stringify(usuario));
    },
    
    /**
     * Cerrar sesión
     */
    logout() {
        localStorage.removeItem(API_CONFIG.STORAGE.TOKEN_KEY);
        localStorage.removeItem(API_CONFIG.STORAGE.USER_KEY);
    },
    
    /**
     * Obtener usuario actual
     */
    getUser() {
        const userStr = localStorage.getItem(API_CONFIG.STORAGE.USER_KEY);
        return userStr ? JSON.parse(userStr) : null;
    },
    
    /**
     * Obtener token
     */
    getToken() {
        return localStorage.getItem(API_CONFIG.STORAGE.TOKEN_KEY);
    },
    
    /**
     * Verificar si está autenticado
     */
    isAuthenticated() {
        return !!this.getToken() && !!this.getUser();
    }
};

// Exportar para usar globalmente
window.API_CONFIG = API_CONFIG;
window.API = API;
window.Auth = Auth;

console.log('✅ Config.js cargado');