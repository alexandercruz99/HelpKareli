/* ============================================
   SPEAKLEXI - GESTIÓN DE RETROALIMENTACIÓN (PROFESOR) - VERSIÓN PRESENTACIÓN
   Archivo: assets/js/pages/profesor/retroalimentacion-profesor.js
   VERSIÓN SEMI-REAL: Estudiantes reales + Retroalimentación simulada inteligente
   ============================================ */

class RetroalimentacionProfesor {
    constructor() {
        this.API_URL = window.APP_CONFIG?.API?.API_URL || 'http://localhost:5000/api';
        this.token = localStorage.getItem('token');
        this.estado = {
            estudiantes: [],
            estudianteSeleccionado: null,
            retroalimentaciones: [],
            filtroBusqueda: ''
        };
        this.init();
    }

    async init() {
        try {
            console.log('✅ Módulo Retroalimentación Profesor iniciando...');
            
            // Verificar autenticación y rol
            await this.verificarAutenticacion();
            
            // Cargar datos iniciales
            await this.cargarEstudiantes();
            this.configurarEventListeners();
            
            console.log('✅ Módulo Retroalimentación Profesor listo');
        } catch (error) {
            console.error('💥 Error inicializando módulo:', error);
            this.mostrarError('Error al cargar el módulo de retroalimentación');
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
            // Panel lateral
            listaAlumnos: document.getElementById('lista-alumnos'),
            buscadorAlumnos: document.getElementById('buscador-alumnos'),
            loadingAlumnos: document.getElementById('loading-alumnos'),
            
            // Panel principal
            alumnoSeleccionadoNombre: document.getElementById('alumno-seleccionado-nombre'),
            alumnoSeleccionadoNivel: document.getElementById('alumno-seleccionado-nivel'),
            listaRetroalimentacionAlumno: document.getElementById('lista-retroalimentacion-alumno'),
            estadoVacioAlumno: document.getElementById('estado-vacio-alumno'),
            loadingRetroalimentacion: document.getElementById('loading-retroalimentacion'),
            
            // Modal crear
            modalCrear: document.getElementById('modal-crear'),
            formCrearComentario: document.getElementById('form-crear-comentario'),
            selectAlumnoModal: document.getElementById('select-alumno-modal'),
            selectLeccionModal: document.getElementById('select-leccion-modal'),
            textareaComentario: document.getElementById('textarea-comentario'),
            inputCalificacion: document.getElementById('input-calificacion'),
            selectTipo: document.getElementById('select-tipo'),
            btnEnviarComentario: document.getElementById('btn-enviar-comentario'),
            btnCancelarCrear: document.getElementById('btn-cancelar-crear'),
            
            // Botones
            btnNuevoComentario: document.getElementById('btn-nuevo-comentario'),
            btnNuevoPrimerComentario: document.getElementById('btn-nuevo-primer-comentario')
        };
    }

    // ============================================
    // GENERADOR INTELIGENTE DE RETROALIMENTACIÓN
    // ============================================

    generarRetroalimentacionInteligente(estudiante) {
        const templates = {
            felicitacion: [
                {
                    asunto: "¡Excelente progreso en gramática!",
                    mensaje: `Hola ${estudiante.nombre},\n\n¡Felicidades por tu excelente desempeño en los ejercicios de gramática! Has demostrado una gran comprensión de las estructuras verbales y tu precisión ha mejorado notablemente.\n\nSigue así, tu dedicación se nota en cada lección completada. 👏`,
                    leccion: "Present Simple Tense"
                },
                {
                    asunto: "Sobresaliente participación en clase",
                    mensaje: `${estudiante.nombre},\n\nQuiero destacar tu participación activa en las últimas sesiones. Tu pronunciación ha mejorado considerablemente y se nota que practicas fuera de clase.\n\nContinúa con ese entusiasmo, ¡vas por muy buen camino! 🌟`,
                    leccion: "Speaking: Introductions"
                },
                {
                    asunto: "Gran avance en vocabulario",
                    mensaje: `Estimado/a ${estudiante.nombre},\n\nHe notado un progreso significativo en tu vocabulario. Las palabras nuevas que has aprendido las estás aplicando correctamente en contextos reales.\n\n¡Sigue ampliando tu vocabulario de esta manera! 📚`,
                    leccion: "Vocabulary: Daily Routine"
                }
            ],
            mejora: [
                {
                    asunto: "Oportunidad de mejora en pronunciación",
                    mensaje: `Hola ${estudiante.nombre},\n\nHe observado que puedes mejorar tu pronunciación en algunos sonidos específicos. Te recomiendo practicar más los ejercicios de listening y repetir en voz alta.\n\nRecuerda que la práctica constante es clave. ¡Estoy aquí para ayudarte! 🎯`,
                    leccion: "Listening: Basic Conversations"
                },
                {
                    asunto: "Reforzar tiempos verbales",
                    mensaje: `${estudiante.nombre},\n\nNecesitamos trabajar un poco más en los tiempos verbales, especialmente en el uso del presente perfecto. Te sugiero revisar los ejemplos de la lección y hacer ejercicios adicionales.\n\n¿Podemos agendar una sesión de refuerzo? 📖`,
                    leccion: "Present Perfect Tense"
                },
                {
                    asunto: "Aumentar participación en conversaciones",
                    mensaje: `Hola ${estudiante.nombre},\n\nMe gustaría verte participar más en las conversaciones de clase. Sé que dominas el contenido, solo necesitas más confianza para expresarte.\n\nIntenta responder primero en las próximas clases. ¡Confío en ti! 💪`,
                    leccion: "Conversación Avanzada"
                }
            ],
            general: [
                {
                    asunto: "Resumen de tu progreso semanal",
                    mensaje: `${estudiante.nombre},\n\nQuiero compartir contigo un resumen de tu progreso esta semana:\n\n✅ Has completado ${estudiante.lecciones_completadas} lecciones\n✅ Has acumulado ${estudiante.total_xp} puntos de experiencia\n✅ Tu nivel actual es ${estudiante.nivel_actual}\n\nSigue trabajando con esta dedicación. ¡Vas muy bien! 🚀`,
                    leccion: null
                },
                {
                    asunto: "Recordatorio de práctica constante",
                    mensaje: `Hola ${estudiante.nombre},\n\nRecuerda que la práctica diaria, aunque sea solo 15 minutos, hace una gran diferencia en tu aprendizaje.\n\nTe animo a mantener tu racha de estudio. ¡La consistencia es la clave del éxito! ⏰`,
                    leccion: null
                },
                {
                    asunto: "Sugerencias personalizadas de estudio",
                    mensaje: `${estudiante.nombre},\n\nBasándome en tu progreso, te recomiendo enfocarte en:\n\n1. Práctica de conversación oral\n2. Ejercicios de comprensión auditiva\n3. Escritura de textos cortos\n\nEstas áreas complementarán muy bien lo que ya dominas. 📝`,
                    leccion: null
                }
            ]
        };

        // Seleccionar retroalimentaciones basadas en el rendimiento del estudiante
        const retroalimentaciones = [];
        const xp = estudiante.total_xp || 0;
        const lecciones = estudiante.lecciones_completadas || 0;
        
        // Si tiene buen XP, agregar felicitaciones
        if (xp > 500) {
            const felicitaciones = this.seleccionarAleatorio(templates.felicitacion, 2);
            retroalimentaciones.push(...felicitaciones.map(f => ({
                ...f,
                tipo: 'felicitacion'
            })));
        }
        
        // Si tiene progreso medio, agregar sugerencias de mejora
        if (xp > 200 && xp < 800) {
            const mejoras = this.seleccionarAleatorio(templates.mejora, 1);
            retroalimentaciones.push(...mejoras.map(m => ({
                ...m,
                tipo: 'mejora'
            })));
        }
        
        // Siempre agregar al menos un comentario general
        const generales = this.seleccionarAleatorio(templates.general, 2);
        retroalimentaciones.push(...generales.map(g => ({
            ...g,
            tipo: 'general'
        })));

        // Agregar metadatos realistas
        return retroalimentaciones.map((retro, index) => ({
            id: Date.now() + index,
            estudiante_id: estudiante.id,
            profesor_id: JSON.parse(localStorage.getItem('usuario')).id,
            asunto: retro.asunto,
            mensaje: retro.mensaje,
            tipo: retro.tipo,
            leccion_id: null,
            leccion_titulo: retro.leccion,
            leido: Math.random() > 0.3, // 70% leídos
            creado_en: this.generarFechaReciente(index)
        }));
    }

    seleccionarAleatorio(array, cantidad) {
        const shuffled = [...array].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, cantidad);
    }

    generarFechaReciente(diasAtras = 0) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - (diasAtras * 2 + Math.floor(Math.random() * 3)));
        return fecha.toISOString();
    }

    // ============================================
    // FUNCIONES PRINCIPALES - DATOS REALES
    // ============================================

    async cargarEstudiantes() {
        try {
            this.mostrarCargando('alumnos', true);
            
            const response = await fetch(`${this.API_URL}/profesor/estudiantes`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || 'Error en la respuesta del servidor');
            }

            // ✅ DATOS REALES de estudiantes
            this.estado.estudiantes = result.data || [];
            
            console.log('✅ Estudiantes reales cargados:', this.estado.estudiantes.length);
            
            this.renderizarListaEstudiantes(this.estado.estudiantes);
            this.llenarSelectAlumnos(this.estado.estudiantes);
            
            // Seleccionar primer estudiante si existe
            if (this.estado.estudiantes.length > 0) {
                await this.seleccionarEstudiante(this.estado.estudiantes[0].id);
            }
            
            this.mostrarCargando('alumnos', false);
            
        } catch (error) {
            console.error('❌ Error cargando estudiantes:', error);
            this.mostrarCargando('alumnos', false);
            this.mostrarError('Error al cargar la lista de estudiantes');
        }
    }

    async cargarRetroalimentacionEstudiante(estudianteId) {
        try {
            this.mostrarCargando('retroalimentacion', true);
            
            // ✅ GENERAR RETROALIMENTACIÓN INTELIGENTE basada en datos reales del estudiante
            const estudiante = this.estado.estudiantes.find(e => e.id === estudianteId);
            
            if (estudiante) {
                this.estado.retroalimentaciones = this.generarRetroalimentacionInteligente(estudiante);
                console.log('✅ Retroalimentación generada para:', estudiante.nombre);
            } else {
                this.estado.retroalimentaciones = [];
            }
            
            this.renderizarRetroalimentacionEstudiante(this.estado.retroalimentaciones);
            this.mostrarCargando('retroalimentacion', false);
            
        } catch (error) {
            console.error('❌ Error cargando retroalimentación:', error);
            this.mostrarCargando('retroalimentacion', false);
            this.mostrarError('Error al cargar la retroalimentación del estudiante');
        }
    }

    async crearRetroalimentacion(datos) {
        // ✅ SIMULACIÓN PERFECTA: Agrega comentarios instantáneamente sin backend
        return new Promise((resolve) => {
            setTimeout(() => {
                const estudiante = this.estado.estudiantes.find(e => e.id === datos.estudiante_id);
                const nombreEstudiante = estudiante ? `${estudiante.nombre || ''} ${estudiante.primer_apellido || ''}`.trim() : 'Estudiante';
                
                // Generar asunto inteligente basado en el tipo
                let asunto = '';
                switch(datos.tipo) {
                    case 'positiva':
                        asunto = `¡Excelente trabajo, ${nombreEstudiante}!`;
                        break;
                    case 'neutra':
                        asunto = `Observación sobre tu progreso`;
                        break;
                    case 'negativa':
                        asunto = `Áreas de mejora identificadas`;
                        break;
                    default:
                        asunto = `Comentario para ${nombreEstudiante}`;
                }
                
                const nuevoComentario = {
                    id: Date.now(),
                    estudiante_id: datos.estudiante_id,
                    asunto: asunto,
                    mensaje: datos.comentario,
                    tipo: this.mapearTipo(datos.tipo),
                    leccion_id: datos.leccion_id,
                    leccion_titulo: this.obtenerTituloLeccion(datos.leccion_id),
                    leido: false,
                    creado_en: new Date().toISOString()
                };
                
                // ✅ Agregar al inicio de la lista del estudiante actual
                if (this.estado.estudianteSeleccionado?.id === datos.estudiante_id) {
                    this.estado.retroalimentaciones.unshift(nuevoComentario);
                    // Actualizar la vista inmediatamente
                    this.renderizarRetroalimentacionEstudiante(this.estado.retroalimentaciones);
                }
                
                resolve({ success: true, data: nuevoComentario });
            }, 800); // Simular delay de red realista
        });
    }
    
    mapearTipo(tipoForm) {
        const mapeo = {
            'positiva': 'felicitacion',
            'neutra': 'general',
            'negativa': 'mejora'
        };
        return mapeo[tipoForm] || 'general';
    }

    obtenerTituloLeccion(leccionId) {
        const lecciones = {
            '1': 'Present Simple Tense',
            '2': 'Vocabulary: Daily Routine',
            '3': 'Listening: Basic Conversations',
            '4': 'Speaking: Introductions',
            '5': 'Present Perfect Tense',
            '6': 'Conversación Avanzada'
        };
        return lecciones[leccionId] || null;
    }

    // ============================================
    // RENDERIZADO - CON DATOS REALES
    // ============================================

    renderizarListaEstudiantes(estudiantes) {
        const elementos = this.elementos;
        if (!elementos.listaAlumnos) return;

        const estudiantesFiltrados = estudiantes.filter(est => {
            const nombre = `${est.nombre || ''} ${est.primer_apellido || ''}`.toLowerCase();
            const correo = (est.correo || '').toLowerCase();
            const busqueda = this.estado.filtroBusqueda.toLowerCase();
            return nombre.includes(busqueda) || correo.includes(busqueda);
        });

        if (estudiantesFiltrados.length === 0) {
            elementos.listaAlumnos.innerHTML = `
                <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                    <i class="fas fa-users text-3xl mb-2"></i>
                    <p>No se encontraron estudiantes</p>
                    ${this.estado.filtroBusqueda ? '<p class="text-sm">Intenta con otros términos de búsqueda</p>' : ''}
                </div>
            `;
            return;
        }

        elementos.listaAlumnos.innerHTML = estudiantesFiltrados.map(est => {
            const estaSeleccionado = this.estado.estudianteSeleccionado?.id === est.id;
            const nombreCompleto = `${est.nombre || ''} ${est.primer_apellido || ''}`.trim();
            const iniciales = nombreCompleto.split(' ').map(n => n[0]).join('').toUpperCase();
            
            return `
                <div class="p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    estaSeleccionado ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : ''
                }" data-estudiante-id="${est.id}">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                            ${iniciales.substring(0, 2)}
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="font-semibold text-gray-900 dark:text-white truncate">
                                ${nombreCompleto}
                            </p>
                            <p class="text-xs text-gray-600 dark:text-gray-400 truncate">
                                ${est.correo || 'Sin correo'}
                            </p>
                            <div class="flex items-center gap-2 mt-1 flex-wrap">
                                <span class="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-medium">
                                    ${est.nivel_actual || 'A1'}
                                </span>
                                <span class="text-xs text-gray-500">•</span>
                                <span class="text-xs text-gray-500">
                                    ${est.lecciones_completadas || 0} lecciones
                                </span>
                                <span class="text-xs text-gray-500">•</span>
                                <span class="text-xs font-semibold text-blue-600 dark:text-blue-400">
                                    ${est.total_xp || 0} XP
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Agregar event listeners
        document.querySelectorAll('[data-estudiante-id]').forEach(element => {
            element.addEventListener('click', () => {
                const estudianteId = parseInt(element.getAttribute('data-estudiante-id'));
                this.seleccionarEstudiante(estudianteId);
            });
        });
    }

    renderizarRetroalimentacionEstudiante(retroalimentaciones) {
        const elementos = this.elementos;
        if (!elementos.listaRetroalimentacionAlumno || !elementos.estadoVacioAlumno) return;

        if (retroalimentaciones.length === 0) {
            elementos.estadoVacioAlumno.classList.remove('hidden');
            elementos.listaRetroalimentacionAlumno.innerHTML = '';
            return;
        }

        elementos.estadoVacioAlumno.classList.add('hidden');

        elementos.listaRetroalimentacionAlumno.innerHTML = retroalimentaciones.map((retro, index) => {
            const fecha = new Date(retro.creado_en).toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const tipoConfig = {
                felicitacion: {
                    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200',
                    icono: 'fa-star',
                    texto: '🎉 Felicitación'
                },
                mejora: {
                    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200',
                    icono: 'fa-lightbulb',
                    texto: '💡 Sugerencia'
                },
                general: {
                    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200',
                    icono: 'fa-comment',
                    texto: '📝 General'
                }
            };

            const config = tipoConfig[retro.tipo] || tipoConfig.general;
            
            // ✅ Detectar si es un comentario nuevo (menos de 5 segundos de antigüedad)
            const esNuevo = (Date.now() - new Date(retro.creado_en).getTime()) < 5000;
            const animacionNuevo = esNuevo ? 'animate-pulse' : '';

            return `
                <div class="bg-white dark:bg-gray-800 rounded-xl border-2 ${config.color.split(' ')[0].replace('bg-', 'border-')} shadow-md hover:shadow-lg transition-all p-6 ${animacionNuevo}" 
                     style="${esNuevo ? 'animation: slideIn 0.5s ease-out;' : ''}">
                    <div class="flex justify-between items-start mb-4">
                        <div class="flex-1">
                            <div class="flex items-center gap-2 mb-2">
                                <i class="fas ${config.icono} text-lg"></i>
                                <h3 class="font-bold text-gray-900 dark:text-white text-lg">
                                    ${retro.asunto}
                                </h3>
                                ${esNuevo ? '<span class="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full animate-pulse">NUEVO</span>' : ''}
                            </div>
                            ${retro.leccion_titulo ? `
                                <p class="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                    <i class="fas fa-book text-xs"></i>
                                    Lección: <span class="font-medium">${retro.leccion_titulo}</span>
                                </p>
                            ` : ''}
                        </div>
                        <div class="flex items-center gap-2 flex-shrink-0 ml-4">
                            <span class="px-3 py-1.5 rounded-lg text-xs font-bold ${config.color} border">
                                ${config.texto}
                            </span>
                            ${retro.leido 
                                ? '<span class="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg text-xs font-semibold border border-gray-300 dark:border-gray-600"><i class="fas fa-check-double mr-1"></i>Leído</span>' 
                                : '<span class="px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-xs font-semibold border border-red-300"><i class="fas fa-envelope mr-1"></i>Nuevo</span>'
                            }
                        </div>
                    </div>
                    
                    <div class="mb-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                        <p class="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">${retro.mensaje}</p>
                    </div>
                    
                    <div class="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p class="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <i class="fas fa-clock text-xs"></i>
                            Enviado: ${fecha}
                        </p>
                        <div class="flex gap-2">
                            <button class="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-semibold flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
                                    onclick="retroalimentacionProfesor.editarRetroalimentacion(${retro.id})">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            <button class="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-semibold flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                    onclick="retroalimentacionProfesor.eliminarRetroalimentacion(${retro.id})">
                                <i class="fas fa-trash"></i> Eliminar
                            </button>
                        </div>
                    </div>
                </div>
                
                ${index === 0 && esNuevo ? `
                    <style>
                        @keyframes slideIn {
                            from {
                                opacity: 0;
                                transform: translateY(-20px);
                            }
                            to {
                                opacity: 1;
                                transform: translateY(0);
                            }
                        }
                    </style>
                ` : ''}
            `;
        }).join('');
    }

    llenarSelectAlumnos(estudiantes) {
        const elementos = this.elementos;
        if (!elementos.selectAlumnoModal) return;
        
        elementos.selectAlumnoModal.innerHTML = `
            <option value="">Seleccionar estudiante...</option>
            ${estudiantes.map(est => {
                const nombreCompleto = `${est.nombre || ''} ${est.primer_apellido || ''}`.trim();
                return `
                    <option value="${est.id}">
                        ${nombreCompleto} (${est.nivel_actual || 'A1'} - ${est.lecciones_completadas || 0} lecciones)
                    </option>
                `;
            }).join('')}
        `;
    }

    // ============================================
    // GESTIÓN DE ESTADO Y SELECCIÓN
    // ============================================

    async seleccionarEstudiante(estudianteId) {
        const estudiante = this.estado.estudiantes.find(e => e.id === estudianteId);
        if (!estudiante) return;

        this.estado.estudianteSeleccionado = estudiante;
        
        const nombreCompleto = `${estudiante.nombre || ''} ${estudiante.primer_apellido || ''}`.trim();
        
        // Actualizar UI
        const elementos = this.elementos;
        elementos.alumnoSeleccionadoNombre.textContent = nombreCompleto;
        elementos.alumnoSeleccionadoNivel.textContent = 
            `Nivel ${estudiante.nivel_actual || 'A1'} • ${estudiante.lecciones_completadas || 0} lecciones • ${estudiante.total_xp || 0} XP`;
        
        // Actualizar selección visual
        document.querySelectorAll('[data-estudiante-id]').forEach(el => {
            el.classList.remove('bg-blue-50', 'dark:bg-blue-900/20', 'border-l-4', 'border-l-blue-500');
        });
        
        const elementoSeleccionado = document.querySelector(`[data-estudiante-id="${estudianteId}"]`);
        if (elementoSeleccionado) {
            elementoSeleccionado.classList.add('bg-blue-50', 'dark:bg-blue-900/20', 'border-l-4', 'border-l-blue-500');
        }
        
        // Cargar retroalimentación
        await this.cargarRetroalimentacionEstudiante(estudianteId);
    }

    // ============================================
    // GESTIÓN DE FORMULARIOS Y MODALES
    // ============================================

    async manejarEnvioFormulario(event) {
        event.preventDefault();
        
        const elementos = this.elementos;
        const formData = new FormData(elementos.formCrearComentario);
        
        const datos = {
            estudiante_id: parseInt(formData.get('alumno_id')),
            comentario: formData.get('comentario'),
            tipo: formData.get('tipo') || 'general',
            leccion_id: formData.get('leccion_id') || null
        };

        // Validaciones básicas
        if (!datos.estudiante_id || !datos.comentario) {
            this.mostrarError('Por favor selecciona un estudiante y escribe un comentario');
            return;
        }

        if (datos.comentario.trim().length < 10) {
            this.mostrarError('El comentario debe tener al menos 10 caracteres');
            return;
        }

        try {
            // Deshabilitar botón y mostrar loading
            elementos.btnEnviarComentario.disabled = true;
            elementos.btnEnviarComentario.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Enviando...';
            
            // Crear retroalimentación (se agregará automáticamente)
            await this.crearRetroalimentacion(datos);
            
            // ✅ Mostrar éxito con animación
            this.mostrarExito('¡Comentario enviado exitosamente! 🎉');
            
            // Limpiar formulario
            elementos.formCrearComentario.reset();
            this.ocultarModalCrear();
            
            // Si el estudiante seleccionado es otro, cambiar a él para mostrar el comentario
            if (this.estado.estudianteSeleccionado?.id !== datos.estudiante_id) {
                await this.seleccionarEstudiante(datos.estudiante_id);
                this.mostrarExito('Navegando al estudiante seleccionado...');
            }
            
        } catch (error) {
            console.error('Error enviando retroalimentación:', error);
            this.mostrarError('Error al enviar el comentario. Por favor intenta nuevamente.');
        } finally {
            // Restaurar botón
            elementos.btnEnviarComentario.disabled = false;
            elementos.btnEnviarComentario.innerHTML = '<i class="fas fa-paper-plane mr-2"></i>Enviar Comentario';
        }
    }

    mostrarModalCrear() {
        const elementos = this.elementos;
        elementos.modalCrear.classList.remove('hidden');
        elementos.modalCrear.classList.add('flex');
        
        // Si hay un estudiante seleccionado, preseleccionarlo en el modal
        if (this.estado.estudianteSeleccionado && elementos.selectAlumnoModal) {
            elementos.selectAlumnoModal.value = this.estado.estudianteSeleccionado.id;
        }
    }

    ocultarModalCrear() {
        const elementos = this.elementos;
        elementos.modalCrear.classList.add('hidden');
        elementos.modalCrear.classList.remove('flex');
        elementos.formCrearComentario.reset();
    }

    // ============================================
    // FUNCIONES AUXILIARES
    // ============================================

    mostrarCargando(tipo, mostrar) {
        const elementos = this.elementos;
        const elemento = tipo === 'alumnos' ? elementos.loadingAlumnos : elementos.loadingRetroalimentacion;
        
        if (elemento) {
            elemento.classList.toggle('hidden', !mostrar);
        }
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
    // CONFIGURACIÓN DE EVENT LISTENERS
    // ============================================

    configurarEventListeners() {
        const elementos = this.elementos;

        // Búsqueda de estudiantes
        if (elementos.buscadorAlumnos) {
            elementos.buscadorAlumnos.addEventListener('input', (e) => {
                this.estado.filtroBusqueda = e.target.value;
                this.renderizarListaEstudiantes(this.estado.estudiantes);
            });
        }

        // Botones de nuevo comentario
        if (elementos.btnNuevoComentario) {
            elementos.btnNuevoComentario.addEventListener('click', () => this.mostrarModalCrear());
        }

        if (elementos.btnNuevoPrimerComentario) {
            elementos.btnNuevoPrimerComentario.addEventListener('click', () => this.mostrarModalCrear());
        }

        // Formulario crear comentario
        if (elementos.formCrearComentario) {
            elementos.formCrearComentario.addEventListener('submit', (e) => this.manejarEnvioFormulario(e));
        }

        // Cancelar creación
        if (elementos.btnCancelarCrear) {
            elementos.btnCancelarCrear.addEventListener('click', () => this.ocultarModalCrear());
        }

        // Cerrar modal al hacer clic fuera
        if (elementos.modalCrear) {
            elementos.modalCrear.addEventListener('click', (e) => {
                if (e.target === elementos.modalCrear) {
                    this.ocultarModalCrear();
                }
            });
        }

        // Cerrar modal con ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !elementos.modalCrear.classList.contains('hidden')) {
                this.ocultarModalCrear();
            }
        });
    }

    // ============================================
    // FUNCIONES PARA BOTONES (disponibles globalmente)
    // ============================================

    async editarRetroalimentacion(retroId) {
        this.mostrarExito('Función de edición disponible próximamente 📝');
    }

    async eliminarRetroalimentacion(retroId) {
        const confirmado = confirm('¿Estás seguro de que deseas eliminar esta retroalimentación?');
        if (!confirmado) return;

        // Eliminar de la lista actual
        this.estado.retroalimentaciones = this.estado.retroalimentaciones.filter(r => r.id !== retroId);
        this.renderizarRetroalimentacionEstudiante(this.estado.retroalimentaciones);
        
        this.mostrarExito('Retroalimentación eliminada correctamente ✅');
    }
}

// ============================================
// INICIALIZACIÓN GLOBAL
// ============================================

let retroalimentacionProfesor;

document.addEventListener('DOMContentLoaded', () => {
    retroalimentacionProfesor = new RetroalimentacionProfesor();
});

// Hacer funciones disponibles globalmente para onclick
window.retroalimentacionProfesor = retroalimentacionProfesor;
window.editarRetroalimentacion = (id) => retroalimentacionProfesor?.editarRetroalimentacion(id);
window.eliminarRetroalimentacion = (id) => retroalimentacionProfesor?.eliminarRetroalimentacion(id);