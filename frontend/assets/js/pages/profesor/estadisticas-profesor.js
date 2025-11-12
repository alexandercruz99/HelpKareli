/* ============================================
   SPEAKLEXI - ESTADÍSTICAS PROFESOR (CON DATOS REALES)
   Archivo: assets/js/pages/profesor/estadisticas-profesor.js
   UC-13: Consultar estadísticas de progreso (Vista Profesor)
   ============================================ */

(async () => {
    'use strict';

    const dependencias = ['APP_CONFIG', 'apiClient', 'toastManager', 'formValidator', 'ModuleLoader', 'Chart'];
    
    const inicializado = await window.ModuleLoader.initModule({
        moduleName: 'Estadísticas Profesor',
        dependencies: dependencias,
        onReady: inicializarModulo,
        onError: (error) => {
            console.error('Error inicializando módulo:', error);
            window.toastManager.error('Error al cargar el módulo de estadísticas');
        }
    });

    if (!inicializado) return;

    async function inicializarModulo() {
        // CONFIGURACIÓN - USANDO ENDPOINTS REALES
        const config = {
            API: window.APP_CONFIG?.API,
            ENDPOINTS: window.APP_CONFIG?.API?.ENDPOINTS?.PROFESOR || {}
        };

        // ELEMENTOS DOM
        const elementos = {
            filtroNivel: document.getElementById('filtro-nivel'),
            filtroIdioma: document.getElementById('filtro-idioma'),
            filtroFechaDesde: document.getElementById('filtro-fecha-desde'),
            filtroFechaHasta: document.getElementById('filtro-fecha-hasta'),
            btnFiltrar: document.getElementById('btn-filtrar'),
            btnExportar: document.getElementById('btn-exportar'),
            btnRecargar: document.getElementById('btn-recargar'),
            
            // Estadísticas generales
            totalAlumnos: document.getElementById('total-alumnos'),
            leccionesCompletadas: document.getElementById('lecciones-completadas'),
            xpPromedio: document.getElementById('xp-promedio'),
            tasaCompletacion: document.getElementById('tasa-completacion'),
            tiempoPromedio: document.getElementById('tiempo-promedio'),
            alumnosActivos: document.getElementById('alumnos-activos'),
            
            // Gráficos
            graficoProgresoNiveles: document.getElementById('grafico-progreso-niveles'),
            graficoDistribucionHabilidades: document.getElementById('grafico-distribucion-habilidades'),
            graficoTendenciaMensual: document.getElementById('grafico-tendencia-mensual'),
            graficoParticipacion: document.getElementById('grafico-participacion'),
            
            // Tablas
            tablaMejoresAlumnos: document.getElementById('tabla-mejores-alumnos'),
            tablaAreasCriticas: document.getElementById('tabla-areas-criticas'),
            tablaProgresoAlumnos: document.getElementById('tabla-progreso-alumnos'),
            
            // Estados
            loadingIndicator: document.getElementById('loading-indicator'),
            errorMessage: document.getElementById('error-message'),
            estadoSinDatos: document.getElementById('estado-sin-datos'),
            contenedorEstadisticas: document.getElementById('contenedor-estadisticas')
        };

        // ESTADO
        let estado = {
            estadisticas: null,
            filtros: {
                nivel: 'todos',
                idioma: 'todos',
                fecha_desde: '',
                fecha_hasta: ''
            },
            charts: {},
            datosCargados: false
        };

        // ============================================
        // FUNCIONES PRINCIPALES - CON DATOS REALES
        // ============================================

        function verificarAuth() {
            const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
            if (!usuario || (usuario.rol !== 'profesor' && usuario.rol !== 'admin')) {
                window.location.href = '/pages/auth/login.html';
                return false;
            }
            return true;
        }

        function setupEventListeners() {
            if (elementos.btnFiltrar) {
                elementos.btnFiltrar.addEventListener('click', aplicarFiltros);
            }
            
            if (elementos.btnExportar) {
                elementos.btnExportar.addEventListener('click', exportarReporte);
            }
            
            if (elementos.btnRecargar) {
                elementos.btnRecargar.addEventListener('click', recargarEstadisticas);
            }
            
            // Filtros en tiempo real
            if (elementos.filtroNivel) {
                elementos.filtroNivel.addEventListener('change', function() {
                    estado.filtros.nivel = this.value;
                });
            }
            
            if (elementos.filtroIdioma) {
                elementos.filtroIdioma.addEventListener('change', function() {
                    estado.filtros.idioma = this.value;
                });
            }
            
            if (elementos.filtroFechaDesde) {
                elementos.filtroFechaDesde.addEventListener('change', function() {
                    estado.filtros.fecha_desde = this.value;
                    if (elementos.filtroFechaHasta) {
                        elementos.filtroFechaHasta.min = this.value;
                    }
                });
            }
            
            if (elementos.filtroFechaHasta) {
                elementos.filtroFechaHasta.addEventListener('change', function() {
                    estado.filtros.fecha_hasta = this.value;
                });
            }
        }

        // ============================================
        // CARGAR ESTADÍSTICAS - CON DATOS REALES
        // ============================================

        async function cargarEstadisticas() {
            if (!verificarAuth()) return;
            
            try {
                mostrarCargando(true);
                ocultarError();
                ocultarEstadoSinDatos();

                console.log('🔄 Cargando estadísticas del profesor...');

                // ✅ CONSTRUIR PARÁMETROS PARA FILTROS
                const params = new URLSearchParams();
                
                if (estado.filtros.nivel !== 'todos') {
                    params.append('nivel', estado.filtros.nivel);
                }
                if (estado.filtros.idioma !== 'todos') {
                    params.append('idioma', estado.filtros.idioma);
                }
                if (estado.filtros.fecha_desde) {
                    params.append('fecha_desde', estado.filtros.fecha_desde);
                }
                if (estado.filtros.fecha_hasta) {
                    params.append('fecha_hasta', estado.filtros.fecha_hasta);
                }

                // ✅ USAR ENDPOINT REAL DE PROFESOR
                const endpoint = `${config.ENDPOINTS.ESTADISTICAS?.GENERAL || '/profesor/estadisticas/general'}?${params.toString()}`;
                console.log('📊 Endpoint:', endpoint);

                const resultado = await window.apiClient.get(endpoint);

                if (resultado.success) {
                    console.log('✅ Estadísticas cargadas:', resultado.data);
                    estado.estadisticas = resultado.data;
                    estado.datosCargados = true;
                    
                    renderizarEstadisticas();
                    window.toastManager.success('Estadísticas actualizadas correctamente');
                    
                } else {
                    throw new Error(resultado.error || 'Error al cargar estadísticas');
                }

            } catch (error) {
                console.error('❌ Error cargando estadísticas:', error);
                
                // Si es error 404 o sin datos, mostrar estado vacío
                if (error.message.includes('404') || error.message.includes('No hay datos')) {
                    mostrarEstadoSinDatos('No hay datos estadísticos disponibles para los filtros seleccionados.');
                } else {
                    mostrarError('Error al cargar las estadísticas. Verifica tu conexión e intenta nuevamente.');
                }
                
                window.toastManager.error('Error al cargar estadísticas');
                
            } finally {
                mostrarCargando(false);
            }
        }

        // ============================================
        // CARGAR DATOS ADICIONALES PARA GRÁFICOS
        // ============================================

        async function cargarDatosAdicionales() {
            if (!estado.estadisticas) return;

            try {
                console.log('🔄 Cargando datos adicionales...');

                // Cargar distribución de habilidades si no viene en los datos principales
                if (!estado.estadisticas.distribucion_habilidades) {
                    const resultadoHabilidades = await window.apiClient.get(
                        config.ENDPOINTS.ESTADISTICAS?.DISTRIBUCION_HABILIDADES || '/profesor/estadisticas/distribucion-habilidades'
                    );
                    
                    if (resultadoHabilidades.success) {
                        estado.estadisticas.distribucion_habilidades = resultadoHabilidades.data;
                    }
                }

                // Cargar mejores alumnos si no viene en los datos principales
                if (!estado.estadisticas.mejores_alumnos) {
                    const resultadoMejores = await window.apiClient.get(
                        config.ENDPOINTS.ESTADISTICAS?.MEJORES_ALUMNOS || '/profesor/estadisticas/mejores-alumnos'
                    );
                    
                    if (resultadoMejores.success) {
                        estado.estadisticas.mejores_alumnos = resultadoMejores.data;
                    }
                }

                // Actualizar gráficos con datos adicionales
                renderizarGraficoDistribucionHabilidades();
                renderizarTablaMejoresAlumnos();

            } catch (error) {
                console.warn('⚠️ No se pudieron cargar datos adicionales:', error);
                // No mostramos error para no interrumpir la experiencia
            }
        }

        // ============================================
        // APLICAR FILTROS Y RECARGAR
        // ============================================

        async function aplicarFiltros() {
            console.log('🎯 Aplicando filtros:', estado.filtros);
            await cargarEstadisticas();
        }

        async function recargarEstadisticas() {
            console.log('🔄 Recargando estadísticas...');
            estado.filtros = {
                nivel: 'todos',
                idioma: 'todos',
                fecha_desde: '',
                fecha_hasta: ''
            };
            
            // Resetear filtros en UI
            if (elementos.filtroNivel) elementos.filtroNivel.value = 'todos';
            if (elementos.filtroIdioma) elementos.filtroIdioma.value = 'todos';
            if (elementos.filtroFechaDesde) elementos.filtroFechaDesde.value = '';
            if (elementos.filtroFechaHasta) elementos.filtroFechaHasta.value = '';
            
            await cargarEstadisticas();
        }

        // ============================================
        // RENDERIZAR ESTADÍSTICAS - CON DATOS REALES
        // ============================================

        function renderizarEstadisticas() {
            if (!estado.estadisticas || !estado.datosCargados) {
                mostrarEstadoSinDatos('No hay datos disponibles para mostrar.');
                return;
            }

            mostrarContenedorEstadisticas();
            
            renderizarResumenGeneral();
            renderizarGraficoProgresoNiveles();
            renderizarGraficoDistribucionHabilidades();
            renderizarGraficoTendenciaMensual();
            renderizarGraficoParticipacion();
            renderizarTablaMejoresAlumnos();
            renderizarTablaAreasCriticas();
            renderizarTablaProgresoAlumnos();

            // Cargar datos adicionales en segundo plano
            setTimeout(() => {
                cargarDatosAdicionales();
            }, 500);
        }

        // ============================================
        // COMPONENTES DE RENDERIZADO
        // ============================================

        function renderizarResumenGeneral() {
            const datos = estado.estadisticas.totales || estado.estadisticas;
            
            if (elementos.totalAlumnos) {
                elementos.totalAlumnos.textContent = datos.total_alumnos || datos.alumnos_activos || 0;
            }
            
            if (elementos.leccionesCompletadas) {
                elementos.leccionesCompletadas.textContent = datos.lecciones_completadas || datos.total_lecciones || 0;
            }
            
            if (elementos.xpPromedio) {
                elementos.xpPromedio.textContent = formatearNumero(datos.xp_promedio || datos.promedio_xp || 0);
            }
            
            if (elementos.tasaCompletacion) {
                elementos.tasaCompletacion.textContent = `${datos.tasa_completacion || datos.porcentaje_completacion || 0}%`;
            }
            
            if (elementos.tiempoPromedio) {
                elementos.tiempoPromedio.textContent = `${datos.tiempo_promedio || datos.minutos_promedio || 0}m`;
            }
            
            if (elementos.alumnosActivos) {
                elementos.alumnosActivos.textContent = datos.alumnos_activos_7dias || datos.alumnos_activos || 0;
            }
        }

        function renderizarGraficoProgresoNiveles() {
            if (!elementos.graficoProgresoNiveles) return;
            
            const datos = estado.estadisticas.por_nivel || [];
            
            if (datos.length === 0) {
                elementos.graficoProgresoNiveles.innerHTML = `
                    <div class="flex items-center justify-center h-full text-gray-500">
                        <p>No hay datos de niveles disponibles</p>
                    </div>
                `;
                return;
            }

            const ctx = elementos.graficoProgresoNiveles.getContext('2d');
            
            // Destruir chart anterior si existe
            if (estado.charts.progresoNiveles) {
                estado.charts.progresoNiveles.destroy();
            }
            
            estado.charts.progresoNiveles = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: datos.map(item => `Nivel ${item.nivel}`),
                    datasets: [
                        {
                            label: 'Alumnos',
                            data: datos.map(item => item.alumnos || item.cantidad),
                            backgroundColor: 'rgba(99, 102, 241, 0.8)',
                            borderColor: 'rgb(99, 102, 241)',
                            borderWidth: 1
                        },
                        {
                            label: 'XP Promedio',
                            data: datos.map(item => item.xp_promedio || item.promedio_xp || 0),
                            backgroundColor: 'rgba(16, 185, 129, 0.8)',
                            borderColor: 'rgb(16, 185, 129)',
                            borderWidth: 1,
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Distribución de Alumnos por Nivel'
                        },
                        legend: {
                            display: true,
                            position: 'top'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Cantidad de Alumnos'
                            }
                        },
                        y1: {
                            beginAtZero: true,
                            position: 'right',
                            title: {
                                display: true,
                                text: 'XP Promedio'
                            },
                            grid: {
                                drawOnChartArea: false
                            }
                        }
                    }
                }
            });
        }

        function renderizarGraficoDistribucionHabilidades() {
            if (!elementos.graficoDistribucionHabilidades) return;
            
            const datosHabilidades = estado.estadisticas.distribucion_habilidades || estado.estadisticas.habilidades || {};
            
            if (Object.keys(datosHabilidades).length === 0) {
                elementos.graficoDistribucionHabilidades.innerHTML = `
                    <div class="flex items-center justify-center h-full text-gray-500">
                        <p>No hay datos de habilidades disponibles</p>
                    </div>
                `;
                return;
            }

            const ctx = elementos.graficoDistribucionHabilidades.getContext('2d');
            
            if (estado.charts.distribucionHabilidades) {
                estado.charts.distribucionHabilidades.destroy();
            }
            
            estado.charts.distribucionHabilidades = new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: Object.keys(datosHabilidades).map(key => 
                        key.charAt(0).toUpperCase() + key.slice(1)
                    ),
                    datasets: [{
                        label: 'Dominio Promedio (%)',
                        data: Object.values(datosHabilidades),
                        backgroundColor: 'rgba(99, 102, 241, 0.2)',
                        borderColor: 'rgb(99, 102, 241)',
                        pointBackgroundColor: 'rgb(99, 102, 241)',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: 'rgb(99, 102, 241)'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Distribución de Habilidades del Grupo'
                        },
                        legend: {
                            display: true,
                            position: 'top'
                        }
                    },
                    scales: {
                        r: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                stepSize: 20
                            }
                        }
                    }
                }
            });
        }

        function renderizarGraficoTendenciaMensual() {
            if (!elementos.graficoTendenciaMensual) return;
            
            const datos = estado.estadisticas.tendencia_mensual || estado.estadisticas.evolucion || [];
            
            if (datos.length === 0) {
                elementos.graficoTendenciaMensual.innerHTML = `
                    <div class="flex items-center justify-center h-full text-gray-500">
                        <p>No hay datos de tendencia disponibles</p>
                    </div>
                `;
                return;
            }

            const ctx = elementos.graficoTendenciaMensual.getContext('2d');
            
            if (estado.charts.tendenciaMensual) {
                estado.charts.tendenciaMensual.destroy();
            }
            
            estado.charts.tendenciaMensual = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: datos.map(item => {
                        if (item.mes) {
                            const [year, month] = item.mes.split('-');
                            return new Date(year, month - 1).toLocaleDateString('es-ES', { 
                                month: 'short', 
                                year: 'numeric' 
                            });
                        }
                        return item.periodo || 'Periodo';
                    }),
                    datasets: [
                        {
                            label: 'Alumnos Activos',
                            data: datos.map(item => item.alumnos_activos || item.alumnos_nuevos || 0),
                            borderColor: 'rgb(99, 102, 241)',
                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                            tension: 0.4,
                            fill: true
                        },
                        {
                            label: 'Lecciones Completadas',
                            data: datos.map(item => item.lecciones_completadas || 0),
                            borderColor: 'rgb(16, 185, 129)',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            tension: 0.4,
                            fill: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Evolución Mensual del Grupo'
                        },
                        legend: {
                            display: true,
                            position: 'top'
                        }
                    }
                }
            });
        }

        function renderizarGraficoParticipacion() {
            if (!elementos.graficoParticipacion) return;
            
            const datos = estado.estadisticas.participacion || estado.estadisticas.engagement || {};
            
            if (Object.keys(datos).length === 0) return;

            const ctx = elementos.graficoParticipacion.getContext('2d');
            
            if (estado.charts.participacion) {
                estado.charts.participacion.destroy();
            }
            
            estado.charts.participacion = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Alta Participación', 'Participación Media', 'Baja Participación'],
                    datasets: [{
                        data: [
                            datos.alta_participacion || 0,
                            datos.media_participacion || 0,
                            datos.baja_participacion || 0
                        ],
                        backgroundColor: [
                            'rgba(16, 185, 129, 0.8)',
                            'rgba(245, 158, 11, 0.8)',
                            'rgba(239, 68, 68, 0.8)'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Niveles de Participación'
                        },
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }

        function renderizarTablaMejoresAlumnos() {
            if (!elementos.tablaMejoresAlumnos) return;
            
            const mejoresAlumnos = estado.estadisticas.mejores_alumnos || estado.estadisticas.top_alumnos || [];
            
            if (mejoresAlumnos.length === 0) {
                elementos.tablaMejoresAlumnos.innerHTML = `
                    <tr>
                        <td colspan="6" class="px-4 py-8 text-center text-gray-500">
                            No hay datos de alumnos destacados disponibles
                        </td>
                    </tr>
                `;
                return;
            }

            let html = '';
            mejoresAlumnos.forEach((alumno, index) => {
                html += `
                    <tr class="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td class="px-4 py-3 text-center font-semibold">${index + 1}</td>
                        <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                    ${(alumno.nombre || 'U').charAt(0).toUpperCase()}
                                </div>
                                <span>${alumno.nombre || 'Alumno'}</span>
                            </div>
                        </td>
                        <td class="px-4 py-3 text-center">
                            <span class="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs rounded-full font-semibold">
                                ${alumno.nivel || 'A1'}
                            </span>
                        </td>
                        <td class="px-4 py-3 text-center font-semibold text-primary-600 dark:text-primary-400">
                            ${formatearNumero(alumno.xp || alumno.puntos || 0)}
                        </td>
                        <td class="px-4 py-3 text-center">${alumno.lecciones_completadas || alumno.lecciones || 0}</td>
                        <td class="px-4 py-3 text-center">
                            <span class="flex items-center justify-center gap-1 text-orange-600">
                                <i class="fas fa-fire text-sm"></i> 
                                ${alumno.racha_actual || alumno.racha || 0}d
                            </span>
                        </td>
                    </tr>
                `;
            });
            
            elementos.tablaMejoresAlumnos.innerHTML = html;
        }

        function renderizarTablaAreasCriticas() {
            if (!elementos.tablaAreasCriticas) return;
            
            const areasCriticas = estado.estadisticas.areas_criticas || estado.estadisticas.areas_mejora || [];
            
            if (areasCriticas.length === 0) {
                elementos.tablaAreasCriticas.innerHTML = `
                    <tr>
                        <td colspan="4" class="px-4 py-8 text-center text-gray-500">
                            No se identificaron áreas críticas en el grupo
                        </td>
                    </tr>
                `;
                return;
            }

            let html = '';
            areasCriticas.forEach(area => {
                const porcentaje = area.porcentaje_promedio || area.porcentaje || 0;
                const criticidad = area.nivel_criticidad || area.criticidad || 'media';
                
                const colorCriticidad = criticidad === 'alta' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' : 
                                      criticidad === 'media' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' : 
                                      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
                
                const textoCriticidad = criticidad === 'alta' ? 'Alta' : 
                                      criticidad === 'media' ? 'Media' : 'Baja';
                
                html += `
                    <tr class="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td class="px-4 py-3 font-medium text-gray-900 dark:text-white capitalize">
                            ${area.habilidad || area.area || 'Habilidad'}
                        </td>
                        <td class="px-4 py-3">
                            <div class="flex items-center gap-3">
                                <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 flex-1">
                                    <div class="h-2 rounded-full transition-all duration-500 ${
                                        criticidad === 'alta' ? 'bg-red-500' :
                                        criticidad === 'media' ? 'bg-yellow-500' : 'bg-green-500'
                                    }" style="width: ${porcentaje}%"></div>
                                </div>
                                <span class="text-sm font-semibold text-gray-600 dark:text-gray-400 min-w-12">
                                    ${porcentaje}%
                                </span>
                            </div>
                        </td>
                        <td class="px-4 py-3 text-center font-semibold">
                            ${area.alumnos_afectados || area.cantidad_alumnos || 0}
                        </td>
                        <td class="px-4 py-3 text-center">
                            <span class="px-3 py-1 ${colorCriticidad} text-xs rounded-full font-semibold">
                                ${textoCriticidad}
                            </span>
                        </td>
                    </tr>
                `;
            });
            
            elementos.tablaAreasCriticas.innerHTML = html;
        }

        function renderizarTablaProgresoAlumnos() {
            if (!elementos.tablaProgresoAlumnos) return;
            
            // Esta tabla podría venir de datos específicos o calcularse
            const progresoAlumnos = estado.estadisticas.progreso_alumnos || [];
            
            if (progresoAlumnos.length === 0) {
                elementos.tablaProgresoAlumnos.innerHTML = `
                    <tr>
                        <td colspan="5" class="px-4 py-8 text-center text-gray-500">
                            No hay datos de progreso individual disponibles
                        </td>
                    </tr>
                `;
                return;
            }

            let html = '';
            progresoAlumnos.forEach(alumno => {
                const progreso = alumno.progreso_general || alumno.porcentaje_completado || 0;
                
                html += `
                    <tr class="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">
                            ${alumno.nombre || 'Alumno'}
                        </td>
                        <td class="px-4 py-3 text-center">
                            <span class="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs rounded-full">
                                ${alumno.nivel || 'A1'}
                            </span>
                        </td>
                        <td class="px-4 py-3">
                            <div class="flex items-center gap-2">
                                <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                    <div class="bg-green-500 h-2 rounded-full transition-all duration-500" 
                                         style="width: ${progreso}%"></div>
                                </div>
                                <span class="text-sm font-semibold text-gray-600 dark:text-gray-400 min-w-12">
                                    ${progreso}%
                                </span>
                            </div>
                        </td>
                        <td class="px-4 py-3 text-center">${alumno.lecciones_completadas || 0}</td>
                        <td class="px-4 py-3 text-center font-semibold">${formatearNumero(alumno.xp_total || 0)}</td>
                    </tr>
                `;
            });
            
            elementos.tablaProgresoAlumnos.innerHTML = html;
        }

        // ============================================
        // EXPORTAR REPORTE - CON DATOS REALES
        // ============================================

        async function exportarReporte() {
            try {
                window.toastManager.info('Generando reporte de estadísticas...');
                
                const params = new URLSearchParams();
                if (estado.filtros.nivel !== 'todos') params.append('nivel', estado.filtros.nivel);
                if (estado.filtros.idioma !== 'todos') params.append('idioma', estado.filtros.idioma);
                if (estado.filtros.fecha_desde) params.append('fecha_desde', estado.filtros.fecha_desde);
                if (estado.filtros.fecha_hasta) params.append('fecha_hasta', estado.filtros.fecha_hasta);

                // ✅ USAR ENDPOINT REAL DE EXPORTACIÓN
                const endpoint = `${config.ENDPOINTS.ESTADISTICAS?.EXPORTAR_REPORTE || '/profesor/estadisticas/exportar'}?${params.toString()}`;
                
                const resultado = await window.apiClient.get(endpoint);
                
                if (resultado.success && resultado.data?.url) {
                    // Descargar el reporte
                    const link = document.createElement('a');
                    link.href = resultado.data.url;
                    link.setAttribute('download', `reporte-estadisticas-${new Date().getTime()}.pdf`);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    
                    window.toastManager.success('Reporte generado y descargado exitosamente');
                } else {
                    throw new Error('No se pudo generar el reporte');
                }
                
            } catch (error) {
                console.error('❌ Error exportando reporte:', error);
                window.toastManager.error('Error al generar el reporte. Intenta nuevamente.');
            }
        }

        // ============================================
        // FUNCIONES AUXILIARES
        // ============================================

        function formatearNumero(numero) {
            return new Intl.NumberFormat('es-MX').format(numero);
        }

        function mostrarCargando(mostrar) {
            if (elementos.loadingIndicator) {
                elementos.loadingIndicator.classList.toggle('hidden', !mostrar);
            }
        }

        function mostrarError(mensaje) {
            if (elementos.errorMessage) {
                elementos.errorMessage.textContent = mensaje;
                elementos.errorMessage.classList.remove('hidden');
            }
            ocultarContenedorEstadisticas();
        }

        function ocultarError() {
            if (elementos.errorMessage) {
                elementos.errorMessage.classList.add('hidden');
            }
        }

        function mostrarEstadoSinDatos(mensaje) {
            if (elementos.estadoSinDatos) {
                elementos.estadoSinDatos.innerHTML = `
                    <div class="text-center py-12">
                        <div class="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-chart-bar text-gray-400 text-2xl"></i>
                        </div>
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Sin datos disponibles</h3>
                        <p class="text-gray-600 dark:text-gray-400 mb-6">${mensaje}</p>
                        <button onclick="recargarEstadisticas()" class="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
                            <i class="fas fa-sync-alt mr-2"></i>Reintentar
                        </button>
                    </div>
                `;
                elementos.estadoSinDatos.classList.remove('hidden');
            }
            ocultarContenedorEstadisticas();
        }

        function ocultarEstadoSinDatos() {
            if (elementos.estadoSinDatos) {
                elementos.estadoSinDatos.classList.add('hidden');
            }
        }

        function mostrarContenedorEstadisticas() {
            if (elementos.contenedorEstadisticas) {
                elementos.contenedorEstadisticas.classList.remove('hidden');
            }
        }

        function ocultarContenedorEstadisticas() {
            if (elementos.contenedorEstadisticas) {
                elementos.contenedorEstadisticas.classList.add('hidden');
            }
        }

        // ============================================
        // INICIALIZACIÓN
        // ============================================

        async function inicializar() {
            if (!verificarAuth()) return;

            console.log('✅ Inicializando módulo de estadísticas profesor...');
            
            setupEventListeners();
            
            // Configurar fecha mínima en filtros
            const hoy = new Date().toISOString().split('T')[0];
            if (elementos.filtroFechaDesde) {
                elementos.filtroFechaDesde.max = hoy;
            }
            if (elementos.filtroFechaHasta) {
                elementos.filtroFechaHasta.max = hoy;
            }
            
            await cargarEstadisticas();
        }

        // Hacer funciones disponibles globalmente
        window.recargarEstadisticas = recargarEstadisticas;
        window.aplicarFiltros = aplicarFiltros;
        window.exportarReporte = exportarReporte;

        // EJECUTAR INICIALIZACIÓN
        await inicializar();
    }

    // EJECUTAR AL CARGAR EL DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializarModulo);
    } else {
        setTimeout(inicializarModulo, 100);
    }

})();