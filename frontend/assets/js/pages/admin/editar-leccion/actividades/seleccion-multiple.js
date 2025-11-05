// Manager mejorado para actividades de selección múltiple - Diseño Duolingo
window.SeleccionMultipleManager = {
    crear() {
        return {
            id: 'actividad_' + Date.now(),
            tipo: 'seleccion_multiple',
            titulo: 'Nueva Pregunta de Selección Múltiple',
            puntos: 10,
            orden: 0,
            contenido: {
                pregunta: "",
                opciones: [
                    { id: this.generarId(), texto: "", correcta: true, imagen: null, feedback: "" },
                    { id: this.generarId(), texto: "", correcta: false, imagen: null, feedback: "" },
                    { id: this.generarId(), texto: "", correcta: false, imagen: null, feedback: "" }
                ],
                explicacion: "",
                imagen: null,
                tiempoSugerido: 60
            },
            config: {
                tiempo_limite: null,
                intentos_permitidos: 1,
                mostrar_explicacion: true,
                aleatorizar_opciones: false,
                mostrar_puntos: true
            }
        };
    },

    generarId() {
        return 'opcion_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    generarCampos(actividad) {
        return `
            <div class="space-y-6">
                ${this.generarHeaderActividad(actividad)}
                ${this.generarSeccionPregunta(actividad)}
                ${this.generarSeccionOpciones(actividad)}
                ${this.generarSeccionConfiguracion(actividad)}
                ${this.generarSeccionExplicacion(actividad)}
            </div>
        `;
    },

    generarHeaderActividad(actividad) {
        return `
            <div class="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl border border-purple-200 dark:border-purple-800">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center shadow-sm border border-purple-200 dark:border-purple-700">
                        <i class="fas fa-list-ul text-purple-600 dark:text-purple-400 text-lg"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-gray-900 dark:text-white">Selección Múltiple</h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400">Crea preguntas con opciones de respuesta</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <span class="px-3 py-1 bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 rounded-full text-sm font-medium border border-purple-200 dark:border-purple-700">
                        ${actividad.puntos} pts
                    </span>
                </div>
            </div>
        `;
    },

    generarSeccionPregunta(actividad) {
        const tieneImagen = actividad.contenido.imagen;
        
        return `
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div class="flex items-center gap-2 mb-4">
                    <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <i class="fas fa-question text-blue-600 dark:text-blue-400 text-sm"></i>
                    </div>
                    <h4 class="font-semibold text-gray-900 dark:text-white">Pregunta Principal</h4>
                </div>

                <!-- Imagen de la pregunta -->
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Imagen de apoyo (opcional)
                    </label>
                    ${tieneImagen ? `
                        <div class="relative inline-block">
                            <div class="image-preview-card">
                                <img src="${actividad.contenido.imagen.url}" alt="Imagen de pregunta" 
                                     class="rounded-lg border-2 border-green-200 dark:border-green-800 max-w-xs">
                                <button type="button" 
                                        onclick="SeleccionMultipleManager.eliminarImagenPregunta('${actividad.id}')"
                                        class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors shadow-lg">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                    ` : `
                        <div class="flex gap-2">
                            <button type="button" 
                                    onclick="SeleccionMultipleManager.agregarImagenPregunta('${actividad.id}')"
                                    class="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl transition-colors border border-gray-300 dark:border-gray-600">
                                <i class="fas fa-image text-purple-500"></i>
                                Agregar imagen
                            </button>
                        </div>
                    `}
                </div>

                <!-- Campo de pregunta -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Pregunta *
                    </label>
                    <textarea oninput="SeleccionMultipleManager.actualizarPregunta('${actividad.id}', this.value)"
                              placeholder="Escribe una pregunta clara y concisa..."
                              class="w-full h-24 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none">${actividad.contenido.pregunta}</textarea>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        💡 Sé específico y evita ambigüedades
                    </p>
                </div>
            </div>
        `;
    },

    generarSeccionOpciones(actividad) {
        return `
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                            <i class="fas fa-list-ol text-green-600 dark:text-green-400 text-sm"></i>
                        </div>
                        <h4 class="font-semibold text-gray-900 dark:text-white">Opciones de Respuesta</h4>
                    </div>
                    <span class="text-sm text-gray-500 dark:text-gray-400">
                        ${actividad.contenido.opciones.filter(o => o.correcta).length} correcta(s)
                    </span>
                </div>

                <div class="space-y-4" id="opciones-${actividad.id}">
                    ${actividad.contenido.opciones.map((opcion, index) => this.generarOpcionHTML(actividad.id, opcion, index)).join('')}
                </div>

                <button type="button" 
                        onclick="SeleccionMultipleManager.agregarOpcion('${actividad.id}')"
                        class="w-full mt-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-purple-400 dark:hover:border-purple-500 transition-all group">
                    <i class="fas fa-plus-circle mr-2 group-hover:text-purple-500 transition-colors"></i>
                    Agregar otra opción
                </button>

                <div class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div class="flex items-start gap-2">
                        <i class="fas fa-lightbulb text-blue-500 mt-0.5"></i>
                        <p class="text-sm text-blue-700 dark:text-blue-300">
                            <strong>Tip:</strong> Marca como correcta solo una opción para preguntas de selección única, 
                            o varias para preguntas de selección múltiple.
                        </p>
                    </div>
                </div>
            </div>
        `;
    },

    generarOpcionHTML(actividadId, opcion, index) {
        const letra = String.fromCharCode(65 + index);
        const esCorrecta = opcion.correcta;
        const actividad = this.getActividad(actividadId);
        const totalOpciones = actividad ? actividad.contenido.opciones.length : 0;
        
        return `
            <div class="opcion-item ${esCorrecta ? 'opcion-correcta' : ''}" data-opcion-id="${opcion.id}">
                <div class="flex items-start gap-4">
                    <!-- Indicador de letra y correcto/incorrecto -->
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 flex items-center justify-center rounded-lg ${
                            esCorrecta 
                                ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500' 
                                : 'bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600'
                        } font-semibold ${
                            esCorrecta ? 'text-green-700 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'
                        }">
                            ${letra}
                        </div>
                        
                        <input type="radio" 
                               name="correcta-${actividadId}" 
                               ${esCorrecta ? 'checked' : ''}
                               onchange="SeleccionMultipleManager.marcarOpcionCorrecta('${actividadId}', '${opcion.id}')"
                               class="w-5 h-5 text-green-500 focus:ring-green-500 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
                    </div>

                    <!-- Contenido de la opción -->
                    <div class="flex-1 min-w-0">
                        <!-- Imagen de la opción -->
                        ${opcion.imagen ? `
                            <div class="mb-3">
                                <div class="image-preview-card inline-block">
                                    <img src="${opcion.imagen.url}" alt="Imagen opción" 
                                         class="rounded-lg border-2 border-blue-200 dark:border-blue-800 max-w-xs">
                                    <button type="button" 
                                            onclick="SeleccionMultipleManager.eliminarImagenOpcion('${actividadId}', '${opcion.id}')"
                                            class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors shadow-lg">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                        ` : ''}

                        <!-- Texto de la opción -->
                        <textarea oninput="SeleccionMultipleManager.actualizarTextoOpcion('${actividadId}', '${opcion.id}', this.value)"
                                  placeholder="Escribe el texto de esta opción..."
                                  class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none min-h-[80px]">${opcion.texto}</textarea>

                        <!-- Feedback específico -->
                        <div class="mt-2">
                            <input type="text" 
                                   oninput="SeleccionMultipleManager.actualizarFeedbackOpcion('${actividadId}', '${opcion.id}', this.value)"
                                   value="${opcion.feedback || ''}"
                                   placeholder="Feedback específico (opcional)"
                                   class="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 focus:ring-1 focus:ring-blue-500 focus:border-transparent">
                        </div>
                    </div>

                    <!-- Controles de la opción -->
                    <div class="flex items-center gap-1">
                        <button type="button" 
                                onclick="SeleccionMultipleManager.agregarImagenOpcion('${actividadId}', '${opcion.id}')"
                                class="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                title="Agregar imagen">
                            <i class="fas fa-image text-sm"></i>
                        </button>
                        
                        <button type="button" 
                                onclick="SeleccionMultipleManager.moverOpcion('${actividadId}', '${opcion.id}', -1)"
                                class="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${index === 0 ? 'opacity-50 cursor-not-allowed' : ''}"
                                title="Mover arriba" ${index === 0 ? 'disabled' : ''}>
                            <i class="fas fa-arrow-up text-sm"></i>
                        </button>
                        
                        <button type="button" 
                                onclick="SeleccionMultipleManager.moverOpcion('${actividadId}', '${opcion.id}', 1)"
                                class="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${index === totalOpciones - 1 ? 'opacity-50 cursor-not-allowed' : ''}"
                                title="Mover abajo" ${index === totalOpciones - 1 ? 'disabled' : ''}>
                            <i class="fas fa-arrow-down text-sm"></i>
                        </button>
                        
                        <button type="button" 
                                onclick="SeleccionMultipleManager.eliminarOpcion('${actividadId}', '${opcion.id}')"
                                class="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 ${totalOpciones <= 2 ? 'opacity-50 cursor-not-allowed' : ''}"
                                title="Eliminar opción" ${totalOpciones <= 2 ? 'disabled' : ''}>
                            <i class="fas fa-trash text-sm"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    generarSeccionConfiguracion(actividad) {
        return `
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div class="flex items-center gap-2 mb-4">
                    <div class="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                        <i class="fas fa-cog text-purple-600 dark:text-purple-400 text-sm"></i>
                    </div>
                    <h4 class="font-semibold text-gray-900 dark:text-white">Configuración</h4>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Tiempo límite (segundos)
                        </label>
                        <input type="number" 
                               value="${actividad.config.tiempo_limite || ''}"
                               oninput="SeleccionMultipleManager.actualizarTiempoLimite('${actividad.id}', this.value ? parseInt(this.value) : null)"
                               placeholder="Sin límite"
                               class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Intentos permitidos
                        </label>
                        <select onchange="SeleccionMultipleManager.actualizarIntentos('${actividad.id}', parseInt(this.value))"
                                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                            <option value="1" ${actividad.config.intentos_permitidos === 1 ? 'selected' : ''}>1 intento</option>
                            <option value="2" ${actividad.config.intentos_permitidos === 2 ? 'selected' : ''}>2 intentos</option>
                            <option value="3" ${actividad.config.intentos_permitidos === 3 ? 'selected' : ''}>3 intentos</option>
                            <option value="0" ${actividad.config.intentos_permitidos === 0 ? 'selected' : ''}>Intentos ilimitados</option>
                        </select>
                    </div>

                    <div class="flex items-center gap-3">
                        <input type="checkbox" 
                               ${actividad.config.aleatorizar_opciones ? 'checked' : ''}
                               onchange="SeleccionMultipleManager.actualizarAleatorizar('${actividad.id}', this.checked)"
                               class="w-4 h-4 text-purple-500 focus:ring-purple-500 border-gray-300 dark:border-gray-600 rounded">
                        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Aleatorizar orden de opciones
                        </label>
                    </div>

                    <div class="flex items-center gap-3">
                        <input type="checkbox" 
                               ${actividad.config.mostrar_puntos ? 'checked' : ''}
                               onchange="SeleccionMultipleManager.actualizarMostrarPuntos('${actividad.id}', this.checked)"
                               class="w-4 h-4 text-purple-500 focus:ring-purple-500 border-gray-300 dark:border-gray-600 rounded">
                        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Mostrar puntos al estudiante
                        </label>
                    </div>
                </div>
            </div>
        `;
    },

    generarSeccionExplicacion(actividad) {
        return `
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div class="flex items-center gap-2 mb-4">
                    <div class="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                        <i class="fas fa-lightbulb text-orange-600 dark:text-orange-400 text-sm"></i>
                    </div>
                    <h4 class="font-semibold text-gray-900 dark:text-white">Explicación</h4>
                </div>

                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Explicación de la respuesta correcta
                        </label>
                        <textarea oninput="SeleccionMultipleManager.actualizarExplicacion('${actividad.id}', this.value)"
                                  placeholder="Explica por qué la respuesta es correcta y proporciona contexto adicional..."
                                  class="w-full h-32 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none">${actividad.contenido.explicacion}</textarea>
                    </div>

                    <div class="flex items-center gap-3">
                        <input type="checkbox" 
                               ${actividad.config.mostrar_explicacion ? 'checked' : ''}
                               onchange="SeleccionMultipleManager.actualizarMostrarExplicacion('${actividad.id}', this.checked)"
                               class="w-4 h-4 text-orange-500 focus:ring-orange-500 border-gray-300 dark:border-gray-600 rounded">
                        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Mostrar explicación después de responder
                        </label>
                    </div>
                </div>
            </div>
        `;
    },

    // ========== FUNCIONES DE GESTIÓN ==========

    agregarOpcion(actividadId) {
        const actividad = this.getActividad(actividadId);
        if (actividad && actividad.contenido.opciones.length < 6) {
            const nuevaOpcion = {
                id: this.generarId(),
                texto: "",
                correcta: false,
                imagen: null,
                feedback: ""
            };
            actividad.contenido.opciones.push(nuevaOpcion);
            window.leccionEditor.recargarActividad(actividadId);
            window.leccionEditor.mostrarToast('➕ Nueva opción agregada', 'info');
        } else {
            window.leccionEditor.mostrarToast('❌ Máximo 6 opciones permitidas', 'error');
        }
    },

    eliminarOpcion(actividadId, opcionId) {
        const actividad = this.getActividad(actividadId);
        if (actividad && actividad.contenido.opciones.length > 2) {
            const opcionIndex = actividad.contenido.opciones.findIndex(o => o.id === opcionId);
            const opcionEliminada = actividad.contenido.opciones[opcionIndex];
            
            actividad.contenido.opciones = actividad.contenido.opciones.filter(o => o.id !== opcionId);
            
            // Si era la única opción correcta, marcar la primera como correcta
            if (opcionEliminada.correcta && !actividad.contenido.opciones.some(o => o.correcta)) {
                actividad.contenido.opciones[0].correcta = true;
            }
            
            window.leccionEditor.recargarActividad(actividadId);
            window.leccionEditor.mostrarToast('🗑️ Opción eliminada', 'success');
        } else {
            window.leccionEditor.mostrarToast('❌ Mínimo 2 opciones requeridas', 'error');
        }
    },

    marcarOpcionCorrecta(actividadId, opcionId) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            actividad.contenido.opciones.forEach(opcion => {
                opcion.correcta = opcion.id === opcionId;
            });
            window.leccionEditor.recargarActividad(actividadId);
        }
    },

    moverOpcion(actividadId, opcionId, direccion) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            const index = actividad.contenido.opciones.findIndex(o => o.id === opcionId);
            const nuevoIndex = index + direccion;
            
            if (nuevoIndex >= 0 && nuevoIndex < actividad.contenido.opciones.length) {
                const [opcion] = actividad.contenido.opciones.splice(index, 1);
                actividad.contenido.opciones.splice(nuevoIndex, 0, opcion);
                window.leccionEditor.recargarActividad(actividadId);
            }
        }
    },

    actualizarTextoOpcion(actividadId, opcionId, texto) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            const opcion = actividad.contenido.opciones.find(o => o.id === opcionId);
            if (opcion) {
                opcion.texto = texto;
            }
        }
    },

    // ========== FUNCIONES DE CONFIGURACIÓN ==========

    actualizarTiempoLimite(actividadId, tiempo) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            actividad.config.tiempo_limite = tiempo;
        }
    },

    actualizarIntentos(actividadId, intentos) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            actividad.config.intentos_permitidos = intentos;
        }
    },

    actualizarAleatorizar(actividadId, aleatorizar) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            actividad.config.aleatorizar_opciones = aleatorizar;
        }
    },

    actualizarMostrarPuntos(actividadId, mostrar) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            actividad.config.mostrar_puntos = mostrar;
        }
    },

    actualizarMostrarExplicacion(actividadId, mostrar) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            actividad.config.mostrar_explicacion = mostrar;
        }
    },

    actualizarFeedbackOpcion(actividadId, opcionId, feedback) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            const opcion = actividad.contenido.opciones.find(o => o.id === opcionId);
            if (opcion) {
                opcion.feedback = feedback;
            }
        }
    },

    // ========== FUNCIONES DE IMÁGENES ==========

    agregarImagenPregunta(actividadId) {
        window.currentImageContext = { 
            actividadId, 
            tipo: 'pregunta',
            elemento: 'seleccion_multiple'
        };
        this.abrirSelectorImagen();
    },

    agregarImagenOpcion(actividadId, opcionId) {
        window.currentImageContext = { 
            actividadId, 
            opcionId, 
            tipo: 'opcion',
            elemento: 'seleccion_multiple'
        };
        this.abrirSelectorImagen();
    },

    eliminarImagenPregunta(actividadId) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            actividad.contenido.imagen = null;
            window.leccionEditor.recargarActividad(actividadId);
            window.leccionEditor.mostrarToast('🗑️ Imagen de pregunta eliminada', 'success');
        }
    },

    eliminarImagenOpcion(actividadId, opcionId) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            const opcion = actividad.contenido.opciones.find(o => o.id === opcionId);
            if (opcion) {
                opcion.imagen = null;
                window.leccionEditor.recargarActividad(actividadId);
                window.leccionEditor.mostrarToast('🗑️ Imagen de opción eliminada', 'success');
            }
        }
    },

    // ========== FUNCIONES DE CONTENIDO ==========

    actualizarPregunta(actividadId, pregunta) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            actividad.contenido.pregunta = pregunta;
        }
    },

    actualizarExplicacion(actividadId, explicacion) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            actividad.contenido.explicacion = explicacion;
        }
    },

    // ========== FUNCIONES AUXILIARES ==========

    getActividad(actividadId) {
        return window.leccionEditor.getActividades().find(a => a.id === actividadId);
    },

    abrirSelectorImagen() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => this.manejarSeleccionImagen(e.target.files[0]);
        input.click();
    },

    async manejarSeleccionImagen(file) {
        if (!window.currentImageContext || !file) return;

        try {
            // Simular subida de imagen (en desarrollo)
            const imagenData = {
                id: 'img_' + Date.now(),
                url: URL.createObjectURL(file),
                nombre: file.name,
                tipo: file.type,
                tamaño: file.size,
                fecha_subida: new Date().toISOString()
            };

            this.asignarImagenSegunContexto(imagenData);
            window.leccionEditor.mostrarToast('✅ Imagen agregada correctamente', 'success');
        } catch (error) {
            console.error('Error al procesar imagen:', error);
            window.leccionEditor.mostrarToast('❌ Error al agregar imagen', 'error');
        }
    },

    asignarImagenSegunContexto(imagenData) {
        const { actividadId, tipo, opcionId } = window.currentImageContext;

        const actividad = this.getActividad(actividadId);
        if (!actividad) return;

        if (tipo === 'pregunta') {
            actividad.contenido.imagen = imagenData;
        } else if (tipo === 'opcion') {
            const opcion = actividad.contenido.opciones.find(o => o.id === opcionId);
            if (opcion) {
                opcion.imagen = imagenData;
            }
        }

        window.leccionEditor.recargarActividad(actividadId);
    },

    // ========== VALIDACIÓN ==========

    validar(actividad) {
        const errores = [];

        if (!actividad.contenido.pregunta || !actividad.contenido.pregunta.trim()) {
            errores.push('La pregunta es requerida');
        }

        const opcionesValidas = actividad.contenido.opciones.filter(opcion => 
            opcion.texto && opcion.texto.trim()
        );

        if (opcionesValidas.length < 2) {
            errores.push('Se requieren al menos 2 opciones con texto');
        }

        const opcionesCorrectas = actividad.contenido.opciones.filter(opcion => opcion.correcta);
        if (opcionesCorrectas.length === 0) {
            errores.push('Debe haber al menos una opción correcta');
        }

        if (actividad.puntos < 1 || actividad.puntos > 100) {
            errores.push('Los puntos deben estar entre 1 y 100');
        }

        return errores;
    }
};

// ========== ESTILOS CSS MEJORADOS ==========
const injectStyles = () => {
    const styles = `
        .opcion-item {
            transition: all 0.3s ease;
            padding: 1.5rem;
            border-radius: 1rem;
            border: 2px solid transparent;
            background: #f8fafc;
            position: relative;
        }
        
        .dark .opcion-item {
            background: #1f2937;
        }
        
        .opcion-item:hover {
            border-color: #c7d2fe;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .opcion-correcta {
            border-color: #10b981;
            background: #f0fdf4;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
        }
        
        .dark .opcion-correcta {
            background: rgba(16, 185, 129, 0.1);
            border-color: #059669;
        }
        
        .image-preview-card {
            position: relative;
            display: inline-block;
            margin: 0.5rem 0;
        }
        
        .image-preview-card img {
            border-radius: 0.75rem;
            max-width: 200px;
            max-height: 150px;
            object-fit: cover;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .opcion-controls {
            display: flex;
            gap: 0.5rem;
            align-items: center;
        }
        
        .seleccion-multiple-header {
            background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
            color: white;
        }
        
        .dark .seleccion-multiple-header {
            background: linear-gradient(135deg, #7c3aed 0%, #1e40af 100%);
        }
        
        /* Animaciones */
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .opcion-item {
            animation: slideIn 0.3s ease-out;
        }
        
        /* Estados de hover mejorados */
        .btn-imagen:hover {
            transform: scale(1.05);
        }
        
        .btn-mover:hover {
            background: #e5e7eb;
        }
        
        .dark .btn-mover:hover {
            background: #374151;
        }
        
        .btn-eliminar:hover {
            background: #fef2f2;
        }
        
        .dark .btn-eliminar:hover {
            background: #7f1d1d;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .opcion-item {
                padding: 1rem;
            }
            
            .image-preview-card img {
                max-width: 150px;
                max-height: 120px;
            }
        }
    `;

    if (!document.querySelector('#seleccion-multiple-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'seleccion-multiple-styles';
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }
};

// Inyectar estilos cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectStyles);
} else {
    injectStyles();
}

// Inicialización automática
console.log('✅ SeleccionMultipleManager cargado correctamente');