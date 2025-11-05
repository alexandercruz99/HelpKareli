/* ============================================
   SPEAKLEXI - VISTA PREVIA DE LECCIÓN
   ============================================ */

(function() {
    'use strict';

    window.LeccionPreview = {
        /**
         * Muestra una ventana modal con la vista previa de la lección
         * @param {Object} leccionData - Datos de la lección
         */
        mostrar: function(leccionData) {
            const modal = document.createElement('div');
            modal.className = 'preview-modal fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-[9999]';
            
            modal.innerHTML = `
                <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
                    <!-- Header -->
                    <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                                <i class="fas fa-eye text-purple-600 dark:text-purple-400"></i>
                            </div>
                            <div>
                                <h3 class="text-xl font-bold text-gray-900 dark:text-white">Vista Previa</h3>
                                <p class="text-gray-600 dark:text-gray-400">Previsualización de la lección</p>
                            </div>
                        </div>
                        <button class="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors" id="cerrar-preview">
                            <i class="fas fa-times text-2xl"></i>
                        </button>
                    </div>
                    
                    <!-- Contenido -->
                    <div class="flex-1 overflow-y-auto p-6">
                        <!-- Header de la lección -->
                        <div class="text-center mb-8">
                            <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">${this.escapeHtml(leccionData.titulo || 'Sin título')}</h1>
                            ${leccionData.descripcion ? `
                                <p class="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">${this.escapeHtml(leccionData.descripcion)}</p>
                            ` : ''}
                            <div class="flex justify-center gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
                                ${leccionData.nivel ? `<span><i class="fas fa-chart-line mr-1"></i> ${leccionData.nivel}</span>` : ''}
                                ${leccionData.idioma ? `<span><i class="fas fa-language mr-1"></i> ${leccionData.idioma}</span>` : ''}
                                ${leccionData.duracion_minutos ? `<span><i class="fas fa-clock mr-1"></i> ${leccionData.duracion_minutos} min</span>` : ''}
                            </div>
                        </div>
                        
                        <!-- Contenido principal -->
                        ${leccionData.contenido ? `
                            <div class="prose dark:prose-invert max-w-none mb-8">
                                <div class="ql-editor">${leccionData.contenido}</div>
                            </div>
                        ` : `
                            <div class="text-center py-12 text-gray-500 dark:text-gray-400">
                                <i class="fas fa-file-alt text-4xl mb-4 opacity-50"></i>
                                <p class="text-lg">No hay contenido para mostrar</p>
                                <p class="text-sm">Agrega contenido en el editor</p>
                            </div>
                        `}
                        
                        <!-- Actividades -->
                        ${leccionData.actividades && leccionData.actividades.length > 0 ? `
                            <div class="mb-8">
                                <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                                    <i class="fas fa-puzzle-piece text-purple-500"></i>
                                    Actividades (${leccionData.actividades.length})
                                </h2>
                                <div class="space-y-4">
                                    ${leccionData.actividades.map((actividad, index) => this.generarVistaActividad(actividad, index)).join('')}
                                </div>
                            </div>
                        ` : ''}
                        
                        <!-- Multimedia -->
                        ${leccionData.multimedia && leccionData.multimedia.length > 0 ? `
                            <div class="mb-8">
                                <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                                    <i class="fas fa-images text-purple-500"></i>
                                    Recursos Multimedia (${leccionData.multimedia.length})
                                </h2>
                                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    ${leccionData.multimedia.map(archivo => this.generarVistaMultimedia(archivo)).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    
                    <!-- Footer -->
                    <div class="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                        <button class="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors" id="btn-cerrar-preview">
                            Cerrar
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Event listeners
            document.getElementById('cerrar-preview').addEventListener('click', () => this.cerrar(modal));
            document.getElementById('btn-cerrar-preview').addEventListener('click', () => this.cerrar(modal));
            
            // Cerrar con ESC
            const keyHandler = (e) => {
                if (e.key === 'Escape') this.cerrar(modal);
            };
            document.addEventListener('keydown', keyHandler);
            
            modal._keyHandler = keyHandler;
        },
        
        /**
         * Genera la vista de una actividad
         */
        generarVistaActividad: function(actividad, index) {
            let contenidoActividad = '';
            
            switch (actividad.tipo) {
                case 'seleccion_multiple':
                    contenidoActividad = this.generarSeleccionMultiple(actividad);
                    break;
                case 'verdadero_falso':
                    contenidoActividad = this.generarVerdaderoFalso(actividad);
                    break;
                case 'completar_espacios':
                    contenidoActividad = this.generarCompletarEspacios(actividad);
                    break;
                case 'emparejamiento':
                    contenidoActividad = this.generarEmparejamiento(actividad);
                    break;
                default:
                    contenidoActividad = this.generarActividadGeneral(actividad);
            }
            
            return `
                <div class="actividad-preview bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                            Actividad ${index + 1}: ${this.escapeHtml(actividad.titulo || 'Sin título')}
                        </h3>
                        <span class="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full text-sm font-medium capitalize">
                            ${actividad.tipo || 'general'}
                        </span>
                    </div>
                    
                    ${actividad.descripcion ? `
                        <p class="text-gray-600 dark:text-gray-400 mb-4">${this.escapeHtml(actividad.descripcion)}</p>
                    ` : ''}
                    
                    ${contenidoActividad}
                </div>
            `;
        },
        
        /**
         * Genera vista para selección múltiple
         */
        generarSeleccionMultiple: function(actividad) {
            return `
                <div class="space-y-3">
                    ${actividad.pregunta ? `
                        <p class="font-medium text-gray-900 dark:text-white">${this.escapeHtml(actividad.pregunta)}</p>
                    ` : ''}
                    
                    ${actividad.opciones && actividad.opciones.length > 0 ? `
                        <div class="space-y-2">
                            ${actividad.opciones.map((opcion, i) => `
                                <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-500">
                                    <div class="w-6 h-6 flex items-center justify-center border-2 rounded-full 
                                                ${opcion.correcta ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300 dark:border-gray-400'}">
                                        ${String.fromCharCode(65 + i)}
                                    </div>
                                    <span class="text-gray-700 dark:text-gray-300">${this.escapeHtml(opcion.texto)}</span>
                                    ${opcion.correcta ? `
                                        <i class="fas fa-check text-green-500 ml-auto"></i>
                                    ` : ''}
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        },
        
        /**
         * Genera vista para verdadero/falso
         */
        generarVerdaderoFalso: function(actividad) {
            return `
                <div class="space-y-4">
                    ${actividad.afirmacion ? `
                        <p class="font-medium text-gray-900 dark:text-white">${this.escapeHtml(actividad.afirmacion)}</p>
                    ` : ''}
                    
                    <div class="flex gap-4">
                        <div class="flex-1 text-center p-4 rounded-lg border-2 ${
                            actividad.respuesta_correcta ? 
                            'border-green-500 bg-green-50 dark:bg-green-900/20' : 
                            'border-gray-200 dark:border-gray-600'
                        }">
                            <i class="fas fa-check text-2xl ${
                                actividad.respuesta_correcta ? 'text-green-500' : 'text-gray-400'
                            } mb-2"></i>
                            <p class="font-semibold ${
                                actividad.respuesta_correcta ? 'text-green-700 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'
                            }">Verdadero</p>
                        </div>
                        
                        <div class="flex-1 text-center p-4 rounded-lg border-2 ${
                            !actividad.respuesta_correcta ? 
                            'border-red-500 bg-red-50 dark:bg-red-900/20' : 
                            'border-gray-200 dark:border-gray-600'
                        }">
                            <i class="fas fa-times text-2xl ${
                                !actividad.respuesta_correcta ? 'text-red-500' : 'text-gray-400'
                            } mb-2"></i>
                            <p class="font-semibold ${
                                !actividad.respuesta_correcta ? 'text-red-700 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
                            }">Falso</p>
                        </div>
                    </div>
                </div>
            `;
        },
        
        /**
         * Genera vista para completar espacios
         */
        generarCompletarEspacios: function(actividad) {
            return `
                <div class="space-y-3">
                    ${actividad.texto ? `
                        <div class="p-4 bg-gray-50 dark:bg-gray-600 rounded-lg">
                            <p class="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">${this.escapeHtml(actividad.texto)}</p>
                        </div>
                    ` : ''}
                    
                    ${actividad.espacios && actividad.espacios.length > 0 ? `
                        <div class="space-y-2">
                            <p class="font-medium text-gray-900 dark:text-white">Respuestas:</p>
                            ${actividad.espacios.map((espacio, i) => `
                                <div class="flex items-center gap-3 p-2">
                                    <span class="text-sm text-gray-500 dark:text-gray-400">${i + 1}.</span>
                                    <span class="text-gray-700 dark:text-gray-300">${this.escapeHtml(espacio.respuesta)}</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        },
        
        /**
         * Genera vista para emparejamiento
         */
        generarEmparejamiento: function(actividad) {
            return `
                <div class="space-y-4">
                    ${actividad.instrucciones ? `
                        <p class="text-gray-600 dark:text-gray-400">${this.escapeHtml(actividad.instrucciones)}</p>
                    ` : ''}
                    
                    ${actividad.emparejamientos && actividad.emparejamientos.length > 0 ? `
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <p class="font-medium text-gray-900 dark:text-white">Columnas</p>
                                ${actividad.emparejamientos.map(emparejamiento => `
                                    <div class="p-3 bg-gray-50 dark:bg-gray-600 rounded border">
                                        <span class="text-gray-700 dark:text-gray-300">${this.escapeHtml(emparejamiento.columna_a)}</span>
                                    </div>
                                `).join('')}
                            </div>
                            
                            <div class="space-y-2">
                                <p class="font-medium text-gray-900 dark:text-white">Respuestas</p>
                                ${actividad.emparejamientos.map(emparejamiento => `
                                    <div class="p-3 bg-gray-50 dark:bg-gray-600 rounded border">
                                        <span class="text-gray-700 dark:text-gray-300">${this.escapeHtml(emparejamiento.columna_b)}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        },
        
        /**
         * Genera vista para actividad general
         */
        generarActividadGeneral: function(actividad) {
            return `
                <div class="space-y-3">
                    ${actividad.contenido ? `
                        <div class="ql-editor">${actividad.contenido}</div>
                    ` : ''}
                    
                    ${actividad.instrucciones ? `
                        <p class="text-gray-600 dark:text-gray-400">${this.escapeHtml(actividad.instrucciones)}</p>
                    ` : ''}
                </div>
            `;
        },
        
        /**
         * Genera vista para archivo multimedia
         */
        generarVistaMultimedia: function(archivo) {
            const icono = this.obtenerIconoArchivo(archivo.tipo_archivo || archivo.tipo);
            const nombre = archivo.nombre_archivo || archivo.nombre || 'Archivo sin nombre';
            const tamaño = this.formatearTamañoArchivo(archivo.tamaño);
            
            return `
                <div class="multimedia-preview bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4">
                    <div class="flex items-center gap-3">
                        <i class="fas fa-${icono} text-purple-500 text-xl"></i>
                        <div class="flex-1 min-w-0">
                            <p class="font-medium text-gray-900 dark:text-white truncate">${this.escapeHtml(nombre)}</p>
                            <p class="text-sm text-gray-500 dark:text-gray-400">${tamaño}</p>
                        </div>
                    </div>
                </div>
            `;
        },
        
        /**
         * Obtiene icono según tipo de archivo
         */
        obtenerIconoArchivo: function(tipo) {
            if (!tipo) return 'file';
            if (tipo.startsWith('image/')) return 'file-image';
            if (tipo.startsWith('video/')) return 'file-video';
            if (tipo.startsWith('audio/')) return 'file-audio';
            if (tipo === 'application/pdf') return 'file-pdf';
            return 'file';
        },
        
        /**
         * Formatea tamaño de archivo
         */
        formatearTamañoArchivo: function(bytes) {
            if (!bytes || bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        },
        
        /**
         * Cierra el modal de vista previa
         */
        cerrar: function(modal) {
            if (modal && modal._keyHandler) {
                document.removeEventListener('keydown', modal._keyHandler);
            }
            if (modal) {
                modal.remove();
            }
        },
        
        /**
         * Escapa HTML para prevenir XSS
         */
        escapeHtml: function(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    };

    console.log('✅ Módulo de vista previa cargado');
})();