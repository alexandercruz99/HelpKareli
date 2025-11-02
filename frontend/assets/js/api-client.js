/* ============================================
   SPEAKLEXI - CLIENTE API
   Archivo: assets/js/api-client.js
   ============================================ */

/**
 * Cliente HTTP centralizado para comunicación con la API
 */
class APIClient {
    constructor(baseURL = 'http://localhost:5000/api') {
        this.baseURL = baseURL;
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        };
        console.log('✅ API Client inicializado:', this.baseURL);
    }

    /**
     * Obtiene el token de autenticación del localStorage
     * @returns {string|null}
     */
    getAuthToken() {
        return localStorage.getItem('token');
    }

    /**
     * Establece el token de autenticación
     * @param {string} token - Token JWT
     */
    setAuthToken(token) {
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    }

    /**
     * Obtiene los headers con autenticación
     * @param {Object} customHeaders - Headers adicionales
     * @returns {Object}
     */
    getHeaders(customHeaders = {}) {
        const headers = { ...this.defaultHeaders, ...customHeaders };
        
        const token = this.getAuthToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return headers;
    }

    /**
     * Realiza una petición HTTP
     * @param {string} endpoint - Endpoint de la API
     * @param {Object} options - Opciones de fetch
     * @returns {Promise<Object>}
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            ...options,
            headers: this.getHeaders(options.headers)
        };

        try {
            console.log(`📤 ${options.method || 'GET'} ${url}`);
            
            const response = await fetch(url, config);
            const data = await response.json();

            console.log(`📥 Status: ${response.status}`, data);

            if (!response.ok) {
                return {
                    success: false,
                    status: response.status,
                    error: data.error || data.mensaje || 'Error en la petición',
                    errores: data.errores || [],
                    data: data
                };
            }

            return {
                success: true,
                status: response.status,
                data: data
            };

        } catch (error) {
            console.error('💥 Error en petición:', error);
            
            let errorMessage = 'Error de conexión con el servidor';
            
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                errorMessage = 'No se pudo conectar al servidor. Verifica tu conexión a internet.';
            }

            return {
                success: false,
                status: 0,
                error: errorMessage,
                originalError: error
            };
        }
    }

    /**
     * Petición GET
     * @param {string} endpoint - Endpoint
     * @param {Object} params - Query parameters
     * @returns {Promise<Object>}
     */
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        
        return this.request(url, {
            method: 'GET'
        });
    }

    /**
     * Petición POST
     * @param {string} endpoint - Endpoint
     * @param {Object} body - Cuerpo de la petición
     * @returns {Promise<Object>}
     */
    async post(endpoint, body = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }

    /**
     * Petición PUT
     * @param {string} endpoint - Endpoint
     * @param {Object} body - Cuerpo de la petición
     * @returns {Promise<Object>}
     */
    async put(endpoint, body = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body)
        });
    }

    /**
     * Petición PATCH
     * @param {string} endpoint - Endpoint
     * @param {Object} body - Cuerpo de la petición
     * @returns {Promise<Object>}
     */
    async patch(endpoint, body = {}) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(body)
        });
    }

    /**
     * Petición DELETE
     * @param {string} endpoint - Endpoint
     * @returns {Promise<Object>}
     */
    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }

    /**
     * Sube un archivo
     * @param {string} endpoint - Endpoint
     * @param {FormData} formData - FormData con el archivo
     * @returns {Promise<Object>}
     */
    async uploadFile(endpoint, formData) {
        const url = `${this.baseURL}${endpoint}`;
        
        try {
            const token = this.getAuthToken();
            const headers = {};
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    status: response.status,
                    error: data.error || data.mensaje || 'Error al subir archivo',
                    data: data
                };
            }

            return {
                success: true,
                status: response.status,
                data: data
            };

        } catch (error) {
            console.error('💥 Error al subir archivo:', error);
            return {
                success: false,
                status: 0,
                error: 'Error al subir el archivo',
                originalError: error
            };
        }
    }

    /**
     * Maneja errores de autenticación
     * @param {Object} response - Respuesta de la API
     */
    handleAuthError(response) {
        if (response.status === 401 || response.status === 403) {
            this.setAuthToken(null);
            
            if (window.toastManager) {
                window.toastManager.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
            }
            
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 2000);
        }
    }

    /**
     * Métodos específicos de la API de SpeakLexi
     */

    // Auth endpoints
    async registro(userData) {
        return this.post('/auth/registro', userData);
    }

    async login(credentials) {
        return this.post('/auth/login', credentials);
    }

    async verificarEmail(codigo, correo) {
        return this.post('/auth/verificar-email', { codigo, correo });
    }

    async reenviarCodigo(correo) {
        return this.post('/auth/reenviar-codigo', { correo });
    }

    // User endpoints
    async getProfile() {
        return this.get('/users/profile');
    }

    async updateProfile(data) {
        return this.put('/users/profile', data);
    }

    // Evaluación endpoints
    async submitEvaluacion(data) {
        return this.post('/evaluacion/submit', data);
    }

    async getResultados() {
        return this.get('/evaluacion/resultados');
    }
}

// Crear instancia global automáticamente
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.apiClient = new APIClient();
    });
} else {
    window.apiClient = new APIClient();
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIClient;
}