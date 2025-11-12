/**
 * 🧪 Generador de Datos de Prueba - SpeakLexi
 * Versión: 2.0.0
 * Solo para entorno de desarrollo
 */

class GeneradorDatosPrueba {
    constructor() {
        this.API_BASE_URL = 'http://localhost:5000/api';
        this.TESTING_TOKEN = 'speaklexi-test-2024';
        this.config = {
            maxEstudiantes: 200,
            maxProfesores: 50,
            credenciales: {
                password: 'Test123!',
                nota: 'Todos los usuarios usan esta contraseña'
            }
        };

        this.estado = {
            generando: false,
            limpiando: false,
            ultimaAccion: null
        };

        this.inicializar();
    }

    // ============================================
    // INICIALIZACIÓN
    // ============================================

    async inicializar() {
        try {
            this.obtenerElementosDOM();
            this.registrarEventListeners();
            await this.verificarConexionAPI();
            this.mostrarBienvenida();
        } catch (error) {
            this.log(`❌ Error inicializando: ${error.message}`, 'error');
        }
    }

    obtenerElementosDOM() {
        this.elementos = {
            // Controles
            btnGenerarUsuarios: document.getElementById('btn-generar-usuarios'),
            btnLimpiarDatos: document.getElementById('btn-limpiar-datos'),
            cantEstudiantes: document.getElementById('cant-estudiantes'),
            cantProfesores: document.getElementById('cant-profesores'),
            chkIncluirProgreso: document.getElementById('incluir-progreso'),
            
            // Resultados
            resultados: document.getElementById('resultados'),
            logResultados: document.getElementById('log-resultados'),
            resumenPanel: document.getElementById('resumen-panel'),
            
            // Stats
            statsUsuarios: document.getElementById('stats-usuarios'),
            statsProgreso: document.getElementById('stats-progreso'),
            statsXP: document.getElementById('stats-xp'),
            
            // Panel de control avanzado
            panelAvanzado: document.getElementById('panel-avanzado'),
            btnToggleAvanzado: document.getElementById('btn-toggle-avanzado')
        };

        // Crear elementos dinámicos si no existen
        this.crearElementosDinamicos();
    }

    crearElementosDinamicos() {
        // Crear checkbox de progreso si no existe
        if (!this.elementos.chkIncluirProgreso) {
            const container = this.elementos.cantProfesores.parentElement;
            const progresoHTML = `
                <div class="mt-4">
                    <label class="flex items-center space-x-2">
                        <input type="checkbox" id="incluir-progreso" checked class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Incluir progreso automático</span>
                    </label>
                    <p class="text-xs text-gray-500 mt-1">Genera progreso de lecciones para los primeros 10 estudiantes</p>
                </div>
            `;
            container.insertAdjacentHTML('afterend', progresoHTML);
            this.elementos.chkIncluirProgreso = document.getElementById('incluir-progreso');
        }

        // Crear panel de resumen si no existe
        if (!this.elementos.resumenPanel) {
            const resultadosContainer = this.elementos.resultados;
            const resumenHTML = `
                <div id="resumen-panel" class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4 hidden">
                    <h3 class="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center">
                        <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm8-6a6 6 0 00-6 6c0 1.887.454 3.665 1.257 5.234a.5.5 0 00.656.254 10.97 10.97 0 013.087-1.227.5.5 0 00-.287-.904A5.977 5.977 0 014 10a6 6 0 016-6zm0 12c-1.028 0-2-.193-2.904-.534a.5.5 0 00-.292.958A7.98 7.98 0 0010 18a7.98 7.98 0 003.196-.646.5.5 0 00-.292-.958A6.004 6.004 0 0110 16z"/>
                        </svg>
                        Resumen de Datos Generados
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div id="stats-usuarios" class="text-center">
                            <div class="text-2xl font-bold text-blue-600">0</div>
                            <div class="text-blue-800 dark:text-blue-200">Usuarios</div>
                        </div>
                        <div id="stats-progreso" class="text-center">
                            <div class="text-2xl font-bold text-green-600">0</div>
                            <div class="text-green-800 dark:text-green-200">Progresos</div>
                        </div>
                        <div id="stats-xp" class="text-center">
                            <div class="text-2xl font-bold text-purple-600">0</div>
                            <div class="text-purple-800 dark:text-purple-200">XP Total</div>
                        </div>
                    </div>
                </div>
            `;
            resultadosContainer.insertAdjacentHTML('afterbegin', resumenHTML);
            this.elementos.resumenPanel = document.getElementById('resumen-panel');
            this.elementos.statsUsuarios = document.getElementById('stats-usuarios');
            this.elementos.statsProgreso = document.getElementById('stats-progreso');
            this.elementos.statsXP = document.getElementById('stats-xp');
        }
    }

    // ============================================
    // EVENT LISTENERS
    // ============================================

    registrarEventListeners() {
        // Generar usuarios
        this.elementos.btnGenerarUsuarios.addEventListener('click', () => {
            this.generarUsuarios();
        });

        // Limpiar datos
        this.elementos.btnLimpiarDatos.addEventListener('click', () => {
            this.limpiarDatos();
        });

        // Validar inputs en tiempo real
        this.elementos.cantEstudiantes.addEventListener('input', (e) => {
            this.validarInputNumerico(e.target, 1, this.config.maxEstudiantes);
        });

        this.elementos.cantProfesores.addEventListener('input', (e) => {
            this.validarInputNumerico(e.target, 1, this.config.maxProfesores);
        });

        // Atajos de teclado
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'g':
                        e.preventDefault();
                        this.generarUsuarios();
                        break;
                    case 'l':
                        e.preventDefault();
                        this.limpiarDatos();
                        break;
                }
            }
        });
    }

    // ============================================
    // VALIDACIONES
    // ============================================

    validarInputNumerico(input, min, max) {
        let valor = parseInt(input.value);
        
        if (isNaN(valor)) {
            input.value = min;
            return;
        }
        
        if (valor < min) {
            input.value = min;
        } else if (valor > max) {
            input.value = max;
        }
    }

    validarFormularioGeneracion() {
        const estudiantes = parseInt(this.elementos.cantEstudiantes.value);
        const profesores = parseInt(this.elementos.cantProfesores.value);

        if (isNaN(estudiantes) || isNaN(profesores)) {
            throw new Error('Las cantidades deben ser números válidos');
        }

        if (estudiantes < 1 || estudiantes > this.config.maxEstudiantes) {
            throw new Error(`Estudiantes debe estar entre 1 y ${this.config.maxEstudiantes}`);
        }

        if (profesores < 1 || profesores > this.config.maxProfesores) {
            throw new Error(`Profesores debe estar entre 1 y ${this.config.maxProfesores}`);
        }

        return { estudiantes, profesores };
    }

    // ============================================
    // COMUNICACIÓN CON API
    // ============================================

    async verificarConexionAPI() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/testing/status`, {
                headers: {
                    'x-testing-token': this.TESTING_TOKEN
                }
            });

            if (!response.ok) {
                throw new Error('API no disponible');
            }

            const data = await response.json();
            this.log('✅ Conectado al sistema de testing', 'success');
            return true;
        } catch (error) {
            this.log(`❌ No se pudo conectar a la API: ${error.message}`, 'error');
            this.log('💡 Asegúrate de que el servidor backend esté ejecutándose', 'warning');
            return false;
        }
    }

    async apiRequest(endpoint, method = 'GET', body = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'x-testing-token': this.TESTING_TOKEN
            }
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const startTime = Date.now();
        
        try {
            const response = await fetch(`${this.API_BASE_URL}${endpoint}`, options);
            const data = await response.json();
            const duration = Date.now() - startTime;

            if (!response.ok) {
                throw new Error(data.mensaje || `Error ${response.status}`);
            }

            this.log(`⚡ ${method} ${endpoint} (${duration}ms)`, 'info');
            return data;
        } catch (error) {
            this.log(`❌ Error en ${method} ${endpoint}: ${error.message}`, 'error');
            throw error;
        }
    }

    // ============================================
    // FUNCIONALIDADES PRINCIPALES
    // ============================================

    async generarUsuarios() {
        if (this.estado.generando) return;

        try {
            this.estado.generando = true;
            this.limpiarLog();
            this.ocultarResumen();

            const { estudiantes, profesores } = this.validarFormularioGeneracion();
            const incluirProgreso = this.elementos.chkIncluirProgreso?.checked || false;

            this.mostrarEstadoCarga('generar', true);

            this.log(`🚀 Iniciando generación de datos...`, 'info');
            this.log(`📊 Configuración: ${estudiantes} estudiantes, ${profesores} profesores`, 'info');
            if (incluirProgreso) {
                this.log('📈 Progreso automático: ACTIVADO', 'success');
            }

            const resultado = await this.apiRequest('/testing/generar-usuarios', 'POST', {
                cantidad_estudiantes: estudiantes,
                cantidad_profesores: profesores,
                incluir_progreso: incluirProgreso
            });

            this.mostrarResultadoGeneracion(resultado);
            this.estado.ultimaAccion = { tipo: 'generacion', timestamp: new Date(), datos: resultado };

        } catch (error) {
            this.log(`💥 Error durante la generación: ${error.message}`, 'error');
            
            if (error.message.includes('Cantidad excesiva')) {
                this.log('💡 Reduce la cantidad de usuarios a generar', 'warning');
            }
        } finally {
            this.estado.generando = false;
            this.mostrarEstadoCarga('generar', false);
        }
    }

    async limpiarDatos() {
        if (this.estado.limpiando) return;

        // Confirmación extra para limpiar datos
        const confirmacion = await this.mostrarConfirmacion(
            '⚠️ ¿Eliminar TODOS los datos de prueba?',
            'Esta acción eliminará permanentemente todos los usuarios de prueba (@test.speaklexi.com) y sus datos asociados. Esta acción no se puede deshacer.',
            'Eliminar Todo',
            'Cancelar'
        );

        if (!confirmacion) {
            this.log('❌ Limpieza cancelada por el usuario', 'warning');
            return;
        }

        try {
            this.estado.limpiando = true;
            this.limpiarLog();
            this.ocultarResumen();

            this.mostrarEstadoCarga('limpiar', true);
            this.log('🧹 Iniciando limpieza de datos de prueba...', 'warning');

            const resultado = await this.apiRequest('/testing/limpiar-datos', 'DELETE');

            this.log(`✅ ${resultado.mensaje}`, 'success');
            this.log(`🗑️ Usuarios eliminados: ${resultado.total_usuarios_eliminados}`, 'info');
            this.log(`📊 Total de registros eliminados: ${resultado.total_registros_eliminados}`, 'info');

            this.estado.ultimaAccion = { tipo: 'limpieza', timestamp: new Date(), datos: resultado };

            // Mostrar detalles de limpieza
            if (resultado.detalles) {
                this.log('📋 Detalles de limpieza:', 'info');
                Object.entries(resultado.detalles).forEach(([tabla, cantidad]) => {
                    if (cantidad > 0) {
                        this.log(`   📁 ${tabla}: ${cantidad} registros`, 'info');
                    }
                });
            }

        } catch (error) {
            this.log(`💥 Error durante la limpieza: ${error.message}`, 'error');
        } finally {
            this.estado.limpiando = false;
            this.mostrarEstadoCarga('limpiar', false);
        }
    }

    async generarProgresoIndividual(usuarioId) {
        try {
            this.log(`🎯 Generando progreso para usuario ${usuarioId}...`, 'info');
            
            const resultado = await this.apiRequest('/testing/generar-progreso', 'POST', {
                usuario_id: usuarioId,
                cantidad_lecciones: 3,
                forzar_reemplazo: true
            });

            this.log(`✅ Progreso generado: ${resultado.lecciones_asignadas} lecciones`, 'success');
            return resultado;
        } catch (error) {
            this.log(`❌ Error generando progreso: ${error.message}`, 'error');
            throw error;
        }
    }

    // ============================================
    // MANEJO DE RESULTADOS
    // ============================================

    mostrarResultadoGeneracion(resultado) {
        this.log(`✨ ${resultado.mensaje}`, 'success');
        this.log(`⏰ ${resultado.timestamp}`, 'info');
        this.log('', 'info');

        // Mostrar resumen
        this.mostrarResumen(resultado.resumen);

        // Mostrar credenciales
        this.log('🔐 Credenciales de acceso:', 'info');
        this.log(`   📧 Emails: @test.speaklexi.com`, 'info');
        this.log(`   🔑 Password: ${this.config.credenciales.password}`, 'info');
        this.log(`   💡 ${this.config.credenciales.nota}`, 'warning');
        this.log('', 'info');

        // Mostrar estudiantes (primeros 5)
        if (resultado.usuarios.estudiantes.length > 0) {
            this.log(`👨‍🎓 Estudiantes generados (${resultado.usuarios.estudiantes.length}):`, 'info');
            resultado.usuarios.estudiantes.slice(0, 5).forEach(est => {
                this.log(`   ✅ ${est.nombre} - ${est.email}`, 'success');
                this.log(`      📊 Nivel: ${est.nivel} | XP: ${est.xp} | Idioma: ${est.idioma}`, 'info');
            });
            
            if (resultado.usuarios.estudiantes.length > 5) {
                this.log(`   ... y ${resultado.usuarios.estudiantes.length - 5} estudiantes más`, 'info');
            }
            this.log('', 'info');
        }

        // Mostrar profesores
        if (resultado.usuarios.profesores.length > 0) {
            this.log(`👨‍🏫 Profesores generados (${resultado.usuarios.profesores.length}):`, 'info');
            resultado.usuarios.profesores.forEach(prof => {
                this.log(`   ✅ ${prof.nombre} - ${prof.email}`, 'success');
                this.log(`      🎯 ${prof.especialidad} (${prof.experiencia} años)`, 'info');
            });
            this.log('', 'info');
        }

        // Sugerencias
        this.log('💡 Próximos pasos:', 'info');
        this.log('   1. Usa las credenciales para iniciar sesión', 'info');
        this.log('   2. Explora las funcionalidades con datos reales', 'info');
        this.log('   3. Usa "Limpiar Datos" cuando termines las pruebas', 'info');
    }

    mostrarResumen(resumen) {
        if (!resumen) return;

        this.elementos.resumenPanel.classList.remove('hidden');
        
        // Actualizar estadísticas
        const totalUsuarios = (resumen.total_estudiantes || 0) + (resumen.total_profesores || 0);
        this.elementos.statsUsuarios.querySelector('div:first-child').textContent = totalUsuarios;
        this.elementos.statsProgreso.querySelector('div:first-child').textContent = resumen.progresos_generados || 0;
        this.elementos.statsXP.querySelector('div:first-child').textContent = resumen.xp_total || 0;
    }

    ocultarResumen() {
        if (this.elementos.resumenPanel) {
            this.elementos.resumenPanel.classList.add('hidden');
        }
    }

    // ============================================
    // INTERFAZ DE USUARIO
    // ============================================

    mostrarEstadoCarga(accion, cargando) {
        const botones = {
            generar: this.elementos.btnGenerarUsuarios,
            limpiar: this.elementos.btnLimpiarDatos
        };

        const boton = botones[accion];
        if (!boton) return;

        if (cargando) {
            boton.disabled = true;
            const textoOriginal = boton.innerHTML;
            boton.setAttribute('data-original-text', textoOriginal);
            
            if (accion === 'generar') {
                boton.innerHTML = `
                    <svg class="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generando...
                `;
            } else {
                boton.innerHTML = `
                    <svg class="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Limpiando...
                `;
            }
        } else {
            boton.disabled = false;
            const textoOriginal = boton.getAttribute('data-original-text');
            if (textoOriginal) {
                boton.innerHTML = textoOriginal;
            }
        }
    }

    log(mensaje, tipo = 'info') {
        const colores = {
            info: 'text-blue-600 dark:text-blue-400',
            success: 'text-green-600 dark:text-green-400',
            error: 'text-red-600 dark:text-red-400',
            warning: 'text-yellow-600 dark:text-yellow-400'
        };

        const iconos = {
            info: 'ℹ️',
            success: '✅',
            error: '❌',
            warning: '⚠️'
        };

        const linea = document.createElement('div');
        linea.className = `py-1 px-2 rounded ${colores[tipo]} font-mono text-sm`;
        linea.innerHTML = `<span class="mr-2">${iconos[tipo]}</span>${mensaje}`;
        
        this.elementos.logResultados.appendChild(linea);
        this.elementos.resultados.classList.remove('hidden');
        
        // Auto-scroll
        this.elementos.logResultados.scrollTop = this.elementos.logResultados.scrollHeight;
    }

    limpiarLog() {
        this.elementos.logResultados.innerHTML = '';
    }

    mostrarBienvenida() {
        this.log('🧪 Generador de Datos de Prueba - SpeakLexi', 'success');
        this.log('📍 Conectado al sistema de testing', 'info');
        this.log('💡 Usa los controles para generar datos de prueba', 'info');
        this.log('🔧 Atajos: Ctrl+G (Generar) | Ctrl+L (Limpiar)', 'info');
        this.log('', 'info');
    }

    async mostrarConfirmacion(titulo, mensaje, textoConfirmar, textoCancelar) {
        return new Promise((resolve) => {
            // Crear modal de confirmación
            const modalHTML = `
                <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">${titulo}</h3>
                        <p class="text-gray-600 dark:text-gray-400 mb-6">${mensaje}</p>
                        <div class="flex space-x-3 justify-end">
                            <button id="confirm-cancel" class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
                                ${textoCancelar}
                            </button>
                            <button id="confirm-ok" class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
                                ${textoConfirmar}
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHTML);
            const modal = document.querySelector('.fixed.inset-0');

            const cleanup = () => {
                modal.remove();
                document.removeEventListener('keydown', handleKeydown);
            };

            const handleKeydown = (e) => {
                if (e.key === 'Escape') {
                    resolve(false);
                    cleanup();
                }
            };

            document.getElementById('confirm-cancel').addEventListener('click', () => {
                resolve(false);
                cleanup();
            });

            document.getElementById('confirm-ok').addEventListener('click', () => {
                resolve(true);
                cleanup();
            });

            document.addEventListener('keydown', handleKeydown);
        });
    }
}

// ============================================
// INICIALIZACIÓN CUANDO EL DOM ESTÉ LISTO
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Verificar que estamos en un entorno de desarrollo
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        const warning = document.createElement('div');
        warning.className = 'bg-red-100 border-l-4 border-red-500 p-4 mb-6 rounded';
        warning.innerHTML = `
            <div class="flex">
                <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                    </svg>
                </div>
                <div class="ml-3">
                    <p class="text-sm text-red-700">
                        <strong>⚠️ ADVERTENCIA:</strong> Esta herramienta solo debe usarse en entornos de desarrollo.
                        Estás accediendo desde: <strong>${window.location.hostname}</strong>
                    </p>
                </div>
            </div>
        `;
        document.querySelector('.container').insertBefore(warning, document.querySelector('.container').firstChild);
    }

    // Inicializar la aplicación
    window.generadorDatos = new GeneradorDatosPrueba();
});

// Manejo de errores global
window.addEventListener('error', (event) => {
    console.error('Error global:', event.error);
});

// Exportar para uso global (si es necesario)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GeneradorDatosPrueba;
}