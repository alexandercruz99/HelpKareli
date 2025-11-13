/* ============================================
   SPEAKLEXI - PLANIFICADOR DE CONTENIDOS (PROFESOR) - VERSIÓN PRESENTACIÓN
   Archivo: assets/js/pages/profesor/planificacion.js
   VERSIÓN SEMI-REAL: Estudiantes reales + Planes simulados inteligentes
   ============================================ */

class PlanificacionProfesor {
    constructor() {
        this.API_URL = window.APP_CONFIG?.API?.API_URL || 'http://localhost:5000/api';
        this.token = localStorage.getItem('token');
        this.estado = {
            planes: [],
            estudiantes: [],
            analisis: null,
            planSeleccionado: null,
            filtroEstado: 'todos'
        };
        this.chartInstance = null;
        this.init();
    }

    async init() {
        try {
            console.log('✅ Módulo Planificación Profesor iniciando...');
            
            await this.verificarAutenticacion();
            await this.cargarDatos();
            this.configurarEventListeners();
            
            console.log('✅ Módulo Planificación Profesor listo');
        } catch (error) {
            console.error('💥 Error inicializando módulo:', error);
            this.mostrarError('Error al cargar el módulo de planificación');
        }
    }

    async verificarAutenticacion() {
        const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
        
        if (!usuario || !usuario.id) {
            window.location.href = '/pages/auth/login.html';
            throw new Error('Usuario no autenticado');
        }

        if (usuario.rol !== 'profesor' && usuario.rol !== 'admin') {
            window.location.href = '/pages/estudiante/dashboard.html';
            throw new Error('Acceso denegado: rol no autorizado');
        }

        if (!this.token) {
            window.location.href = '/pages/auth/login.html';
            throw new Error('Token no disponible');
        }
    }

    // ELEMENTOS DOM
    get elementos() {
        return {
            analisisGrupo: document.getElementById('analisis-grupo'),
            areasCriticas: document.getElementById('areas-criticas'),
            sugerencias: document.getElementById('sugerencias'),
            graficoDesempeno: document.getElementById('grafico-desempeno'),
            loadingDashboard: document.getElementById('loading-dashboard'),
            listaPlanes: document.getElementById('lista-planes'),
            estadoVacioPlanes: document.getElementById('estado-vacio-planes'),
            loadingPlanes: document.getElementById('loading-planes'),
            modalPlan: document.getElementById('modal-plan'),
            formPlan: document.getElementById('form-plan'),
            inputTitulo: document.getElementById('input-titulo'),
            textareaDescripcion: document.getElementById('textarea-descripcion'),
            selectNivel: document.getElementById('select-nivel'),
            inputFechaInicio: document.getElementById('input-fecha-inicio'),
            inputFechaFin: document.getElementById('input-fecha-fin'),
            btnGuardarPlan: document.getElementById('btn-guardar-plan'),
            btnCancelarPlan: document.getElementById('btn-cancelar-plan'),
            btnCrearPlan: document.getElementById('btn-crear-plan'),
            btnCrearPrimerPlan: document.getElementById('btn-crear-primer-plan'),
            modalConfirmacion: document.getElementById('modal-confirmacion'),
            textoConfirmacion: document.getElementById('texto-confirmacion'),
            btnConfirmarSi: document.getElementById('btn-confirmar-si'),
            btnConfirmarNo: document.getElementById('btn-confirmar-no')
        };
    }

    // ============================================
    // GENERADOR INTELIGENTE DE PLANES
    // ============================================

    generarPlanesInteligentes(estudiantes) {
        const templatesPlan = [
            {
                titulo: "Plan de Refuerzo - Conversación",
                descripcion: "Fortalecer habilidades de conversación y fluidez oral mediante práctica intensiva de diálogos cotidianos",
                areas: ['habla', 'escucha', 'vocabulario'],
                duracionDias: 30,
                estado: 'en_progreso'
            },
            {
                titulo: "Mejora de Gramática - Tiempos Verbales",
                descripcion: "Dominar el uso correcto de los tiempos verbales en presente, pasado y futuro con ejercicios prácticos",
                areas: ['gramatica', 'escritura'],
                duracionDias: 45,
                estado: 'en_progreso'
            },
            {
                titulo: "Expansión de Vocabulario Académico",
                descripcion: "Ampliar vocabulario especializado para contextos académicos y profesionales",
                areas: ['vocabulario', 'lectura', 'escritura'],
                duracionDias: 60,
                estado: 'pendiente'
            },
            {
                titulo: "Preparación para Certificación",
                descripcion: "Plan integral de preparación para examen de certificación internacional del idioma",
                areas: ['lectura', 'escritura', 'escucha', 'habla'],
                duracionDias: 90,
                estado: 'en_progreso'
            },
            {
                titulo: "Pronunciación y Acento",
                descripcion: "Mejorar pronunciación y reducir acento mediante ejercicios específicos de fonética",
                areas: ['habla', 'escucha'],
                duracionDias: 30,
                estado: 'completado'
            }
        ];

        const planes = [];
        const estudiantesConPlan = this.seleccionarAleatorio(estudiantes, Math.min(estudiantes.length, 5));

        estudiantesConPlan.forEach((estudiante, index) => {
            const template = templatesPlan[index % templatesPlan.length];
            const fechaInicio = new Date();
            fechaInicio.setDate(fechaInicio.getDate() - (Math.random() * 30));
            
            const fechaFin = new Date(fechaInicio);
            fechaFin.setDate(fechaFin.getDate() + template.duracionDias);

            planes.push({
                id: Date.now() + index,
                estudiante_id: estudiante.id,
                estudiante_nombre: `${estudiante.nombre || ''} ${estudiante.primer_apellido || ''}`.trim(),
                titulo: template.titulo,
                descripcion: template.descripcion,
                nivel: estudiante.nivel_actual || 'A1',
                areas_enfoque: template.areas,
                estado: template.estado,
                progreso: this.calcularProgresoAleatorio(template.estado),
                fecha_inicio: fechaInicio.toISOString(),
                fecha_fin_estimada: fechaFin.toISOString(),
                lecciones_sugeridas: this.generarLeccionesSugeridas(template.areas),
                objetivos: [
                    `Mejorar ${template.areas[0]} en un 30%`,
                    `Completar ${Math.floor(Math.random() * 10) + 5} ejercicios prácticos`,
                    `Practicar ${Math.floor(Math.random() * 3) + 2} veces por semana`
                ],
                creado_en: new Date(fechaInicio.getTime() - 86400000).toISOString()
            });
        });

        return planes;
    }

    generarLeccionesSugeridas(areas) {
        const lecciones = {
            'habla': ['Speaking Practice: Daily Conversations', 'Oral Presentation Skills', 'Debate and Discussion'],
            'escucha': ['Listening: Podcasts', 'Understanding Accents', 'Audio Comprehension'],
            'lectura': ['Reading Comprehension', 'Academic Texts', 'Literature Analysis'],
            'escritura': ['Essay Writing', 'Business Correspondence', 'Creative Writing'],
            'gramatica': ['Verb Tenses Review', 'Complex Sentences', 'Grammar in Context'],
            'vocabulario': ['Word Building', 'Idioms and Expressions', 'Topic Vocabulary']
        };

        const sugeridas = [];
        areas.forEach(area => {
            if (lecciones[area]) {
                sugeridas.push(...lecciones[area].slice(0, 2));
            }
        });

        return sugeridas;
    }

    calcularProgresoAleatorio(estado) {
        switch(estado) {
            case 'completado': return 100;
            case 'en_progreso': return Math.floor(Math.random() * 60) + 20; // 20-80%
            case 'pendiente': return 0;
            default: return 0;
        }
    }

    generarAnalisisInteligente(estudiantes) {
        const temasDificultad = [
            { tema: 'Present Perfect Tense', frecuencia: 12, estudiantes_afectados: 8 },
            { tema: 'Passive Voice', frecuencia: 9, estudiantes_afectados: 6 },
            { tema: 'Conditional Sentences', frecuencia: 7, estudiantes_afectados: 5 },
            { tema: 'Pronunciation /th/ sound', frecuencia: 6, estudiantes_afectados: 4 },
            { tema: 'Phrasal Verbs', frecuencia: 5, estudiantes_afectados: 4 }
        ];

        return {
            estadisticas: {
                total_estudiantes: estudiantes.length,
                estudiantes_con_plan: Math.min(estudiantes.length, 5),
                planes_activos: 3,
                planes_completados: 1,
                tasa_completacion: 75
            },
            temas_dificultad: temasDificultad,
            sugerencias: this.generarSugerencias(temasDificultad)
        };
    }

    generarSugerencias(temas) {
        return temas.slice(0, 4).map(tema => ({
            titulo: `Reforzar: ${tema.tema}`,
            descripcion: `${tema.estudiantes_afectados} estudiantes necesitan apoyo en este tema`,
            prioridad: tema.frecuencia >= 10 ? 'alta' : tema.frecuencia >= 7 ? 'media' : 'baja',
            accion: 'Crear plan de refuerzo'
        }));
    }

    seleccionarAleatorio(array, cantidad) {
        const shuffled = [...array].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, cantidad);
    }

    // ============================================
    // CARGA DE DATOS
    // ============================================

    async cargarDatos() {
        try {
            this.mostrarCargando('dashboard', true);
            this.mostrarCargando('planes', true);

            // ✅ CARGAR ESTUDIANTES REALES
            const response = await fetch(`${this.API_URL}/profesor/estudiantes`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error(`Error ${response.status}`);
            
            const result = await response.json();
            this.estado.estudiantes = result.data || [];

            console.log('✅ Estudiantes reales cargados:', this.estado.estudiantes.length);

            // ✅ GENERAR ANÁLISIS Y PLANES INTELIGENTES
            this.estado.analisis = this.generarAnalisisInteligente(this.estado.estudiantes);
            this.estado.planes = this.generarPlanesInteligentes(this.estado.estudiantes);

            console.log('✅ Planes generados:', this.estado.planes.length);

            this.renderizarDashboard();
            this.renderizarPlanes();

            this.mostrarCargando('dashboard', false);
            this.mostrarCargando('planes', false);

        } catch (error) {
            console.error('❌ Error cargando datos:', error);
            this.mostrarCargando('dashboard', false);
            this.mostrarCargando('planes', false);
            this.mostrarError('Error al cargar los datos');
        }
    }

    async crearNuevoPlan(datos) {
        // ✅ CREAR PLAN INSTANTÁNEAMENTE SIN BACKEND
        return new Promise((resolve) => {
            setTimeout(() => {
                const estudiante = this.estado.estudiantes.find(e => 
                    `${e.nombre} ${e.primer_apellido}`.toLowerCase().includes(datos.nivel.toLowerCase()) ||
                    Math.random() > 0.5
                );

                const areasArray = Array.from(document.querySelectorAll('input[name="areas_enfoque"]:checked'))
                    .map(cb => cb.value);

                const nuevoPlan = {
                    id: Date.now(),
                    estudiante_id: estudiante?.id || this.estado.estudiantes[0]?.id,
                    estudiante_nombre: estudiante ? `${estudiante.nombre} ${estudiante.primer_apellido}` : 'Estudiante',
                    titulo: datos.titulo,
                    descripcion: datos.descripcion,
                    nivel: datos.nivel,
                    areas_enfoque: areasArray,
                    estado: 'pendiente',
                    progreso: 0,
                    fecha_inicio: datos.fecha_inicio,
                    fecha_fin_estimada: datos.fecha_fin,
                    lecciones_sugeridas: this.generarLeccionesSugeridas(areasArray),
                    objetivos: [
                        `Completar plan en ${this.calcularDiasDiferencia(datos.fecha_inicio, datos.fecha_fin)} días`,
                        `Mejorar en áreas seleccionadas`,
                        `Seguimiento semanal del progreso`
                    ],
                    creado_en: new Date().toISOString()
                };

                this.estado.planes.unshift(nuevoPlan);
                resolve({ success: true, data: nuevoPlan });
            }, 800);
        });
    }

    calcularDiasDiferencia(fecha1, fecha2) {
        const d1 = new Date(fecha1);
        const d2 = new Date(fecha2);
        const diff = Math.abs(d2 - d1);
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    // ============================================
    // RENDERIZADO
    // ============================================

    renderizarDashboard() {
        this.renderizarAnalisisGrupo();
        this.renderizarAreasCriticas();
        this.renderizarSugerencias();
        this.renderizarGraficoDesempeno();
    }

    renderizarAnalisisGrupo() {
        const elementos = this.elementos;
        if (!elementos.analisisGrupo) return;

        const stats = this.estado.analisis.estadisticas;

        elementos.analisisGrupo.innerHTML = `
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl p-6 text-center border-2 border-blue-200 dark:border-blue-700 shadow-lg">
                    <div class="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                        ${stats.total_estudiantes}
                    </div>
                    <div class="text-sm font-medium text-blue-700 dark:text-blue-300">Estudiantes Totales</div>
                </div>
                <div class="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-xl p-6 text-center border-2 border-green-200 dark:border-green-700 shadow-lg">
                    <div class="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                        ${stats.estudiantes_con_plan}
                    </div>
                    <div class="text-sm font-medium text-green-700 dark:text-green-300">Con Plan Activo</div>
                </div>
                <div class="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl p-6 text-center border-2 border-purple-200 dark:border-purple-700 shadow-lg">
                    <div class="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                        ${stats.planes_activos}
                    </div>
                    <div class="text-sm font-medium text-purple-700 dark:text-purple-300">Planes en Progreso</div>
                </div>
                <div class="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 rounded-xl p-6 text-center border-2 border-orange-200 dark:border-orange-700 shadow-lg">
                    <div class="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                        ${stats.tasa_completacion}%
                    </div>
                    <div class="text-sm font-medium text-orange-700 dark:text-orange-300">Tasa Completación</div>
                </div>
            </div>
        `;
    }

    renderizarAreasCriticas() {
        const elementos = this.elementos;
        if (!elementos.areasCriticas) return;

        const temas = this.estado.analisis.temas_dificultad;

        elementos.areasCriticas.innerHTML = temas.map(tema => {
            const criticidad = tema.frecuencia >= 10 ? 'alta' : tema.frecuencia >= 7 ? 'media' : 'baja';
            const colores = {
                alta: { border: 'border-red-500', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300', badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
                media: { border: 'border-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-300', badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
                baja: { border: 'border-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-300', badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' }
            };
            const color = colores[criticidad];

            return `
                <div class="${color.bg} rounded-xl p-4 border-l-4 ${color.border} shadow-md hover:shadow-lg transition-all">
                    <div class="flex justify-between items-start mb-3">
                        <h3 class="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <i class="fas fa-exclamation-triangle ${color.text}"></i>
                            ${tema.tema}
                        </h3>
                        <span class="px-3 py-1 rounded-full text-xs font-bold ${color.badge}">
                            ${tema.estudiantes_afectados} estudiantes
                        </span>
                    </div>
                    <div class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Reportado <span class="font-semibold">${tema.frecuencia} veces</span>
                    </div>
                    <div class="bg-white dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                        <div class="h-3 ${color.border.replace('border', 'bg')} transition-all duration-500" 
                             style="width: ${Math.min(tema.frecuencia * 8, 100)}%"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderizarSugerencias() {
        const elementos = this.elementos;
        if (!elementos.sugerencias) return;

        const sugerencias = this.estado.analisis.sugerencias;

        elementos.sugerencias.innerHTML = sugerencias.map(sug => {
            const prioridadColores = {
                alta: 'border-red-500 bg-red-50 dark:bg-red-900/20',
                media: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
                baja: 'border-green-500 bg-green-50 dark:bg-green-900/20'
            };

            return `
                <div class="${prioridadColores[sug.prioridad]} border-l-4 rounded-lg p-4 shadow-md hover:shadow-lg transition-all">
                    <div class="flex items-start justify-between mb-2">
                        <h4 class="font-semibold text-gray-900 dark:text-white">
                            ${sug.titulo}
                        </h4>
                        <span class="text-xs px-2 py-1 rounded-full ${
                            sug.prioridad === 'alta' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                            sug.prioridad === 'media' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                            'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        }">
                            ${sug.prioridad.toUpperCase()}
                        </span>
                    </div>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        ${sug.descripcion}
                    </p>
                    <button onclick="planificacionProfesor.mostrarModalPlan()" 
                            class="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 font-semibold flex items-center gap-1">
                        <i class="fas fa-plus-circle"></i>
                        ${sug.accion}
                    </button>
                </div>
            `;
        }).join('');
    }

    renderizarGraficoDesempeno() {
        const elementos = this.elementos;
        if (!elementos.graficoDesempeno || !window.Chart) return;

        const ctx = elementos.graficoDesempeno.getContext('2d');
        
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        const temas = this.estado.analisis.temas_dificultad;
        
        this.chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: temas.map(t => t.tema),
                datasets: [
                    {
                        label: 'Frecuencia',
                        data: temas.map(t => t.frecuencia),
                        backgroundColor: 'rgba(59, 130, 246, 0.8)',
                        borderColor: 'rgb(59, 130, 246)',
                        borderWidth: 2,
                        borderRadius: 8
                    },
                    {
                        label: 'Estudiantes Afectados',
                        data: temas.map(t => t.estudiantes_afectados),
                        backgroundColor: 'rgba(239, 68, 68, 0.8)',
                        borderColor: 'rgb(239, 68, 68)',
                        borderWidth: 2,
                        borderRadius: 8
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            font: { size: 12, weight: 'bold' },
                            padding: 15
                        }
                    },
                    title: {
                        display: true,
                        text: 'Análisis de Áreas con Dificultad',
                        font: { size: 16, weight: 'bold' }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 14 },
                        bodyFont: { size: 13 }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            font: { size: 11 }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: { size: 11 }
                        }
                    }
                }
            }
        });
    }

    renderizarPlanes() {
        const elementos = this.elementos;
        if (!elementos.listaPlanes) return;

        if (this.estado.planes.length === 0) {
            elementos.estadoVacioPlanes.classList.remove('hidden');
            elementos.listaPlanes.innerHTML = '';
            return;
        }

        elementos.estadoVacioPlanes.classList.add('hidden');

        elementos.listaPlanes.innerHTML = this.estado.planes.map((plan, index) => {
            const esNuevo = (Date.now() - new Date(plan.creado_en).getTime()) < 10000;
            
            const estadoConfig = {
                'en_progreso': { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300', icono: 'fa-spinner fa-spin', texto: 'En Progreso' },
                'pendiente': { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-300', icono: 'fa-clock', texto: 'Pendiente' },
                'completado': { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-300', icono: 'fa-check-circle', texto: 'Completado' }
            };

            const config = estadoConfig[plan.estado] || estadoConfig.pendiente;

            return `
                <div class="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-md hover:shadow-xl transition-all p-6 ${esNuevo ? 'ring-2 ring-primary-500 animate-pulse' : ''}"
                     style="${esNuevo ? 'animation: slideIn 0.5s ease-out;' : ''}">
                    <div class="flex justify-between items-start mb-4">
                        <div class="flex-1">
                            <div class="flex items-center gap-3 mb-2">
                                <h3 class="font-bold text-xl text-gray-900 dark:text-white">
                                    ${plan.titulo}
                                </h3>
                                ${esNuevo ? '<span class="px-2 py-1 bg-red-500 text-white text-xs rounded-full animate-pulse font-bold">NUEVO</span>' : ''}
                            </div>
                            <p class="text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
                                ${plan.descripcion}
                            </p>
                            <div class="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mb-4">
                                <span class="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg">
                                    <i class="fas fa-user text-primary-600"></i>
                                    <span class="font-medium">${plan.estudiante_nombre}</span>
                                </span>
                                <span class="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg">
                                    <i class="fas fa-calendar text-green-600"></i>
                                    ${new Date(plan.fecha_inicio).toLocaleDateString()} - ${new Date(plan.fecha_fin_estimada).toLocaleDateString()}
                                </span>
                                <span class="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg">
                                    <i class="fas fa-book text-blue-600"></i>
                                    ${plan.lecciones_sugeridas.length} lecciones
                                </span>
                                <span class="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg">
                                    <i class="fas fa-layer-group text-purple-600"></i>
                                    Nivel ${plan.nivel}
                                </span>
                            </div>
                            
                            ${plan.progreso > 0 ? `
                                <div class="mb-3">
                                    <div class="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                                        <span>Progreso del plan</span>
                                        <span class="font-bold">${plan.progreso}%</span>
                                    </div>
                                    <div class="bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                                        <div class="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-500" 
                                             style="width: ${plan.progreso}%"></div>
                                    </div>
                                </div>
                            ` : ''}

                            <div class="flex flex-wrap gap-2">
                                ${plan.areas_enfoque.map(area => `
                                    <span class="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-xs font-semibold">
                                        ${area}
                                    </span>
                                `).join('')}
                            </div>
                        </div>
                        <div class="ml-4">
                            <span class="px-4 py-2 rounded-xl text-sm font-bold ${config.color} border-2 flex items-center gap-2 whitespace-nowrap">
                                <i class="fas ${config.icono}"></i>
                                ${config.texto}
                            </span>
                        </div>
                    </div>
                    
                    <div class="flex justify-between items-center pt-4 border-t-2 border-gray-200 dark:border-gray-700">
                        <p class="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <i class="fas fa-clock"></i>
                            Creado: ${new Date(plan.creado_en).toLocaleDateString('es-MX')}
                        </p>
                        <div class="flex gap-2">
                            <button class="text-primary-600 dark:text-primary-400 hover:text-primary-700 text-sm font-semibold flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
                                    onclick="planificacionProfesor.verDetalles(${plan.id})">
                                <i class="fas fa-eye"></i> Ver Detalles
                            </button>
                            <button class="text-red-600 dark:text-red-400 hover:text-red-700 text-sm font-semibold flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                    onclick="planificacionProfesor.eliminarPlan(${plan.id})">
                                <i class="fas fa-trash"></i> Eliminar
                            </button>
                        </div>
                    </div>
                </div>
                
                ${index === 0 && esNuevo ? `
                    <style>
                        @keyframes slideIn {
                            from { opacity: 0; transform: translateY(-20px); }
                            to { opacity: 1; transform: translateY(0); }
                        }
                    </style>
                ` : ''}
            `;
        }).join('');
    }

    // ============================================
    // GESTIÓN DE FORMULARIOS
    // ============================================

    async manejarEnvioFormulario(event) {
        event.preventDefault();
        
        const elementos = this.elementos;
        const formData = new FormData(elementos.formPlan);
        
        const datos = {
            titulo: formData.get('titulo'),
            descripcion: formData.get('descripcion'),
            nivel: formData.get('nivel'),
            fecha_inicio: formData.get('fecha_inicio'),
            fecha_fin: formData.get('fecha_fin')
        };

        if (!datos.titulo || !datos.descripcion || !datos.nivel) {
            this.mostrarError('Por favor completa todos los campos requeridos');
            return;
        }

        try {
            elementos.btnGuardarPlan.disabled = true;
            elementos.btnGuardarPlan.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creando...';
            
            await this.crearNuevoPlan(datos);
            
            this.mostrarExito('¡Plan creado exitosamente! 🎉');
            elementos.formPlan.reset();
            this.ocultarModalPlan();
            this.renderizarPlanes();
            
        } catch (error) {
            this.mostrarError('Error al crear el plan: ' + error.message);
        } finally {
            elementos.btnGuardarPlan.disabled = false;
            elementos.btnGuardarPlan.innerHTML = '<i class="fas fa-save mr-2"></i>Crear Plan';
        }
    }

    mostrarModalPlan() {
        const elementos = this.elementos;
        elementos.modalPlan.classList.remove('hidden');
        elementos.modalPlan.classList.add('flex');
        
        const hoy = new Date().toISOString().split('T')[0];
        if (elementos.inputFechaInicio) {
            elementos.inputFechaInicio.min = hoy;
            elementos.inputFechaInicio.value = hoy;
        }
        if (elementos.inputFechaFin) {
            const enUnMes = new Date();
            enUnMes.setMonth(enUnMes.getMonth() + 1);
            elementos.inputFechaFin.min = hoy;
            elementos.inputFechaFin.value = enUnMes.toISOString().split('T')[0];
        }
    }

    ocultarModalPlan() {
        const elementos = this.elementos;
        elementos.modalPlan.classList.add('hidden');
        elementos.modalPlan.classList.remove('flex');
        elementos.formPlan.reset();
    }

    // ============================================
    // ACCIONES DE PLANES
    // ============================================

    verDetalles(planId) {
        const plan = this.estado.planes.find(p => p.id === planId);
        if (!plan) return;

        alert(`📋 Plan: ${plan.titulo}\n\n` +
              `👤 Estudiante: ${plan.estudiante_nombre}\n` +
              `📚 Nivel: ${plan.nivel}\n` +
              `📅 Duración: ${new Date(plan.fecha_inicio).toLocaleDateString()} - ${new Date(plan.fecha_fin_estimada).toLocaleDateString()}\n` +
              `✅ Progreso: ${plan.progreso}%\n\n` +
              `Áreas de enfoque:\n${plan.areas_enfoque.map(a => `• ${a}`).join('\n')}\n\n` +
              `Lecciones sugeridas:\n${plan.lecciones_sugeridas.map(l => `• ${l}`).join('\n')}`
        );
    }

    async eliminarPlan(planId) {
        const plan = this.estado.planes.find(p => p.id === planId);
        if (!plan) return;

        const confirmado = confirm(`¿Estás seguro de eliminar el plan "${plan.titulo}"?`);
        if (!confirmado) return;

        this.estado.planes = this.estado.planes.filter(p => p.id !== planId);
        this.renderizarPlanes();
        this.mostrarExito('Plan eliminado correctamente ✅');
    }

    // ============================================
    // UTILIDADES
    // ============================================

    mostrarCargando(tipo, mostrar) {
        const elementos = this.elementos;
        const elemento = tipo === 'dashboard' ? elementos.loadingDashboard : elementos.loadingPlanes;
        if (elemento) elemento.classList.toggle('hidden', !mostrar);
    }

    mostrarExito(mensaje) {
        if (window.toastManager) {
            window.toastManager.success(mensaje);
        } else {
            alert(`✅ ${mensaje}`);
        }
    }

    mostrarError(mensaje) {
        if (window.toastManager) {
            window.toastManager.error(mensaje);
        } else {
            alert(`❌ ${mensaje}`);
        }
    }

    // ============================================
    // EVENT LISTENERS
    // ============================================

    configurarEventListeners() {
        const elementos = this.elementos;

        if (elementos.btnCrearPlan) {
            elementos.btnCrearPlan.addEventListener('click', () => this.mostrarModalPlan());
        }

        if (elementos.btnCrearPrimerPlan) {
            elementos.btnCrearPrimerPlan.addEventListener('click', () => this.mostrarModalPlan());
        }

        if (elementos.formPlan) {
            elementos.formPlan.addEventListener('submit', (e) => this.manejarEnvioFormulario(e));
        }

        if (elementos.btnCancelarPlan) {
            elementos.btnCancelarPlan.addEventListener('click', () => this.ocultarModalPlan());
        }

        if (elementos.modalPlan) {
            elementos.modalPlan.addEventListener('click', (e) => {
                if (e.target === elementos.modalPlan) this.ocultarModalPlan();
            });
        }

        if (elementos.inputFechaInicio && elementos.inputFechaFin) {
            elementos.inputFechaInicio.addEventListener('change', function() {
                elementos.inputFechaFin.min = this.value;
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !elementos.modalPlan.classList.contains('hidden')) {
                this.ocultarModalPlan();
            }
        });
    }
}

// ============================================
// INICIALIZACIÓN
// ============================================

let planificacionProfesor;

document.addEventListener('DOMContentLoaded', () => {
    planificacionProfesor = new PlanificacionProfesor();
});

window.planificacionProfesor = planificacionProfesor;