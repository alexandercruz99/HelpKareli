/* ============================================
   SPEAKLEXI - EDITOR LECCIÓN - COMPLETAR ESPACIOS MEJORADO
   Diseño moderno tipo Duolingo con mejor UX/UI
   ============================================ */

// Manager mejorado para actividades de completar espacios
window.CompletarEspaciosManager = {
    crear() {
        return {
            id: 'actividad_' + Date.now(),
            tipo: 'completar_espacios',
            titulo: 'Nueva Actividad Completar Espacios',
            puntos: 10,
            orden: 0,
            contenido: {
                texto: "",
                palabras_faltantes: [],
                explicacion: "",
                imagen: null,
                tiempoSugerido: 90,
                pista_activada: false,
                pista_texto: ""
            },
            config: {
                tiempo_limite: null,
                intentos_permitidos: 1,
                mostrar_explicacion: true,
                mostrar_puntos: true,
                case_sensitive: false,
                permitir_pistas: true
            }
        };
    },

    generarCampos(actividad) {
        return `
            <div class="space-y-6">
                ${this.generarHeaderActividad(actividad)}
                ${this.generarSeccionImagen(actividad)}
                ${this.generarSeccionTexto(actividad)}
                ${this.generarSeccionPalabrasFaltantes(actividad)}
                ${this.generarSeccionPistas(actividad)}
                ${this.generarSeccionConfiguracion(actividad)}
                ${this.generarSeccionExplicacion(actividad)}
            </div>
        `;
    },

    generarHeaderActividad(actividad) {
        return `
            <div class="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-2xl border border-yellow-200 dark:border-yellow-800">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center shadow-sm border border-yellow-200 dark:border-yellow-700">
                        <i class="fas fa-edit text-yellow-600 dark:text-yellow-400 text-lg"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-gray-900 dark:text-white">Completar Espacios</h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400">Crea textos con palabras faltantes</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <span class="px-3 py-1 bg-white dark:bg-gray-800 text-yellow-600 dark:text-yellow-400 rounded-full text-sm font-medium border border-yellow-200 dark:border-yellow-700">
                        ${actividad.puntos} pts
                    </span>
                </div>
            </div>
        `;
    },

    generarSeccionImagen(actividad) {
        const tieneImagen = actividad.contenido.imagen;
        
        return `
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div class="flex items-center gap-2 mb-4">
                    <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <i class="fas fa-image text-blue-600 dark:text-blue-400 text-sm"></i>
                    </div>
                    <h4 class="font-semibold text-gray-900 dark:text-white">Imagen de Apoyo</h4>
                </div>

                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Imagen contextual (opcional)
                    </label>
                    ${tieneImagen ? `
                        <div class="relative inline-block">
                            <div class="image-preview-card">
                                <img src="${actividad.contenido.imagen.url}" alt="Imagen del texto" 
                                     class="rounded-lg border-2 border-green-200 dark:border-green-800 max-w-xs">
                                <button type="button" 
                                        onclick="CompletarEspaciosManager.eliminarImagen('${actividad.id}')"
                                        class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors shadow-lg">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                    ` : `
                        <div class="flex gap-2">
                            <button type="button" 
                                    onclick="CompletarEspaciosManager.agregarImagen('${actividad.id}')"
                                    class="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl transition-colors border border-gray-300 dark:border-gray-600">
                                <i class="fas fa-image text-yellow-500"></i>
                                Agregar imagen
                            </button>
                        </div>
                    `}
                </div>
            </div>
        `;
    },

    generarSeccionTexto(actividad) {
        const palabrasCount = actividad.contenido.palabras_faltantes.length;
        
        return `
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                            <i class="fas fa-font text-purple-600 dark:text-purple-400 text-sm"></i>
                        </div>
                        <h4 class="font-semibold text-gray-900 dark:text-white">Texto con Espacios</h4>
                    </div>
                    <span class="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-sm font-medium">
                        ${palabrasCount} espacios
                    </span>
                </div>

                <!-- Instrucciones -->
                <div class="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-700">
                    <div class="flex items-start gap-3">
                        <div class="w-8 h-8 bg-yellow-100 dark:bg-yellow-800 rounded-lg flex items-center justify-center flex-shrink-0">
                            <i class="fas fa-lightbulb text-yellow-600 dark:text-yellow-400"></i>
                        </div>
                        <div>
                            <h5 class="font-semibold text-yellow-800 dark:text-yellow-300 mb-1">Cómo crear espacios</h5>
                            <p class="text-sm text-yellow-700 dark:text-yellow-400">
                                Encierra las palabras faltantes con <strong>doble corchete</strong>: [[palabra]]
                            </p>
                            <div class="mt-2 p-3 bg-white dark:bg-gray-800 rounded-lg border">
                                <code class="text-sm font-mono text-gray-700 dark:text-gray-300">
                                    El [[gato]] está sobre la [[mesa]] en el [[jardín]].
                                </code>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Editor de texto -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Texto con espacios faltantes *
                    </label>
                    <textarea oninput="CompletarEspaciosManager.actualizarTexto('${actividad.id}', this.value)" 
                              onblur="CompletarEspaciosManager.actualizarPalabrasFaltantes('${actividad.id}')"
                              placeholder="Escribe tu texto aquí. Usa [[palabra]] para marcar los espacios faltantes..."
                              class="w-full h-48 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none font-mono text-sm leading-relaxed">${actividad.contenido.texto}</textarea>
                    
                    <div class="flex items-center justify-between mt-2">
                        <p class="text-xs text-gray-500 dark:text-gray-400">
                            💡 Los espacios se detectan automáticamente al salir del campo
                        </p>
                        <button type="button" 
                                onclick="CompletarEspaciosManager.actualizarPalabrasFaltantes('${actividad.id}')"
                                class="text-xs px-3 py-1 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-purple-600 dark:text-purple-400 rounded-lg transition-colors">
                            <i class="fas fa-sync-alt mr-1"></i>Actualizar espacios
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    generarSeccionPalabrasFaltantes(actividad) {
        const palabras = actividad.contenido.palabras_faltantes || [];
        
        return `
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                            <i class="fas fa-search text-green-600 dark:text-green-400 text-sm"></i>
                        </div>
                        <h4 class="font-semibold text-gray-900 dark:text-white">Palabras Faltantes</h4>
                    </div>
                    <span class="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-sm font-medium">
                        ${palabras.length} detectadas
                    </span>
                </div>

                <div id="palabras-faltantes-${actividad.id}" class="space-y-3">
                    ${palabras.length > 0 ? 
                        palabras.map((palabra, index) => this.generarPalabraHTML(actividad.id, palabra, index)).join('') 
                    : `
                        <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                            <i class="fas fa-search text-3xl mb-3 opacity-50"></i>
                            <p class="font-medium">No se detectaron espacios</p>
                            <p class="text-sm">Usa [[palabra]] en el texto para crear espacios faltantes</p>
                        </div>
                    `}
                </div>

                ${palabras.length > 0 ? `
                    <div class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div class="flex items-start gap-2">
                            <i class="fas fa-info-circle text-blue-500 mt-0.5"></i>
                            <p class="text-sm text-blue-700 dark:text-blue-300">
                                <strong>Tip:</strong> Las palabras se actualizan automáticamente en el texto cuando las modificas aquí.
                            </p>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    },

    generarPalabraHTML(actividadId, palabra, index) {
        return `
            <div class="palabra-item flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 transition-all hover:border-purple-300 dark:hover:border-purple-600">
                <!-- Número de espacio -->
                <div class="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center font-semibold text-purple-600 dark:text-purple-400 text-sm">
                    ${index + 1}
                </div>

                <!-- Palabra original (solo lectura) -->
                <div class="flex-1">
                    <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Espacio en el texto
                    </label>
                    <div class="px-3 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 font-mono text-sm text-gray-700 dark:text-gray-300">
                        [[${palabra}]]
                    </div>
                </div>

                <!-- Flecha indicadora -->
                <div class="text-gray-400 dark:text-gray-500">
                    <i class="fas fa-arrow-right"></i>
                </div>

                <!-- Campo de respuesta correcta -->
                <div class="flex-1">
                    <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Respuesta correcta
                    </label>
                    <input type="text" 
                           value="${palabra}" 
                           oninput="CompletarEspaciosManager.actualizarPalabra('${actividadId}', '${palabra}', this.value)"
                           placeholder="Escribe la respuesta correcta..."
                           class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all">
                </div>

                <!-- Controles -->
                <div class="flex items-center gap-1">
                    <button type="button" 
                            onclick="CompletarEspaciosManager.eliminarPalabra('${actividadId}', '${palabra}')"
                            class="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Eliminar este espacio">
                        <i class="fas fa-trash text-sm"></i>
                    </button>
                </div>
            </div>
        `;
    },

    generarSeccionPistas(actividad) {
        return `
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div class="flex items-center gap-2 mb-4">
                    <div class="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                        <i class="fas fa-hands-helping text-indigo-600 dark:text-indigo-400 text-sm"></i>
                    </div>
                    <h4 class="font-semibold text-gray-900 dark:text-white">Pistas y Ayudas</h4>
                </div>

                <div class="space-y-4">
                    <div class="flex items-center gap-3">
                        <input type="checkbox" 
                               ${actividad.contenido.pista_activada ? 'checked' : ''}
                               onchange="CompletarEspaciosManager.actualizarPistaActivada('${actividad.id}', this.checked)"
                               class="w-4 h-4 text-indigo-500 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded">
                        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Activar pista para estudiantes
                        </label>
                    </div>

                    ${actividad.contenido.pista_activada ? `
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Texto de la pista
                            </label>
                            <textarea oninput="CompletarEspaciosManager.actualizarPistaTexto('${actividad.id}', this.value)"
                                      placeholder="Proporciona una pista que ayude a completar los espacios..."
                                      class="w-full h-20 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none">${actividad.contenido.pista_texto || ''}</textarea>
                            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                💡 Esta pista se mostrará a los estudiantes si activan la ayuda
                            </p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    },

    generarSeccionConfiguracion(actividad) {
        return `
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div class="flex items-center gap-2 mb-4">
                    <div class="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <i class="fas fa-cog text-gray-600 dark:text-gray-400 text-sm"></i>
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
                               oninput="CompletarEspaciosManager.actualizarTiempoLimite('${actividad.id}', this.value ? parseInt(this.value) : null)"
                               placeholder="Sin límite"
                               class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Intentos permitidos
                        </label>
                        <select onchange="CompletarEspaciosManager.actualizarIntentos('${actividad.id}', parseInt(this.value))"
                                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent">
                            <option value="1" ${actividad.config.intentos_permitidos === 1 ? 'selected' : ''}>1 intento</option>
                            <option value="2" ${actividad.config.intentos_permitidos === 2 ? 'selected' : ''}>2 intentos</option>
                            <option value="3" ${actividad.config.intentos_permitidos === 3 ? 'selected' : ''}>3 intentos</option>
                            <option value="0" ${actividad.config.intentos_permitidos === 0 ? 'selected' : ''}>Intentos ilimitados</option>
                        </select>
                    </div>

                    <div class="flex items-center gap-3">
                        <input type="checkbox" 
                               ${actividad.config.mostrar_puntos ? 'checked' : ''}
                               onchange="CompletarEspaciosManager.actualizarMostrarPuntos('${actividad.id}', this.checked)"
                               class="w-4 h-4 text-yellow-500 focus:ring-yellow-500 border-gray-300 dark:border-gray-600 rounded">
                        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Mostrar puntos al estudiante
                        </label>
                    </div>

                    <div class="flex items-center gap-3">
                        <input type="checkbox" 
                               ${actividad.config.case_sensitive ? 'checked' : ''}
                               onchange="CompletarEspaciosManager.actualizarCaseSensitive('${actividad.id}', this.checked)"
                               class="w-4 h-4 text-yellow-500 focus:ring-yellow-500 border-gray-300 dark:border-gray-600 rounded">
                        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Distinguir mayúsculas/minúsculas
                        </label>
                    </div>

                    <div class="flex items-center gap-3">
                        <input type="checkbox" 
                               ${actividad.config.permitir_pistas ? 'checked' : ''}
                               onchange="CompletarEspaciosManager.actualizarPermitirPistas('${actividad.id}', this.checked)"
                               class="w-4 h-4 text-yellow-500 focus:ring-yellow-500 border-gray-300 dark:border-gray-600 rounded">
                        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Permitir pistas a estudiantes
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
                            Explicación de la actividad
                        </label>
                        <textarea oninput="CompletarEspaciosManager.actualizarExplicacion('${actividad.id}', this.value)"
                                  placeholder="Explica el contexto o proporciona información adicional sobre el texto..."
                                  class="w-full h-32 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none">${actividad.contenido.explicacion}</textarea>
                    </div>

                    <div class="flex items-center gap-3">
                        <input type="checkbox" 
                               ${actividad.config.mostrar_explicacion ? 'checked' : ''}
                               onchange="CompletarEspaciosManager.actualizarMostrarExplicacion('${actividad.id}', this.checked)"
                               class="w-4 h-4 text-orange-500 focus:ring-orange-500 border-gray-300 dark:border-gray-600 rounded">
                        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Mostrar explicación después de completar
                        </label>
                    </div>
                </div>
            </div>
        `;
    },

    // ========== FUNCIONES DE GESTIÓN ==========

    actualizarTexto(actividadId, texto) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            actividad.contenido.texto = texto;
        }
    },

    actualizarPalabrasFaltantes(actividadId) {
        const actividad = this.getActividad(actividadId);
        if (actividad && actividad.contenido.texto) {
            const texto = actividad.contenido.texto;
            const palabras = texto.match(/\[\[(.*?)\]\]/g) || [];
            const palabrasUnicas = [...new Set(palabras.map(p => p.replace(/\[\[|\]\]/g, '')))];
            
            actividad.contenido.palabras_faltantes = palabrasUnicas;
            window.leccionEditor.recargarActividad(actividadId);
            
            if (palabrasUnicas.length > 0) {
                window.leccionEditor.mostrarToast(`✅ ${palabrasUnicas.length} espacios detectados`, 'success');
            }
        }
    },

    actualizarPalabra(actividadId, palabraVieja, palabraNueva) {
        const actividad = this.getActividad(actividadId);
        if (actividad && actividad.contenido.palabras_faltantes) {
            // Actualizar en el array
            const index = actividad.contenido.palabras_faltantes.indexOf(palabraVieja);
            if (index !== -1) {
                actividad.contenido.palabras_faltantes[index] = palabraNueva;
            }
            
            // Actualizar en el texto
            if (actividad.contenido.texto) {
                actividad.contenido.texto = actividad.contenido.texto.replace(
                    new RegExp(`\\[\\[${this.escapeRegExp(palabraVieja)}\\]\\]`, 'g'), 
                    `[[${palabraNueva}]]`
                );
            }
        }
    },

    eliminarPalabra(actividadId, palabra) {
        const actividad = this.getActividad(actividadId);
        if (actividad && actividad.contenido.palabras_faltantes) {
            // Eliminar del array
            actividad.contenido.palabras_faltantes = actividad.contenido.palabras_faltantes.filter(p => p !== palabra);
            
            // Eliminar del texto
            if (actividad.contenido.texto) {
                actividad.contenido.texto = actividad.contenido.texto.replace(
                    new RegExp(`\\[\\[${this.escapeRegExp(palabra)}\\]\\]`, 'g'), 
                    palabra
                );
            }
            
            window.leccionEditor.recargarActividad(actividadId);
            window.leccionEditor.mostrarToast('🗑️ Espacio eliminado', 'success');
        }
    },

    actualizarExplicacion(actividadId, explicacion) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            actividad.contenido.explicacion = explicacion;
        }
    },

    // ========== FUNCIONES DE PISTAS ==========

    actualizarPistaActivada(actividadId, activada) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            actividad.contenido.pista_activada = activada;
            window.leccionEditor.recargarActividad(actividadId);
        }
    },

    actualizarPistaTexto(actividadId, texto) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            actividad.contenido.pista_texto = texto;
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

    actualizarMostrarPuntos(actividadId, mostrar) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            actividad.config.mostrar_puntos = mostrar;
        }
    },

    actualizarCaseSensitive(actividadId, caseSensitive) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            actividad.config.case_sensitive = caseSensitive;
        }
    },

    actualizarPermitirPistas(actividadId, permitir) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            actividad.config.permitir_pistas = permitir;
        }
    },

    actualizarMostrarExplicacion(actividadId, mostrar) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            actividad.config.mostrar_explicacion = mostrar;
        }
    },

    // ========== FUNCIONES DE IMÁGENES ==========

    agregarImagen(actividadId) {
        window.currentImageContext = { 
            actividadId, 
            tipo: 'texto',
            elemento: 'completar_espacios'
        };
        this.abrirSelectorImagen();
    },

    eliminarImagen(actividadId) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            actividad.contenido.imagen = null;
            window.leccionEditor.recargarActividad(actividadId);
            window.leccionEditor.mostrarToast('🗑️ Imagen eliminada', 'success');
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
        const { actividadId, tipo } = window.currentImageContext;

        const actividad = this.getActividad(actividadId);
        if (!actividad) return;

        if (tipo === 'texto') {
            actividad.contenido.imagen = imagenData;
        }

        window.leccionEditor.recargarActividad(actividadId);
    },

    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    },

    // ========== VALIDACIÓN ==========

    validar(actividad) {
        const errores = [];

        if (!actividad.contenido.texto || !actividad.contenido.texto.trim()) {
            errores.push('El texto con espacios es requerido');
        }

        const espaciosDetectados = (actividad.contenido.texto.match(/\[\[.*?\]\]/g) || []).length;
        if (espaciosDetectados === 0) {
            errores.push('Debe incluir al menos un espacio usando [[palabra]]');
        }

        if (actividad.contenido.palabras_faltantes.length === 0) {
            errores.push('No se detectaron palabras faltantes. Usa [[palabra]] en el texto.');
        }

        if (actividad.puntos < 1 || actividad.puntos > 100) {
            errores.push('Los puntos deben estar entre 1 y 100');
        }

        return errores;
    }
};

// ========== ESTILOS CSS MEJORADOS ==========
const injectCompletarEspaciosStyles = () => {
    const styles = `
        .palabra-item {
            transition: all 0.3s ease;
        }
        
        .palabra-item:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .completar-espacios-header {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: white;
        }
        
        .dark .completar-espacios-header {
            background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
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
        
        /* Estilos para el texto con espacios */
        .texto-con-espacios {
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            line-height: 1.6;
        }
        
        .espacio-faltante {
            background: #fef3c7;
            border: 1px dashed #d97706;
            border-radius: 4px;
            padding: 2px 6px;
            font-weight: 600;
            color: #92400e;
        }
        
        .dark .espacio-faltante {
            background: #78350f;
            border-color: #f59e0b;
            color: #fef3c7;
        }
        
        /* Animaciones */
        @keyframes highlight {
            0% { background-color: #fef3c7; }
            50% { background-color: #fde68a; }
            100% { background-color: #fef3c7; }
        }
        
        .palabra-item:nth-child(even) {
            background: #f8fafc;
        }
        
        .dark .palabra-item:nth-child(even) {
            background: #1f2937;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .palabra-item {
                flex-direction: column;
                align-items: flex-start;
                gap: 1rem;
            }
            
            .palabra-item > div:not(:first-child) {
                width: 100%;
            }
        }
        
        /* Mejoras de accesibilidad */
        .palabra-item:focus-within {
            outline: 2px solid #3b82f6;
            outline-offset: 2px;
        }
    `;

    if (!document.querySelector('#completar-espacios-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'completar-espacios-styles';
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }
};

// Inyectar estilos cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectCompletarEspaciosStyles);
} else {
    injectCompletarEspaciosStyles();
}

// Inicialización automática
console.log('✅ CompletarEspaciosManager mejorado cargado correctamente');