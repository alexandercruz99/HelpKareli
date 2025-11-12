/* ============================================
   SPEAKLEXI - Dashboard Profesor (Rediseñado)
   Archivo: assets/js/pages/profesor/dashboard.js
   ============================================ */

(async () => {
    'use strict';

    // ============================================
    // 1. ESPERAR DEPENDENCIAS
    // ============================================
    const dependencias = [
        'APP_CONFIG',
        'apiClient',
        'ModuleLoader'
    ];

    const inicializado = await window.ModuleLoader.initModule({
        moduleName: 'Dashboard Profesor',
        dependencies: dependencias,
        onReady: inicializarDashboard,
        onError: (error) => {
            console.error('💥 Error al cargar dashboard:', error);
        }
    });

    if (!inicializado) return;

    // ============================================
    // 2. FUNCIÓN PRINCIPAL
    // ============================================
    async function inicializarDashboard() {
        console.log('✅ Dashboard Profesor iniciando...');

        const API = window.APP_CONFIG.API;
        const client = window.apiClient;

        // ===================================
        // ELEMENTOS DEL DOM
        // ===================================
        const elementos = {
            // Estadísticas principales
            totalEstudiantes: document.getElementById('total-estudiantes'),
            leccionesCompletadas: document.getElementById('lecciones-completadas'),
            promedioXP: document.getElementById('promedio-xp'),
            horasTotales: document.getElementById('horas-totales'),
            
            // Gráficos
            chartNiveles: document.getElementById('chart-niveles'),
            chartIdiomas: document.getElementById('chart-idiomas'),
            chartActividad: document.getElementById('chart-actividad'),
            
            // Listas
            listaEstudiantes: document.getElementById('lista-estudiantes'),
            listaAlertas: document.getElementById('lista-alertas'),
            listaLeccionesPopulares: document.getElementById('lista-lecciones-populares'),
            
            // Filtros
            filtroNivel: document.getElementById('filtro-nivel'),
            filtroIdioma: document.getElementById('filtro-idioma'),
            btnBuscar: document.getElementById('btn-buscar'),
            inputBuscar: document.getElementById('input-buscar'),
            
            // Loading
            loadingDashboard: document.getElementById('loading-dashboard'),
            contenidoDashboard: document.getElementById('contenido-dashboard'),

            // Contenedores principales
            seccionEstadisticas: document.getElementById('seccion-estadisticas'),
            seccionAnaliticas: document.getElementById('seccion-analiticas'),
            seccionEstudiantes: document.getElementById('seccion-estudiantes')
        };

        // ===================================
        // CARGAR RESUMEN GENERAL
        // ===================================
        async function cargarResumenGeneral() {
            try {
                const response = await client.get(`${API.BASE_URL}/api/estadisticas/resumen-general`);
                const data = await response.json();
                
                console.log('📊 Resumen general:', data);

                if (!data.success) {
                    throw new Error(data.mensaje || 'Error en la respuesta del servidor');
                }

                // Actualizar estadísticas principales
                actualizarEstadisticasPrincipales(data.data.resumen);

                // Renderizar gráficos y datos
                renderizarGraficoNiveles(data.data.estudiantes_por_nivel);
                renderizarGraficoIdiomas(data.data.estudiantes_por_idioma);
                renderizarGraficoActividad(data.data.actividad_reciente);
                renderizarLeccionesPopulares(data.data.lecciones_populares);

            } catch (error) {
                console.error('Error al cargar resumen general:', error);
                mostrarError('No se pudo cargar el resumen general');
                usarDatosDemostracion();
            }
        }

        // ===================================
        // ACTUALIZAR ESTADÍSTICAS PRINCIPALES
        // ===================================
        function actualizarEstadisticasPrincipales(resumen) {
            if (elementos.totalEstudiantes) {
                elementos.totalEstudiantes.textContent = resumen.total_estudiantes;
                elementos.totalEstudiantes.parentElement.querySelector('.text-sm').textContent = 
                    `${resumen.estudiantes_con_progreso} activos`;
            }
            if (elementos.leccionesCompletadas) {
                elementos.leccionesCompletadas.textContent = resumen.total_lecciones_completadas.toLocaleString();
            }
            if (elementos.promedioXP) {
                elementos.promedioXP.textContent = `${resumen.promedio_xp} XP`;
            }
            if (elementos.horasTotales) {
                elementos.horasTotales.textContent = `${resumen.horas_totales_estudio}h`;
            }
        }

        // ===================================
        // CARGAR LISTA DE ESTUDIANTES
        // ===================================
        async function cargarListaEstudiantes(filtros = {}) {
            try {
                const params = new URLSearchParams({
                    limite: 15,
                    pagina: 1,
                    orden: 'nombre',
                    ...filtros
                });

                const response = await client.get(
                    `${API.BASE_URL}/api/estadisticas/estudiantes?${params}`
                );
                const data = await response.json();

                if (data.success) {
                    renderizarListaEstudiantes(data.data.estudiantes);
                } else {
                    throw new Error(data.mensaje);
                }

            } catch (error) {
                console.error('Error al cargar estudiantes:', error);
                renderizarListaEstudiantes([]);
            }
        }

        // ===================================
        // CARGAR ALERTAS
        // ===================================
        async function cargarAlertas() {
            try {
                const response = await client.get(`${API.BASE_URL}/api/estadisticas/estudiantes-alerta`);
                const data = await response.json();

                if (data.success) {
                    renderizarAlertas(data.data.estudiantes);
                } else {
                    throw new Error(data.mensaje);
                }

            } catch (error) {
                console.error('Error al cargar alertas:', error);
                renderizarAlertas([]);
            }
        }

        // ===================================
        // RENDERIZAR GRÁFICO DE NIVELES
        // ===================================
        function renderizarGraficoNiveles(datos) {
            if (!elementos.chartNiveles) return;

            const colores = {
                'A1': '#10B981', 'A2': '#3B82F6',
                'B1': '#F59E0B', 'B2': '#EF4444',
                'C1': '#8B5CF6', 'C2': '#EC4899'
            };

            // Ordenar por nivel
            const nivelesOrdenados = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
            const datosOrdenados = nivelesOrdenados.map(nivel => {
                const item = datos.find(d => d.nivel_actual === nivel);
                return item || { nivel_actual: nivel, cantidad: 0 };
            });

            const total = datos.reduce((sum, d) => sum + d.cantidad, 0);

            elementos.chartNiveles.innerHTML = `
                <div class="space-y-4">
                    ${datosOrdenados.map(item => {
                        const porcentaje = total > 0 ? (item.cantidad / total * 100) : 0;
                        return `
                        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div class="flex items-center space-x-3 flex-1">
                                <div class="w-3 h-3 rounded-full" style="background-color: ${colores[item.nivel_actual] || '#6B7280'}"></div>
                                <span class="font-medium text-gray-900 dark:text-white">${item.nivel_actual}</span>
                            </div>
                            <div class="text-right">
                                <div class="font-semibold text-gray-900 dark:text-white">${item.cantidad}</div>
                                <div class="text-sm text-gray-500">${porcentaje.toFixed(1)}%</div>
                            </div>
                        </div>
                    `}).join('')}
                </div>
            `;
        }

        // ===================================
        // RENDERIZAR GRÁFICO DE IDIOMAS
        // ===================================
        function renderizarGraficoIdiomas(datos) {
            if (!elementos.chartIdiomas) return;

            const total = datos.reduce((a, b) => a + b.cantidad, 0);

            elementos.chartIdiomas.innerHTML = `
                <div class="space-y-4">
                    ${datos.map(item => {
                        const porcentaje = total > 0 ? (item.cantidad / total * 100).toFixed(1) : 0;
                        return `
                            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <div class="flex items-center space-x-3 flex-1">
                                    <span class="text-2xl">${getIconoIdioma(item.idioma_aprendizaje)}</span>
                                    <div class="flex-1">
                                        <p class="font-medium text-gray-900 dark:text-white">${item.idioma_aprendizaje}</p>
                                        <div class="w-full bg-gray-200 rounded-full h-2 mt-1">
                                            <div class="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                                                 style="width: ${porcentaje}%"></div>
                                        </div>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <div class="font-semibold text-gray-900 dark:text-white">${item.cantidad}</div>
                                    <div class="text-sm text-gray-500">${porcentaje}%</div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }

        // ===================================
        // RENDERIZAR GRÁFICO DE ACTIVIDAD
        // ===================================
        function renderizarGraficoActividad(datos) {
            if (!elementos.chartActividad) return;

            if (!datos || datos.length === 0) {
                elementos.chartActividad.innerHTML = `
                    <div class="text-center py-12">
                        <div class="text-6xl mb-4">📊</div>
                        <p class="text-gray-500 dark:text-gray-400 text-lg">Sin actividad reciente</p>
                        <p class="text-sm text-gray-400 mt-2">Los datos de actividad aparecerán aquí</p>
                    </div>
                `;
                return;
            }

            // Tomar los últimos 7 días
            const ultimos7Dias = datos.slice(0, 7).reverse();
            const maxLecciones = Math.max(...ultimos7Dias.map(d => d.lecciones_completadas));

            elementos.chartActividad.innerHTML = `
                <div class="flex items-end justify-between h-64 space-x-2 px-4">
                    ${ultimos7Dias.map(item => {
                        const altura = maxLecciones > 0 ? (item.lecciones_completadas / maxLecciones * 80) : 0;
                        const esHoy = new Date(item.fecha).toDateString() === new Date().toDateString();
                        
                        return `
                            <div class="flex-1 flex flex-col items-center">
                                <div class="w-full ${esHoy ? 'bg-blue-600' : 'bg-blue-500'} rounded-t-lg hover:bg-blue-700 transition-all cursor-pointer relative group"
                                     style="height: ${altura}%"
                                     title="${item.lecciones_completadas} lecciones - ${item.estudiantes_activos} estudiantes">
                                    <div class="absolute -top-10 left-1/2 transform -translate-x-1/2 
                                                bg-gray-900 text-white text-xs px-2 py-1 rounded 
                                                opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                        <div class="font-semibold">${item.lecciones_completadas} lecciones</div>
                                        <div class="text-xs">${item.estudiantes_activos} estudiantes</div>
                                    </div>
                                </div>
                                <p class="text-xs font-medium text-gray-600 dark:text-gray-400 mt-2">
                                    ${formatearFechaCorta(item.fecha)}
                                </p>
                                <p class="text-lg font-bold text-gray-900 dark:text-white mt-1">
                                    ${item.lecciones_completadas}
                                </p>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }

        // ===================================
        // RENDERIZAR LISTA DE ESTUDIANTES
        // ===================================
        function renderizarListaEstudiantes(estudiantes) {
            if (!elementos.listaEstudiantes) return;

            if (!estudiantes || estudiantes.length === 0) {
                elementos.listaEstudiantes.innerHTML = `
                    <div class="text-center py-12">
                        <div class="text-6xl mb-4">👥</div>
                        <p class="text-gray-500 dark:text-gray-400 text-lg">No hay estudiantes para mostrar</p>
                        <p class="text-sm text-gray-400 mt-2">Ajusta los filtros o intenta de nuevo</p>
                    </div>
                `;
                return;
            }

            elementos.listaEstudiantes.innerHTML = estudiantes.map(est => `
                <div class="group hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 border-b border-gray-200 dark:border-gray-700 last:border-0">
                    <div class="flex items-center justify-between p-4 cursor-pointer" 
                         onclick="window.location.href='/pages/profesor/estadisticas-profesor.html?id=${est.id}'">
                        <div class="flex items-center space-x-4 flex-1">
                            <div class="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                                <span class="text-white font-bold text-sm">
                                    ${est.nombre.charAt(0)}${est.primer_apellido.charAt(0)}
                                </span>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center space-x-2">
                                    <h4 class="font-semibold text-gray-900 dark:text-white truncate">
                                        ${est.nombre} ${est.primer_apellido}
                                    </h4>
                                    <span class="px-2 py-1 text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 rounded-full font-medium">
                                        ${est.nivel_actual}
                                    </span>
                                </div>
                                <p class="text-sm text-gray-600 dark:text-gray-400 truncate">${est.correo}</p>
                                <div class="flex items-center space-x-4 mt-1">
                                    <span class="text-xs text-gray-500">${est.idioma_aprendizaje}</span>
                                    <span class="text-xs text-gray-500">•</span>
                                    <span class="text-xs text-gray-500">${est.lecciones_completadas}/${est.lecciones_iniciadas} lecciones</span>
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center space-x-6">
                            <div class="text-right">
                                <div class="flex items-center space-x-2">
                                    <div class="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                        <div class="bg-green-500 h-2 rounded-full transition-all duration-500" 
                                             style="width: ${est.promedio_progreso}%"></div>
                                    </div>
                                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300 w-8">${est.promedio_progreso}%</span>
                                </div>
                                <div class="text-xs text-gray-500 mt-1">Progreso</div>
                            </div>
                            <div class="text-right">
                                <div class="text-lg font-bold text-blue-600 dark:text-blue-400">${est.total_xp}</div>
                                <div class="text-xs text-gray-500">XP</div>
                            </div>
                            <div class="opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // ===================================
        // RENDERIZAR ALERTAS
        // ===================================
        function renderizarAlertas(estudiantes) {
            if (!elementos.listaAlertas) return;

            if (!estudiantes || estudiantes.length === 0) {
                elementos.listaAlertas.innerHTML = `
                    <div class="text-center py-8">
                        <div class="text-5xl mb-3">🎉</div>
                        <p class="text-gray-600 dark:text-gray-400 font-medium">
                            ¡Excelente trabajo!
                        </p>
                        <p class="text-sm text-gray-500 mt-1">
                            Todos los estudiantes están activos y progresando
                        </p>
                    </div>
                `;
                return;
            }

            elementos.listaAlertas.innerHTML = estudiantes.map(est => `
                <div class="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded-lg hover:shadow-md transition-all duration-200">
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <div class="flex items-center space-x-2 mb-2">
                                <div class="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                    <span class="text-yellow-600 font-semibold text-sm">
                                        ${est.nombre.charAt(0)}${est.primer_apellido.charAt(0)}
                                    </span>
                                </div>
                                <h4 class="font-semibold text-gray-900 dark:text-white">
                                    ${est.nombre} ${est.primer_apellido}
                                </h4>
                            </div>
                            <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                ${est.motivo_alerta}
                            </p>
                            <div class="flex items-center space-x-3 text-xs text-gray-500">
                                <span class="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">${est.nivel_actual}</span>
                                <span>•</span>
                                <span>${est.idioma_aprendizaje}</span>
                                <span>•</span>
                                <span>${est.dias_sin_actividad || 0} días sin actividad</span>
                            </div>
                        </div>
                        <a href="/pages/profesor/retroalimentacion-profesor.html?estudiante=${est.id}"
                           class="ml-4 text-sm bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors">
                            Contactar
                        </a>
                    </div>
                </div>
            `).join('');
        }

        // ===================================
        // RENDERIZAR LECCIONES POPULARES
        // ===================================
        function renderizarLeccionesPopulares(lecciones) {
            if (!elementos.listaLeccionesPopulares) return;

            if (!lecciones || lecciones.length === 0) {
                elementos.listaLeccionesPopulares.innerHTML = `
                    <div class="text-center py-8">
                        <div class="text-5xl mb-3">📚</div>
                        <p class="text-gray-600 dark:text-gray-400">
                            No hay datos de lecciones
                        </p>
                    </div>
                `;
                return;
            }

            elementos.listaLeccionesPopulares.innerHTML = lecciones.map((leccion, index) => {
                const colores = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500'];
                const color = colores[index] || 'bg-gray-500';
                
                return `
                <div class="flex items-center space-x-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 group">
                    <div class="flex-shrink-0">
                        <div class="w-10 h-10 ${color} rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg">
                            ${index + 1}
                        </div>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                            ${leccion.titulo}
                        </p>
                        <div class="flex items-center space-x-2 mt-1">
                            <span class="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                                ${leccion.nivel}
                            </span>
                            <span class="text-xs text-gray-500">•</span>
                            <span class="text-xs text-gray-500">${leccion.idioma}</span>
                        </div>
                    </div>
                    <div class="text-right flex-shrink-0">
                        <div class="text-lg font-bold text-gray-900 dark:text-white">${leccion.estudiantes}</div>
                        <div class="text-xs text-gray-500">estudiantes</div>
                    </div>
                </div>
            `}).join('');
        }

        // ===================================
        // FUNCIONES AUXILIARES
        // ===================================
        function getIconoIdioma(idioma) {
            const iconos = {
                'Inglés': '🇬🇧',
                'Francés': '🇫🇷',
                'Alemán': '🇩🇪',
                'Italiano': '🇮🇹',
                'Español': '🇪🇸',
                'Portugués': '🇵🇹',
                'Chino': '🇨🇳',
                'Japonés': '🇯🇵'
            };
            return iconos[idioma] || '🌍';
        }

        function formatearFechaCorta(fecha) {
            const date = new Date(fecha);
            const hoy = new Date();
            const ayer = new Date(hoy);
            ayer.setDate(ayer.getDate() - 1);

            if (date.toDateString() === hoy.toDateString()) return 'Hoy';
            if (date.toDateString() === ayer.toDateString()) return 'Ayer';

            return date.toLocaleDateString('es-MX', { 
                day: 'numeric', 
                month: 'short' 
            });
        }

        function mostrarError(mensaje) {
            console.error(mensaje);
            // Aquí podrías agregar notificaciones toast
        }

        function usarDatosDemostracion() {
            console.log('📊 Usando datos de demostración');
            
            const datosDemo = {
                resumen: {
                    total_estudiantes: 45,
                    estudiantes_con_progreso: 40,
                    total_lecciones_completadas: 320,
                    promedio_xp: 1250,
                    horas_totales_estudio: 245
                },
                estudiantes_por_nivel: [
                    { nivel_actual: 'A1', cantidad: 5 },
                    { nivel_actual: 'A2', cantidad: 12 },
                    { nivel_actual: 'B1', cantidad: 15 },
                    { nivel_actual: 'B2', cantidad: 10 },
                    { nivel_actual: 'C1', cantidad: 3 }
                ],
                estudiantes_por_idioma: [
                    { idioma_aprendizaje: 'Inglés', cantidad: 30 },
                    { idioma_aprendizaje: 'Francés', cantidad: 10 },
                    { idioma_aprendizaje: 'Alemán', cantidad: 5 }
                ],
                actividad_reciente: [
                    { fecha: new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0], estudiantes_activos: 12, lecciones_completadas: 15 },
                    { fecha: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0], estudiantes_activos: 15, lecciones_completadas: 18 },
                    { fecha: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0], estudiantes_activos: 8, lecciones_completadas: 10 },
                    { fecha: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0], estudiantes_activos: 18, lecciones_completadas: 22 },
                    { fecha: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0], estudiantes_activos: 22, lecciones_completadas: 25 },
                    { fecha: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0], estudiantes_activos: 10, lecciones_completadas: 12 },
                    { fecha: new Date().toISOString().split('T')[0], estudiantes_activos: 5, lecciones_completadas: 8 }
                ],
                lecciones_populares: [
                    { id: 1, titulo: 'Saludos y Presentaciones Básicas', nivel: 'A1', idioma: 'Inglés', estudiantes: 25, veces_completada: 30 },
                    { id: 2, titulo: 'Comida y Restaurantes', nivel: 'A1', idioma: 'Inglés', estudiantes: 22, veces_completada: 28 },
                    { id: 3, titulo: 'Tiempos Verbales Pasado', nivel: 'A2', idioma: 'Inglés', estudiantes: 20, veces_completada: 25 },
                    { id: 4, titulo: 'Conversación Avanzada y Debates', nivel: 'B2', idioma: 'Inglés', estudiantes: 15, veces_completada: 18 },
                    { id: 5, titulo: 'Expresiones Idiomáticas Comunes', nivel: 'C1', idioma: 'Inglés', estudiantes: 10, veces_completada: 12 }
                ]
            };

            actualizarEstadisticasPrincipales(datosDemo.resumen);
            renderizarGraficoNiveles(datosDemo.estudiantes_por_nivel);
            renderizarGraficoIdiomas(datosDemo.estudiantes_por_idioma);
            renderizarGraficoActividad(datosDemo.actividad_reciente);
            renderizarLeccionesPopulares(datosDemo.lecciones_populares);
        }

        // ===================================
        // EVENT LISTENERS
        // ===================================
        
        if (elementos.btnBuscar) {
            elementos.btnBuscar.addEventListener('click', () => {
                const filtros = {};
                
                if (elementos.filtroNivel && elementos.filtroNivel.value) {
                    filtros.nivel = elementos.filtroNivel.value;
                }
                if (elementos.filtroIdioma && elementos.filtroIdioma.value) {
                    filtros.idioma = elementos.filtroIdioma.value;
                }
                
                cargarListaEstudiantes(filtros);
            });
        }

        // ===================================
        // INICIALIZACIÓN
        // ===================================
        
        // Mostrar contenido principal
        if (elementos.loadingDashboard) {
            elementos.loadingDashboard.classList.add('hidden');
        }
        if (elementos.contenidoDashboard) {
            elementos.contenidoDashboard.classList.remove('hidden');
        }

        // Cargar datos iniciales
        await Promise.all([
            cargarResumenGeneral(),
            cargarListaEstudiantes(),
            cargarAlertas()
        ]);

        console.log('✅ Dashboard Profesor listo');
    }

})();