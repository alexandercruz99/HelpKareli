/* ============================================
   SPEAKLEXI - GENERADOR DE ESTUDIANTES ASIGNADOS
   Archivo: assets/js/pages/testing/generar-estudiantes-asignados.js
   Descripción: Generador de estudiantes de prueba asignados a profesores
   ============================================ */

class GeneradorEstudiantesAsignados {
    constructor() {
        this.API_URL = window.APP_CONFIG?.API?.API_URL || 'http://localhost:5000/api';
        this.token = localStorage.getItem('token');
        this.profesores = [];
        this.cursosDisponibles = [];
        this.elementos = null;
        this.init();
    }

    async init() {
        try {
            console.log('✅ Generador de Estudiantes Asignados iniciando...');
            
            this.obtenerElementosDOM();
            await this.verificarAutenticacion();
            await this.cargarProfesores();
            
            // ✅ WORKAROUND: Cargar cursos es opcional, no bloquea el sistema
            try {
                await this.cargarCursos();
            } catch (error) {
                console.warn('⚠️ No se pudieron cargar cursos, continuando sin ellos...');
                this.cursosDisponibles = []; // Array vacío para evitar errores
            }
            
            this.configurarEventos();
            
            this.log('✅ Sistema de generación inicializado correctamente', 'success');
            console.log('✅ Generador listo');
        } catch (error) {
            console.error('💥 Error inicializando:', error);
            this.log(`❌ Error inicializando: ${error.message}`, 'error');
            this.mostrarError('Error al inicializar el generador. Verifica tu conexión.');
        }
    }

    async verificarAutenticacion() {
        const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
        
        if (!usuario || !usuario.id) {
            window.location.href = '/pages/auth/login.html';
            throw new Error('Usuario no autenticado');
        }

        if (!this.token) {
            window.location.href = '/pages/auth/login.html';
            throw new Error('Token no disponible');
        }
    }

    obtenerElementosDOM() {
        this.elementos = {
            // Configuración
            selectProfesor: document.getElementById('select-profesor'),
            cantEstudiantes: document.getElementById('cant-estudiantes'),
            selectNivel: document.getElementById('select-nivel'),
            selectIdioma: document.getElementById('select-idioma'),
            chkProgreso: document.getElementById('chk-progreso'),
            xpMin: document.getElementById('xp-min'),
            xpMax: document.getElementById('xp-max'),
            
            // Botones
            btnGenerar: document.getElementById('btn-generar'),
            btnLimpiarResultados: document.getElementById('btn-limpiar-resultados'),
            btnVolverDashboard: document.getElementById('btn-volver-dashboard'),
            btnVolverTesting: document.getElementById('btn-volver-testing'),
            
            // Resultados
            panelResultados: document.getElementById('panel-resultados'),
            logResultados: document.getElementById('log-resultados'),
            statsResultados: document.getElementById('stats-resultados'),
            listaEstudiantes: document.getElementById('lista-estudiantes'),
            statGenerados: document.getElementById('stat-generados'),
            statProgreso: document.getElementById('stat-progreso'),
            statXpTotal: document.getElementById('stat-xp-total')
        };

        // Verificar elementos críticos
        const elementosCriticos = ['selectProfesor', 'btnGenerar', 'logResultados'];
        elementosCriticos.forEach(id => {
            if (!this.elementos[id]) {
                console.error(`⚠️ Elemento crítico no encontrado: ${id}`);
            }
        });
    }

    // ============================================
    // CARGA DE DATOS
    // ============================================

    async cargarProfesores() {
        try {
            this.log('🔄 Cargando lista de profesores...', 'info');
            
            const response = await fetch(`${this.API_URL}/testing/profesores`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: No se pudo cargar los profesores`);
            }

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Error en la respuesta del servidor');
            }

            this.profesores = data.profesores || [];
            
            if (this.profesores.length === 0) {
                this.elementos.selectProfesor.innerHTML = '<option value="">No hay profesores disponibles</option>';
                this.log('⚠️ No hay profesores disponibles en el sistema', 'warning');
                return;
            }

            // Llenar el select
            this.elementos.selectProfesor.innerHTML = '<option value="">Seleccionar profesor...</option>';
            
            this.profesores.forEach(prof => {
                const option = document.createElement('option');
                option.value = prof.id;
                option.textContent = `${prof.nombre} ${prof.primer_apellido} - ${prof.nivel} ${prof.idioma}`;
                option.dataset.nivel = prof.nivel;
                option.dataset.idioma = prof.idioma;
                option.dataset.cursoId = prof.curso_id;
                this.elementos.selectProfesor.appendChild(option);
            });

            this.log(`✅ ${this.profesores.length} profesores cargados correctamente`, 'success');
            
        } catch (error) {
            console.error('❌ Error cargando profesores:', error);
            this.log(`❌ Error cargando profesores: ${error.message}`, 'error');
            this.mostrarError('No se pudieron cargar los profesores. Verifica el backend.');
        }
    }

    async cargarCursos() {
        try {
            const response = await fetch(`${this.API_URL}/cursos`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                console.warn('⚠️ Endpoint /cursos no disponible, usando fallback');
                this.cursosDisponibles = [];
                return;
            }

            const data = await response.json();
            this.cursosDisponibles = data.data || [];
            
            if (this.cursosDisponibles.length > 0) {
                this.log(`✅ ${this.cursosDisponibles.length} cursos disponibles`, 'success');
            }
            
        } catch (error) {
            console.warn('⚠️ Error cargando cursos (no crítico):', error.message);
            this.cursosDisponibles = [];
            // No lanzamos el error, solo advertimos
        }
    }

    // ============================================
    // CONFIGURACIÓN DE EVENTOS
    // ============================================

    configurarEventos() {
        // Cambio de profesor actualiza nivel e idioma automáticamente
        this.elementos.selectProfesor.addEventListener('change', (e) => {
            const option = e.target.selectedOptions[0];
            if (option.value) {
                this.elementos.selectNivel.value = option.dataset.nivel || 'A1';
                this.elementos.selectIdioma.value = option.dataset.idioma || 'Inglés';
                this.log(`📋 Nivel e idioma actualizados según profesor: ${option.dataset.nivel} - ${option.dataset.idioma}`, 'info');
            }
        });

        // Generar estudiantes
        this.elementos.btnGenerar.addEventListener('click', () => {
            this.generarEstudiantes();
        });

        // Limpiar resultados
        this.elementos.btnLimpiarResultados.addEventListener('click', () => {
            this.limpiarResultados();
        });

        // Botón volver al dashboard
        this.elementos.btnVolverDashboard.addEventListener('click', () => {
            window.location.href = '/pages/profesor/profesor-dashboard.html';
        });

        // Botón volver a testing
        this.elementos.btnVolverTesting.addEventListener('click', () => {
            window.location.href = '/pages/testing/generar-datos.html';
        });

        // Validar inputs numéricos en tiempo real
        this.elementos.cantEstudiantes.addEventListener('input', (e) => {
            this.validarNumero(e.target, 1, 50);
        });

        [this.elementos.xpMin, this.elementos.xpMax].forEach(input => {
            input.addEventListener('input', (e) => {
                this.validarNumero(e.target, 0, 10000);
            });
        });

        // Validar relación XP min/max
        this.elementos.xpMin.addEventListener('change', () => {
            const min = parseInt(this.elementos.xpMin.value);
            const max = parseInt(this.elementos.xpMax.value);
            if (min > max) {
                this.elementos.xpMax.value = min;
            }
        });
    }

    validarNumero(input, min, max) {
        let valor = parseInt(input.value);
        if (isNaN(valor)) valor = min;
        if (valor < min) valor = min;
        if (valor > max) valor = max;
        input.value = valor;
    }

    // ============================================
    // GENERACIÓN DE ESTUDIANTES
    // ============================================

    async generarEstudiantes() {
        try {
            // Validar configuración
            const config = this.validarConfiguracion();
            
            this.limpiarLog();
            this.mostrarPanel(true);
            this.mostrarEstadoCarga(true);

            // Log de inicio
            this.log('', 'info');
            this.log('═══════════════════════════════════════════════', 'info');
            this.log('🚀 INICIANDO GENERACIÓN DE ESTUDIANTES', 'info');
            this.log('═══════════════════════════════════════════════', 'info');
            this.log('', 'info');
            this.log('📊 CONFIGURACIÓN:', 'info');
            this.log(`   👥 Cantidad: ${config.cantidad} estudiantes`, 'info');
            this.log(`   📚 Nivel: ${config.nivel}`, 'info');
            this.log(`   🌍 Idioma: ${config.idioma}`, 'info');
            this.log(`   💯 XP: ${config.xpMin} - ${config.xpMax}`, 'info');
            this.log(`   📈 Progreso: ${config.incluirProgreso ? 'SÍ' : 'NO'}`, 'info');
            this.log(`   👨‍🏫 Profesor ID: ${config.profesorId}`, 'info');
            this.log(`   📖 Curso ID: ${config.cursoId}`, 'info');
            this.log('', 'info');
            this.log('⏳ Procesando solicitud...', 'info');
            this.log('', 'info');

            // Hacer petición al backend
            const response = await fetch(`${this.API_URL}/testing/generar-estudiantes-asignados`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    profesor_id: config.profesorId,
                    cantidad: config.cantidad,
                    nivel: config.nivel,
                    idioma: config.idioma,
                    xp_min: config.xpMin,
                    xp_max: config.xpMax,
                    incluir_progreso: config.incluirProgreso,
                    curso_id: config.cursoId
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || `Error ${response.status}: No se pudieron generar los estudiantes`);
            }

            const resultado = await response.json();
            
            if (!resultado.success) {
                throw new Error(resultado.message || 'Error en la respuesta del servidor');
            }

            this.mostrarResultados(resultado);
            this.mostrarExito(`${resultado.total_generados} estudiantes generados exitosamente`);

        } catch (error) {
            console.error('💥 Error generando estudiantes:', error);
            this.log('', 'error');
            this.log('═══════════════════════════════════════════════', 'error');
            this.log('💥 ERROR EN LA GENERACIÓN', 'error');
            this.log('═══════════════════════════════════════════════', 'error');
            this.log(`❌ ${error.message}`, 'error');
            this.log('', 'error');
            this.mostrarError(`Error: ${error.message}`);
        } finally {
            this.mostrarEstadoCarga(false);
        }
    }

    validarConfiguracion() {
        const profesorId = this.elementos.selectProfesor.value;
        if (!profesorId) {
            throw new Error('⚠️ Debes seleccionar un profesor');
        }

        const cantidad = parseInt(this.elementos.cantEstudiantes.value);
        if (cantidad < 1 || cantidad > 50) {
            throw new Error('⚠️ La cantidad debe estar entre 1 y 50');
        }

        const xpMin = parseInt(this.elementos.xpMin.value);
        const xpMax = parseInt(this.elementos.xpMax.value);
        
        if (xpMin > xpMax) {
            throw new Error('⚠️ XP mínimo no puede ser mayor que XP máximo');
        }

        const option = this.elementos.selectProfesor.selectedOptions[0];

        return {
            profesorId: parseInt(profesorId),
            cantidad: cantidad,
            nivel: this.elementos.selectNivel.value,
            idioma: this.elementos.selectIdioma.value,
            xpMin: xpMin,
            xpMax: xpMax,
            incluirProgreso: this.elementos.chkProgreso.checked,
            cursoId: parseInt(option.dataset.cursoId)
        };
    }

    // ============================================
    // RENDERIZADO DE RESULTADOS
    // ============================================

    mostrarResultados(resultado) {
        this.log('', 'success');
        this.log('═══════════════════════════════════════════════', 'success');
        this.log('✨ ¡GENERACIÓN COMPLETADA EXITOSAMENTE!', 'success');
        this.log('═══════════════════════════════════════════════', 'success');
        this.log('', 'success');

        // Actualizar estadísticas
        this.elementos.statsResultados.classList.remove('hidden');
        this.elementos.statGenerados.textContent = resultado.total_generados || 0;
        this.elementos.statProgreso.textContent = resultado.con_progreso || 0;
        this.elementos.statXpTotal.textContent = this.formatearNumero(resultado.xp_total || 0);

        // Mostrar estudiantes generados
        if (resultado.estudiantes && resultado.estudiantes.length > 0) {
            this.log(`👨‍🎓 ESTUDIANTES GENERADOS (${resultado.estudiantes.length}):`, 'info');
            this.log('', 'info');

            // Renderizar lista visual
            this.elementos.listaEstudiantes.innerHTML = `
                <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <i class="fas fa-list text-primary-500"></i>
                    Lista Detallada de Estudiantes
                </h3>
                <div class="space-y-3">
                    ${resultado.estudiantes.map((est, index) => `
                        <div class="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                            <div class="flex items-center justify-between">
                                <div class="flex-1">
                                    <div class="flex items-center gap-3 mb-2">
                                        <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                            ${index + 1}
                                        </div>
                                        <div>
                                            <div class="font-bold text-gray-900 dark:text-white">
                                                ${est.nombre}
                                            </div>
                                            <div class="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                                <i class="fas fa-envelope text-xs"></i>
                                                ${est.email}
                                            </div>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 ml-13">
                                        <span class="flex items-center gap-1">
                                            <i class="fas fa-layer-group text-blue-500"></i>
                                            ${est.nivel}
                                        </span>
                                        <span class="flex items-center gap-1">
                                            <i class="fas fa-globe text-purple-500"></i>
                                            ${est.idioma}
                                        </span>
                                        <span class="flex items-center gap-1">
                                            <i class="fas fa-star text-yellow-500"></i>
                                            ${est.xp} XP
                                        </span>
                                    </div>
                                </div>
                                <div class="text-right">
                                    ${est.progreso_generado ? 
                                        '<span class="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-full text-xs font-semibold flex items-center gap-1"><i class="fas fa-check-circle"></i> Con progreso</span>' : 
                                        '<span class="px-3 py-1 bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded-full text-xs">Sin progreso</span>'
                                    }
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;

            // Log de cada estudiante
            resultado.estudiantes.forEach((est, index) => {
                this.log(`${index + 1}. ✅ ${est.nombre}`, 'success');
                this.log(`   📧 Email: ${est.email}`, 'info');
                this.log(`   📊 Nivel: ${est.nivel} | Idioma: ${est.idioma} | XP: ${est.xp}`, 'info');
                this.log(`   ${est.progreso_generado ? '✅ Con progreso generado' : '⚪ Sin progreso'}`, est.progreso_generado ? 'success' : 'info');
                this.log('', 'info');
            });
        }

        // Información de credenciales
        this.log('═══════════════════════════════════════════════', 'warning');
        this.log('🔑 CREDENCIALES DE ACCESO', 'warning');
        this.log('═══════════════════════════════════════════════', 'warning');
        this.log('📧 Email: [nombre]@test.speaklexi.com', 'info');
        this.log('🔐 Password: Test123!', 'warning');
        this.log('', 'info');
        this.log('💡 NOTA: Los estudiantes ya están asignados al profesor seleccionado', 'success');
        this.log('═══════════════════════════════════════════════', 'info');

        this.elementos.btnLimpiarResultados.classList.remove('hidden');
    }

    // ============================================
    // FUNCIONES DE UI
    // ============================================

    mostrarPanel(mostrar) {
        if (mostrar) {
            this.elementos.panelResultados.classList.remove('hidden');
            // Scroll suave al panel de resultados
            setTimeout(() => {
                this.elementos.panelResultados.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        } else {
            this.elementos.panelResultados.classList.add('hidden');
        }
    }

    mostrarEstadoCarga(cargando) {
        if (cargando) {
            this.elementos.btnGenerar.disabled = true;
            this.elementos.btnGenerar.innerHTML = `
                <svg class="animate-spin h-6 w-6 mr-2" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span class="text-lg">Generando estudiantes...</span>
            `;
        } else {
            this.elementos.btnGenerar.disabled = false;
            this.elementos.btnGenerar.innerHTML = `
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                </svg>
                <span class="text-lg">Generar Estudiantes</span>
            `;
        }
    }

    log(mensaje, tipo = 'info') {
        const colores = {
            info: 'text-cyan-400',
            success: 'text-green-400',
            error: 'text-red-400',
            warning: 'text-yellow-400'
        };

        const linea = document.createElement('div');
        linea.className = `py-0.5 ${colores[tipo]} font-mono text-sm`;
        linea.textContent = mensaje;
        
        this.elementos.logResultados.appendChild(linea);
        this.elementos.logResultados.scrollTop = this.elementos.logResultados.scrollHeight;
    }

    limpiarLog() {
        this.elementos.logResultados.innerHTML = '';
    }

    limpiarResultados() {
        this.limpiarLog();
        this.elementos.statsResultados.classList.add('hidden');
        this.elementos.listaEstudiantes.innerHTML = '';
        this.elementos.btnLimpiarResultados.classList.add('hidden');
        this.elementos.panelResultados.classList.add('hidden');
        this.mostrarInfo('Resultados limpiados');
    }

    // ============================================
    // UTILIDADES
    // ============================================

    formatearNumero(numero) {
        return new Intl.NumberFormat('es-MX').format(numero);
    }

    mostrarExito(mensaje) {
        if (window.toastManager) {
            window.toastManager.success(mensaje);
        } else {
            console.log(`✅ ${mensaje}`);
        }
    }

    mostrarError(mensaje) {
        if (window.toastManager) {
            window.toastManager.error(mensaje);
        } else {
            alert(`❌ ${mensaje}`);
        }
    }

    mostrarInfo(mensaje) {
        if (window.toastManager) {
            window.toastManager.info(mensaje);
        } else {
            console.log(`ℹ️ ${mensaje}`);
        }
    }
}

// ============================================
// INICIALIZACIÓN GLOBAL
// ============================================

let generadorEstudiantes;

document.addEventListener('DOMContentLoaded', () => {
    generadorEstudiantes = new GeneradorEstudiantesAsignados();
});

// Hacer disponible globalmente
window.generadorEstudiantes = generadorEstudiantes;