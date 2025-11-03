/* ============================================
   SPEAKLEXI - DASHBOARD ADMIN CORREGIDO
   Archivo: assets/js/pages/admin/dashboard.js
   ============================================ */

(() => {
    'use strict';

    // ============================================
    // 1. CONFIGURACIÓN Y VARIABLES GLOBALES
    // ============================================
    let activityChart, languageChart;
    let dashboardData = {
        stats: {},
        recentUsers: [],
        systemMetrics: {},
        activityLogs: []
    };

    // ============================================
    // 2. FUNCIONES PRINCIPALES CORREGIDAS
    // ============================================

    /**
     * Inicializa el dashboard con verificación de dependencias
     */
    function init() {
        // Esperar a que las dependencias estén cargadas
        if (!checkDependencies()) {
            console.log('⏳ Esperando dependencias...');
            setTimeout(init, 100);
            return;
        }

        console.log('✅ Dashboard Admin inicializado correctamente');
        
        setupEventListeners();
        verificarPermisos();
        cargarDashboardData();
        inicializarTheme();
    }

    /**
     * Verifica que todas las dependencias estén cargadas
     */
    function checkDependencies() {
        const required = [
            'APP_CONFIG',
            'apiClient', 
            'Utils',
            'themeManager',
            'toastManager'
        ];

        for (const dep of required) {
            if (!window[dep]) {
                console.warn(`⚠️ ${dep} no está disponible aún`);
                return false;
            }
        }
        return true;
    }

    /**
     * Inicializa el sistema de temas
     */
    function inicializarTheme() {
        if (window.themeManager) {
            window.themeManager.init();
            console.log('🎨 Theme Manager inicializado');
        }
    }

    /**
     * Verifica permisos de administrador
     */
    function verificarPermisos() {
        try {
            const usuario = Utils.getFromStorage('usuario');
            
            if (!usuario) {
                window.location.href = '../auth/login.html';
                return false;
            }
            
            const rol = usuario.rol || 'alumno';
            
            if (!['admin', 'administrador'].includes(rol)) {
                mostrarErrorPermisos();
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Error verificando permisos:', error);
            window.location.href = '../auth/login.html';
            return false;
        }
    }

    function mostrarErrorPermisos() {
        if (window.toastManager) {
            window.toastManager.error('No tienes permisos para acceder al panel de administración');
        }
        setTimeout(() => {
            window.location.href = APP_CONFIG.ROLES.RUTAS_DASHBOARD.alumno;
        }, 3000);
    }

    /**
     * Configura todos los event listeners
     */
    function setupEventListeners() {
        // Botones de gestión de contenido
        document.querySelectorAll('button').forEach(btn => {
            if (btn.textContent.includes('Crear Nueva Lección')) {
                btn.addEventListener('click', () => {
                    window.location.href = 'gestion-lecciones.html?accion=crear';
                });
            }
            
            if (btn.textContent.includes('Editar Lecciones')) {
                btn.addEventListener('click', () => {
                    window.location.href = 'gestion-lecciones.html';
                });
            }
            
            if (btn.textContent.includes('Agregar Multimedia')) {
                btn.addEventListener('click', () => {
                    window.location.href = 'gestion-multimedia.html';
                });
            }
            
            if (btn.textContent.includes('Agregar Usuario')) {
                btn.addEventListener('click', () => {
                    window.location.href = 'gestion-usuarios.html?accion=crear';
                });
            }
            
            if (btn.textContent.includes('Ver Usuarios')) {
                btn.addEventListener('click', () => {
                    window.location.href = 'gestion-usuarios.html';
                });
            }
        });

        // Filtros de gráficos
        const filterButtons = document.querySelectorAll('#activity-chart').parentElement.querySelectorAll('button');
        if (filterButtons.length > 0) {
            filterButtons.forEach((btn, index) => {
                btn.addEventListener('click', function() {
                    // Remover clase activa de todos los botones
                    this.parentElement.querySelectorAll('button').forEach(b => {
                        b.classList.remove('bg-purple-100', 'dark:bg-purple-900/30', 'text-purple-600', 'dark:text-purple-400');
                        b.classList.add('bg-gray-100', 'dark:bg-gray-700', 'text-gray-600', 'dark:text-gray-400');
                    });
                    
                    // Agregar clase activa al botón clickeado
                    this.classList.remove('bg-gray-100', 'dark:bg-gray-700', 'text-gray-600', 'dark:text-gray-400');
                    this.classList.add('bg-purple-100', 'dark:bg-purple-900/30', 'text-purple-600', 'dark:text-purple-400');
                    
                    // Actualizar gráfico
                    actualizarGraficoActividad(index === 0 ? '7d' : '30d');
                });
            });
        }

        // Botones de acciones rápidas
        document.querySelectorAll('.flex-col.items-center').forEach(btn => {
            btn.addEventListener('click', function() {
                const action = this.querySelector('span').textContent;
                manejarAccionRapida(action);
            });
        });
    }

    /**
     * Carga los datos del dashboard
     */
    async function cargarDashboardData() {
        try {
            mostrarLoading(true);

            // Simular carga de datos
            await simularCargaDatos();
            
            inicializarGraficos();
            actualizarUI();

            if (window.toastManager) {
                window.toastManager.success('Dashboard cargado correctamente');
            }

        } catch (error) {
            manejarError('Error al cargar datos del dashboard', error);
        } finally {
            mostrarLoading(false);
        }
    }

    /**
     * Simula la carga de datos (para demo)
     */
    async function simularCargaDatos() {
        return new Promise(resolve => {
            setTimeout(() => {
                dashboardData = {
                    stats: {
                        totalUsuarios: 1247,
                        leccionesActivas: 156,
                        totalProfesores: 28,
                        actividadHoy: 342
                    },
                    recentUsers: [
                        {
                            nombre: 'Ana López',
                            email: 'ana@email.com',
                            rol: 'Estudiante',
                            estado: 'Activo',
                            fecha: 'Hoy',
                            avatar: 'https://ui-avatars.com/api/?name=Ana+Lopez&background=6366f1&color=fff'
                        },
                        {
                            nombre: 'Carlos Ruiz',
                            email: 'carlos@email.com',
                            rol: 'Profesor',
                            estado: 'Activo',
                            fecha: 'Ayer',
                            avatar: 'https://ui-avatars.com/api/?name=Carlos+Ruiz&background=10b981&color=fff'
                        },
                        {
                            nombre: 'María García',
                            email: 'maria@email.com',
                            rol: 'Estudiante',
                            estado: 'Pendiente',
                            fecha: '15/10/2025',
                            avatar: 'https://ui-avatars.com/api/?name=Maria+Garcia&background=f59e0b&color=fff'
                        }
                    ],
                    systemMetrics: {
                        cpu: 42,
                        memoria: 68,
                        almacenamiento: 35,
                        uptime: 99.9
                    },
                    activityLogs: [
                        {
                            tipo: 'registro',
                            mensaje: 'Ana López se unió hace 2 horas',
                            timestamp: new Date(),
                            icon: 'user-plus',
                            color: 'blue'
                        },
                        {
                            tipo: 'leccion_completada',
                            mensaje: 'Carlos Ruiz completó "Vocabulario Básico"',
                            timestamp: new Date(Date.now() - 3600000),
                            icon: 'book',
                            color: 'green'
                        },
                        {
                            tipo: 'nivel_alcanzado',
                            mensaje: 'María García alcanzó el nivel B1',
                            timestamp: new Date(Date.now() - 7200000),
                            icon: 'chart-line',
                            color: 'purple'
                        }
                    ]
                };
                resolve();
            }, 1500);
        });
    }

    /**
     * Inicializa los gráficos con ApexCharts
     */
    function inicializarGraficos() {
        // Gráfico de Actividad
        const activityOptions = {
            series: [{
                name: 'Usuarios Activos',
                data: [30, 40, 35, 50, 49, 60, 70, 91, 125, 85, 95, 110]
            }],
            chart: {
                height: 350,
                type: 'line',
                zoom: { enabled: false },
                toolbar: { show: false },
                fontFamily: 'Inter, system-ui, sans-serif'
            },
            colors: ['#6366f1'],
            dataLabels: { enabled: false },
            stroke: {
                curve: 'smooth',
                width: 3
            },
            grid: {
                borderColor: '#e7e7e7',
                row: {
                    colors: ['#f3f3f3', 'transparent'],
                    opacity: 0.5
                }
            },
            markers: { size: 4 },
            xaxis: {
                categories: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
            },
            yaxis: {
                title: { text: 'Usuarios Activos' }
            }
        };

        if (document.querySelector("#activity-chart")) {
            activityChart = new ApexCharts(document.querySelector("#activity-chart"), activityOptions);
            activityChart.render();
        }

        // Gráfico de Idiomas
        const languageOptions = {
            series: [44, 55, 41, 17, 15],
            labels: ['Inglés', 'Francés', 'Portugués', 'Alemán', 'Italiano'],
            chart: {
                type: 'donut',
                height: 350
            },
            colors: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
            responsive: [{
                breakpoint: 480,
                options: {
                    chart: { width: 200 },
                    legend: { position: 'bottom' }
                }
            }],
            legend: { position: 'bottom' }
        };

        if (document.querySelector("#language-chart")) {
            languageChart = new ApexCharts(document.querySelector("#language-chart"), languageOptions);
            languageChart.render();
        }
    }

    /**
     * Actualiza el gráfico de actividad
     */
    function actualizarGraficoActividad(periodo) {
        if (window.toastManager) {
            window.toastManager.info(`Mostrando datos de los últimos ${periodo === '7d' ? '7 días' : '30 días'}`);
        }
        
        // En una implementación real, aquí se actualizarían los datos del gráfico
        console.log(`Actualizando gráfico para período: ${periodo}`);
    }

    /**
     * Maneja acciones rápidas del dashboard
     */
    function manejarAccionRapida(accion) {
        const acciones = {
            'Reporte': () => generarReporte(),
            'Ajustes': () => abrirAjustes(),
            'Equipo': () => verEquipo(),
            'Ayuda': () => mostrarAyuda()
        };

        if (acciones[accion]) {
            acciones[accion]();
        } else {
            console.log(`Acción no implementada: ${accion}`);
        }
    }

    function generarReporte() {
        if (window.toastManager) {
            window.toastManager.info('Generando reporte...');
        }
        // Lógica para generar reporte
    }

    function abrirAjustes() {
        window.location.href = 'configuracion.html';
    }

    function verEquipo() {
        window.location.href = 'gestion-usuarios.html?rol=profesor';
    }

    function mostrarAyuda() {
        if (window.toastManager) {
            window.toastManager.info('Abriendo centro de ayuda...');
        }
    }

    /**
     * Actualiza la UI con los datos cargados
     */
    function actualizarUI() {
        // Actualizar stats cards
        const statCards = document.querySelectorAll('.bg-white, .dark\\:bg-gray-800');
        const stats = Object.values(dashboardData.stats);
        
        statCards.forEach((card, index) => {
            const statValue = card.querySelector('p.text-3xl');
            if (statValue && stats[index]) {
                statValue.textContent = stats[index].toLocaleString();
            }
        });

        // Actualizar métricas del sistema
        const metrics = dashboardData.systemMetrics;
        const progressBars = document.querySelectorAll('.bg-gray-200, .dark\\:bg-gray-700');
        const values = [metrics.cpu, metrics.memoria, metrics.almacenamiento, metrics.uptime];
        
        progressBars.forEach((bar, index) => {
            const progress = bar.querySelector('.bg-green-500, .bg-blue-500, .bg-purple-500');
            if (progress && values[index] !== undefined) {
                progress.style.width = `${values[index]}%`;
                
                // Actualizar texto del porcentaje
                const percentageText = bar.previousElementSibling?.querySelector('span:last-child');
                if (percentageText) {
                    percentageText.textContent = `${values[index]}%`;
                }
            }
        });
    }

    // ============================================
    // 3. FUNCIONES DE UTILIDAD
    // ============================================

    function mostrarLoading(mostrar) {
        // Implementar skeleton loader si es necesario
        if (mostrar) {
            document.body.style.cursor = 'wait';
        } else {
            document.body.style.cursor = 'default';
        }
    }

    function manejarError(mensaje, error) {
        console.error('💥 Error en Dashboard:', error);
        
        if (window.toastManager) {
            window.toastManager.error(mensaje);
        }
        
        if (APP_CONFIG.ENV.DEBUG) {
            console.trace();
        }
    }

    // ============================================
    // 4. INICIALIZACIÓN MEJORADA
    // ============================================
    
    // Esperar a que el DOM esté completamente listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // Si el DOM ya está listo, inicializar con un pequeño delay
        setTimeout(init, 100);
    }

})();