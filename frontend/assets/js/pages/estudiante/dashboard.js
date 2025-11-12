import { apiClient } from '../../core/api-client.js';

class DashboardEstudiante {
    constructor() {
        this.usuario = null;
        this.lecciones = [];
        this.datosPerfil = null;
        this.misCursos = [];
        this.estado = {
            isLoading: false,
            animacionesActivadas: false,
            cursoActual: null,
            leccionActual: null
        };
        this.init();
    }

    async init() {
        try {
            await this.cargarDatosUsuario();
            await this.cargarResumenEstudiante();
            await this.cargarLeccionesRecomendadas();
            this.renderizarDashboard();
            this.configurarEventListeners();
            this.configurarAnimacionesScroll();
        } catch (error) {
            console.error('Error inicializando dashboard:', error);
            this.mostrarError('Error al cargar el dashboard');
        }
    }

    async cargarDatosUsuario() {
        try {
            const response = await apiClient.get('/auth/perfil');
            this.usuario = response.data;
            
            // Asegurarse de que tenemos nivel e idioma
            if (!this.usuario.nivel_actual) {
                this.usuario.nivel_actual = 'principiante';
            }
            if (!this.usuario.idioma_aprendizaje) {
                this.usuario.idioma_aprendizaje = 'español';
            }
        } catch (error) {
            console.error('Error cargando datos usuario:', error);
            throw error;
        }
    }

    async cargarResumenEstudiante() {
        try {
            const response = await apiClient.get('/api/progreso/resumen');
            if (response.success) {
                this.datosPerfil = response.data;
                console.log('📊 Datos del dashboard cargados:', this.datosPerfil);
            } else {
                throw new Error('No se pudieron cargar los datos del dashboard');
            }
        } catch (error) {
            console.error('Error cargando resumen estudiante:', error);
            this.usarDatosEjemplo();
        }
    }

    async cargarLeccionesRecomendadas() {
        try {
            const response = await apiClient.get('/api/progreso/lecciones-recomendadas');
            if (response.success) {
                this.lecciones = response.data.lecciones_recomendadas || [];
                console.log('📚 Lecciones recomendadas cargadas:', this.lecciones);
            } else {
                this.lecciones = [];
            }
        } catch (error) {
            console.error('Error cargando lecciones recomendadas:', error);
            this.lecciones = [];
        }
    }

    usarDatosEjemplo() {
        // Solo usar datos de ejemplo si no hay datos reales
        if (!this.datosPerfil) {
            this.datosPerfil = {
                perfil: {
                    nombre: this.usuario?.nombre || 'Usuario',
                    primer_apellido: '',
                    nivel_actual: 'A1',
                    idioma_aprendizaje: 'Inglés',
                    total_xp: 0
                },
                estadisticas: {
                    lecciones_completadas: 0,
                    lecciones_iniciadas: 0,
                    tiempo_total_minutos: 0,
                    promedio_progreso: 0
                },
                lecciones_en_progreso: [],
                lecciones_completadas: [],
                logros_recientes: []
            };
        }
        
        if (this.lecciones.length === 0) {
            this.lecciones = [
                {
                    id: 1,
                    titulo: 'Introducción al Inglés',
                    descripcion: 'Aprende los conceptos básicos del inglés',
                    nivel: 'A1',
                    idioma: 'Inglés',
                    duracion_minutos: 30,
                    progreso_actual: 0
                },
                {
                    id: 2,
                    titulo: 'Saludos y Presentaciones',
                    descripcion: 'Aprende a saludar y presentarte en inglés',
                    nivel: 'A1',
                    idioma: 'Inglés',
                    duracion_minutos: 45,
                    progreso_actual: 0
                }
            ];
        }
        
        if (this.misCursos.length === 0) {
            this.misCursos = [{
                id: 1,
                nombre: 'Fundamentos del Inglés',
                nivel: 'A1',
                descripcion: 'Curso básico de inglés para principiantes',
                idioma: 'Inglés',
                progreso_general: 0
            }];
        }
        
        this.estado.cursoActual = this.misCursos[0];
    }

    renderizarDashboard() {
        const container = document.getElementById('lecciones-container');
        
        if (!container) {
            console.error('Contenedor de lecciones no encontrado');
            return;
        }

        container.innerHTML = this.generarHTMLCompleto();
    }

    generarHTMLCompleto() {
        const perfil = this.datosPerfil?.perfil || {};
        const estadisticas = this.datosPerfil?.estadisticas || {};
        const nombreCompleto = `${perfil.nombre || this.usuario?.nombre || 'Usuario'} ${perfil.primer_apellido || ''}`;
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(nombreCompleto)}&background=6366f1&color=fff`;

        // Calcular lecciones en progreso
        const leccionesEnProgreso = estadisticas.lecciones_iniciadas - estadisticas.lecciones_completadas;

        return `
            <!-- Header Principal -->
            <div class="mb-8">
                <h1 class="text-3xl font-bold text-gray-800 mb-2" id="greeting">
                    ¡Bienvenido, ${this.usuario?.nombre || 'Estudiante'}!
                </h1>
                <div class="flex flex-wrap gap-4 mb-6">
                    <div class="bg-blue-50 px-4 py-2 rounded-lg">
                        <span class="text-sm text-blue-600">Nivel:</span>
                        <span class="font-semibold text-blue-800 ml-2" id="nivel-actual">
                            ${perfil.nivel_actual || 'A1'}
                        </span>
                    </div>
                    <div class="bg-green-50 px-4 py-2 rounded-lg">
                        <span class="text-sm text-green-600">Idioma:</span>
                        <span class="font-semibold text-green-800 ml-2" id="idioma-aprendizaje">
                            ${perfil.idioma_aprendizaje || 'Inglés'}
                        </span>
                    </div>
                    <div class="bg-purple-50 px-4 py-2 rounded-lg">
                        <span class="text-sm text-purple-600">XP Total:</span>
                        <span class="font-semibold text-purple-800 ml-2" id="total-xp">
                            ${perfil.total_xp || 0} XP
                        </span>
                    </div>
                    <div class="bg-orange-50 px-4 py-2 rounded-lg">
                        <span class="text-sm text-orange-600">En Progreso:</span>
                        <span class="font-semibold text-orange-800 ml-2" id="lecciones-en-progreso">
                            ${leccionesEnProgreso || 0} lecciones
                        </span>
                    </div>
                </div>
            </div>

            <!-- Grid Principal -->
            <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <!-- Columna Izquierda - Estadísticas -->
                <div class="xl:col-span-1 space-y-8">
                    ${this.generarTarjetaEstadisticas(estadisticas, perfil)}
                    ${this.generarTarjetaLeaderboard(avatarUrl, perfil)}
                    ${this.generarTarjetaProgresoDiario(estadisticas)}
                </div>

                <!-- Columna Derecha - Contenido Principal -->
                <div class="xl:col-span-2 space-y-8">
                    ${this.generarTarjetaContinuarAprendizaje()}
                    ${this.generarSeccionLecciones()}
                    ${this.misCursos.length > 0 ? this.generarSeccionCursos() : ''}
                    ${this.generarLeccionesRecientes()}
                </div>
            </div>
        `;
    }

    generarTarjetaEstadisticas(estadisticas, perfil) {
        const leccionesEnProgreso = estadisticas.lecciones_iniciadas - estadisticas.lecciones_completadas;

        return `
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-6">Tu Progreso</h3>
                <div class="space-y-6">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                                <i class="fas fa-fire text-blue-600 dark:text-blue-400 text-lg"></i>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500 dark:text-gray-400">XP Total</p>
                                <p class="text-2xl font-bold text-gray-800 dark:text-white" id="total-xp">
                                    ${perfil.total_xp || 0}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                                <i class="fas fa-check-circle text-green-600 dark:text-green-400 text-lg"></i>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500 dark:text-gray-400">Lecciones Completadas</p>
                                <p class="text-2xl font-bold text-gray-800 dark:text-white" id="lecciones-completadas">
                                    ${estadisticas.lecciones_completadas || 0}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                                <i class="fas fa-play-circle text-purple-600 dark:text-purple-400 text-lg"></i>
                            </div>
                            <div>
                                <p class="text-sm text-gray-500 dark:text-gray-400">En Progreso</p>
                                <p class="text-2xl font-bold text-gray-800 dark:text-white" id="lecciones-en-progreso">
                                    ${leccionesEnProgreso || 0}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Progreso Promedio</span>
                            <span class="text-sm font-bold text-blue-600 dark:text-blue-400">
                                ${estadisticas.promedio_progreso || 0}%
                            </span>
                        </div>
                        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div class="bg-blue-500 h-2 rounded-full transition-all duration-1000" 
                                 style="width: ${estadisticas.promedio_progreso || 0}%"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    generarTarjetaLeaderboard(avatarUrl, perfil) {
        return `
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4">Tu Ranking</h3>
                <div class="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl">
                    <img src="${avatarUrl}" alt="Avatar" class="w-12 h-12 rounded-full" id="leaderboard-avatar">
                    <div class="flex-1">
                        <p class="font-semibold text-gray-800 dark:text-white">${this.usuario?.nombre || 'Estudiante'}</p>
                        <p class="text-sm text-gray-600 dark:text-gray-400" id="leaderboard-xp">
                            ${perfil.total_xp || 0} XP
                        </p>
                    </div>
                    <div class="bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1 rounded-full">
                        <span class="text-yellow-800 dark:text-yellow-200 font-bold">#1</span>
                    </div>
                </div>
            </div>
        `;
    }

    generarTarjetaProgresoDiario(estadisticas) {
        const tiempoEstudiado = estadisticas.tiempo_total_minutos || 0;
        const metaDiaria = 30; // 30 minutos de meta diaria
        const porcentajeCompletado = Math.min(100, Math.round((tiempoEstudiado / metaDiaria) * 100));

        return `
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4">Meta Diaria</h3>
                <div class="text-center">
                    <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full mb-4">
                        <span class="text-white font-bold text-lg" id="meta-diaria">
                            ${tiempoEstudiado}
                        </span>
                    </div>
                    <p class="text-gray-600 dark:text-gray-400 text-sm">minutos estudiados</p>
                </div>
                <div class="mt-4 space-y-2">
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-500 dark:text-gray-400">Completado</span>
                        <span class="font-medium text-green-600 dark:text-green-400">${porcentajeCompletado}%</span>
                    </div>
                    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div class="bg-green-500 h-2 rounded-full transition-all duration-1000" style="width: ${porcentajeCompletado}%"></div>
                    </div>
                </div>
            </div>
        `;
    }

    generarTarjetaContinuarAprendizaje() {
        // Buscar lecciones en progreso primero
        const leccionesEnProgreso = this.datosPerfil?.lecciones_en_progreso || [];
        let leccionActiva = leccionesEnProgreso[0];

        // Si no hay lecciones en progreso, usar la primera recomendada
        if (!leccionActiva && this.lecciones.length > 0) {
            leccionActiva = {
                id: this.lecciones[0].id,
                titulo: this.lecciones[0].titulo,
                descripcion: this.lecciones[0].descripcion,
                progreso: this.lecciones[0].progreso_actual || 0,
                nivel: this.lecciones[0].nivel
            };
        }

        if (!leccionActiva) return '';

        return `
            <div class="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-2xl font-bold">Continuar Aprendizaje</h2>
                    <span class="bg-white/20 px-3 py-1 rounded-full text-sm">${leccionActiva.nivel || this.usuario?.nivel_actual || 'A1'}</span>
                </div>
                
                <div class="mb-4">
                    <h3 class="text-xl font-semibold mb-2">${leccionActiva.titulo}</h3>
                    <p class="text-purple-100 mb-4">${leccionActiva.descripcion || 'Continúa tu progreso en esta lección'}</p>
                    
                    <div class="space-y-2">
                        <div class="flex justify-between text-sm">
                            <span>Progreso</span>
                            <span>${leccionActiva.progreso || 0}%</span>
                        </div>
                        <div class="w-full bg-white/20 rounded-full h-3">
                            <div class="bg-white h-3 rounded-full transition-all duration-1000" 
                                 style="width: ${leccionActiva.progreso || 0}%"></div>
                        </div>
                    </div>
                </div>
                
                <button 
                    onclick="dashboardEstudiante.iniciarLeccion(${leccionActiva.id})"
                    class="w-full bg-white text-purple-600 font-semibold py-3 rounded-lg hover:bg-purple-50 transition-colors">
                    ${leccionActiva.progreso > 0 ? 'Continuar Lección' : 'Comenzar Lección'}
                </button>
            </div>
        `;
    }

    generarSeccionLecciones() {
        return `
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-gray-800 dark:text-white">Lecciones Recomendadas</h2>
                    <span class="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm">
                        ${this.lecciones.length} disponibles
                    </span>
                </div>
                
                ${this.lecciones.length === 0 ? this.renderizarSinLecciones() : ''}
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6" id="grid-lecciones">
                    ${this.lecciones.map(leccion => this.renderizarTarjetaLeccion(leccion)).join('')}
                </div>
            </div>
        `;
    }

    generarSeccionCursos() {
        return `
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-6">Mis Cursos</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    ${this.misCursos.map(curso => this.renderizarTarjetaCurso(curso)).join('')}
                </div>
            </div>
        `;
    }

    generarLeccionesRecientes() {
        const leccionesCompletadas = this.datosPerfil?.lecciones_completadas || [];
        const leccionesRecientes = leccionesCompletadas.slice(0, 5);
        
        return `
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 class="text-xl font-bold text-gray-800 dark:text-white mb-4">Lecciones Recientes</h3>
                <div class="space-y-4">
                    ${leccionesRecientes.length > 0 ? 
                        leccionesRecientes.map((leccion, index) => this.renderizarLeccionReciente(leccion, index)).join('') :
                        '<p class="text-gray-500 text-center py-4">Aún no has completado lecciones</p>'
                    }
                </div>
            </div>
        `;
    }

    renderizarLeccionReciente(leccion, index) {
        return `
            <div class="flex items-center gap-4 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 hover:shadow-md transition-all cursor-pointer group" 
                 onclick="dashboardEstudiante.iniciarLeccion(${leccion.id})"
                 data-leccion-id="${leccion.id}">
                <div class="w-12 h-12 bg-green-100 dark:bg-green-800 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <i class="fas fa-check text-green-600 dark:text-green-400 text-lg"></i>
                </div>
                <div class="flex-1">
                    <p class="font-semibold text-gray-900 dark:text-white">${leccion.titulo}</p>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Completado - ${this.formatearFecha(leccion.fecha_completada)}</p>
                </div>
                <div class="text-right">
                    <span class="text-2xl">✅</span>
                </div>
            </div>
        `;
    }

    renderizarSinLecciones() {
        return `
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <p class="text-yellow-700 mb-4">No hay lecciones disponibles para tu nivel e idioma actual.</p>
                <p class="text-yellow-600 text-sm">Contacta con tu profesor o intenta cambiar tu nivel de aprendizaje.</p>
            </div>
        `;
    }

    renderizarTarjetaLeccion(leccion) {
        const progreso = leccion.progreso_actual || 0;
        const estaEnProgreso = progreso > 0 && progreso < 100;
        const estaCompletada = progreso >= 100;
        
        return `
            <div class="bg-white rounded-xl shadow-md border border-gray-200 p-6 transition-all duration-200 hover:shadow-lg">
                <div class="flex justify-between items-start mb-4">
                    <h3 class="text-xl font-bold text-gray-800">${leccion.titulo}</h3>
                    <div class="flex items-center gap-2">
                        ${estaCompletada ? 
                            '<span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Completada</span>' : 
                            (estaEnProgreso ? 
                                '<span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">En progreso</span>' :
                                '<span class="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">Nueva</span>'
                            )
                        }
                    </div>
                </div>
                
                <p class="text-gray-600 mb-4 text-sm">${leccion.descripcion || 'Sin descripción'}</p>
                
                <div class="space-y-3 mb-4">
                    <div class="flex justify-between text-sm text-gray-500">
                        <span>Duración: ${leccion.duracion_minutos || 'N/A'} min</span>
                        <span>Nivel: ${leccion.nivel || 'N/A'}</span>
                    </div>
                    
                    ${progreso > 0 ? `
                        <div class="space-y-1">
                            <div class="flex justify-between text-sm">
                                <span class="text-gray-600">Progreso</span>
                                <span class="font-medium text-blue-600">${progreso}%</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2">
                                <div class="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                                     style="width: ${progreso}%"></div>
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <div class="flex gap-2">
                    <button 
                        onclick="dashboardEstudiante.iniciarLeccion(${leccion.id})"
                        class="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                        ${progreso > 0 ? 'Continuar' : 'Iniciar'}
                    </button>
                </div>
            </div>
        `;
    }

    renderizarTarjetaCurso(curso) {
        return `
            <div class="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div class="flex justify-between items-start mb-4">
                    <h3 class="text-xl font-bold text-gray-800">${curso.nombre || 'Curso sin nombre'}</h3>
                    <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        ${curso.nivel || 'N/A'}
                    </span>
                </div>
                
                <p class="text-gray-600 mb-4 text-sm">${curso.descripcion || 'Sin descripción disponible'}</p>
                
                <div class="space-y-3 mb-4">
                    <div class="flex justify-between text-sm text-gray-500">
                        <span>Idioma: ${curso.idioma || 'No especificado'}</span>
                        <span>Progreso: ${curso.progreso_general || 0}%</span>
                    </div>
                    
                    <div class="space-y-1">
                        <div class="flex justify-between text-sm">
                            <span class="text-gray-600">Progreso General</span>
                            <span class="font-medium text-blue-600">${curso.progreso_general || 0}%</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                                 style="width: ${curso.progreso_general || 0}%"></div>
                        </div>
                    </div>
                </div>
                
                <button 
                    onclick="dashboardEstudiante.verCurso(${curso.id})"
                    class="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                    Ver Curso
                </button>
            </div>
        `;
    }

    formatearFecha(fecha) {
        if (!fecha) return 'Fecha no disponible';
        const date = new Date(fecha);
        const ahora = new Date();
        const diff = ahora - date;
        const dias = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (dias === 0) return 'Hoy';
        if (dias === 1) return 'Ayer';
        if (dias < 7) return `Hace ${dias} días`;
        
        return date.toLocaleDateString('es-MX', { 
            day: 'numeric', 
            month: 'short' 
        });
    }

    async iniciarLeccion(leccionId) {
        window.location.href = `/pages/estudiante/leccion-activa.html?id=${leccionId}`;
    }

    async reiniciarLeccion(leccionId) {
        if (confirm('¿Estás seguro de que quieres reiniciar esta lección? Se perderá tu progreso actual.')) {
            try {
                await apiClient.put(`/progreso/leccion/${leccionId}`, {
                    progreso: 0,
                    completada: false
                });
                window.location.reload();
            } catch (error) {
                console.error('Error reiniciando lección:', error);
                alert('Error al reiniciar la lección');
            }
        }
    }

    verCurso(cursoId) {
        window.location.href = `/pages/estudiante/curso-detalle.html?id=${cursoId}`;
    }

    configurarEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('#logout-btn')) {
                this.manejarLogout();
            }

            const leccionCard = e.target.closest('[data-leccion-id]');
            if (leccionCard) {
                const leccionId = leccionCard.dataset.leccionId;
                this.iniciarLeccion(leccionId);
            }
        });

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.usuario) {
                setTimeout(() => this.cargarResumenEstudiante(), 1000);
            }
        });
    }

    configurarAnimacionesScroll() {
        if (this.estado.animacionesActivadas) return;
        
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        document.querySelectorAll('.bg-white, .bg-gradient-to-br, .bg-gray-50').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            observer.observe(el);
        });

        this.estado.animacionesActivadas = true;
    }

    manejarLogout() {
        localStorage.removeItem('usuario');
        localStorage.removeItem('token');
        window.location.href = '/pages/auth/login.html';
    }

    mostrarError(mensaje) {
        const container = document.getElementById('lecciones-container');
        if (container) {
            container.innerHTML = `
                <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <p class="text-red-700 mb-4">${mensaje}</p>
                    <button 
                        onclick="window.location.reload()"
                        class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                        Reintentar
                    </button>
                </div>
            `;
        }
    }
}

// Inicializar dashboard
const dashboardEstudiante = new DashboardEstudiante();
window.dashboardEstudiante = dashboardEstudiante;