/* ============================================
   SPEAKLEXI - EDITOR LECCIÓN - VERDADERO/FALSO MEJORADO
   Diseño moderno tipo Duolingo con mejor UX/UI
   ============================================ */

// Manager mejorado para actividades de verdadero/falso
window.VerdaderoFalsoManager = {
    crear() {
        return {
            id: 'actividad_' + Date.now(),
            tipo: 'verdadero_falso',
            titulo: 'Nueva Actividad Verdadero/Falso',
            puntos: 10,
            orden: 0,
            contenido: {
                afirmacion: "",
                respuesta_correcta: true,
                explicacion: "",
                imagen: null,
                tiempoSugerido: 45
            },
            config: {
                tiempo_limite: null,
                intentos_permitidos: 1,
                mostrar_explicacion: true,
                mostrar_puntos: true,
                retroalimentacion_inmediata: true
            }
        };
    },

    generarCampos(actividad) {
        return `
            <div class="space-y-6">
                ${this.generarHeaderActividad(actividad)}
                ${this.generarSeccionAfirmacion(actividad)}
                ${this.generarSeccionRespuesta(actividad)}
                ${this.generarSeccionConfiguracion(actividad)}
                ${this.generarSeccionExplicacion(actividad)}
            </div>
        `;
    },

    generarHeaderActividad(actividad) {
        return `
            <div class="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl border border-green-200 dark:border-green-800">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center shadow-sm border border-green-200 dark:border-green-700">
                        <i class="fas fa-check-circle text-green-600 dark:text-green-400 text-lg"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-gray-900 dark:text-white">Verdadero/Falso</h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400">Crea afirmaciones para evaluar comprensión</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <span class="px-3 py-1 bg-white dark:bg-gray-800 text-green-600 dark:text-green-400 rounded-full text-sm font-medium border border-green-200 dark:border-green-700">
                        ${actividad.puntos} pts
                    </span>
                </div>
            </div>
        `;
    },

    generarSeccionAfirmacion(actividad) {
        const tieneImagen = actividad.contenido.imagen;
        
        return `
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div class="flex items-center gap-2 mb-4">
                    <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <i class="fas fa-quote-left text-blue-600 dark:text-blue-400 text-sm"></i>
                    </div>
                    <h4 class="font-semibold text-gray-900 dark:text-white">Afirmación Principal</h4>
                </div>

                <!-- Imagen de la afirmación -->
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Imagen de apoyo (opcional)
                    </label>
                    ${tieneImagen ? `
                        <div class="relative inline-block">
                            <div class="image-preview-card">
                                <img src="${actividad.contenido.imagen.url}" alt="Imagen de afirmación" 
                                     class="rounded-lg border-2 border-green-200 dark:border-green-800 max-w-xs">
                                <button type="button" 
                                        onclick="VerdaderoFalsoManager.eliminarImagen('${actividad.id}')"
                                        class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors shadow-lg">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                    ` : `
                        <div class="flex gap-2">
                            <button type="button" 
                                    onclick="VerdaderoFalsoManager.agregarImagen('${actividad.id}')"
                                    class="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl transition-colors border border-gray-300 dark:border-gray-600">
                                <i class="fas fa-image text-green-500"></i>
                                Agregar imagen
                            </button>
                        </div>
                    `}
                </div>

                <!-- Campo de afirmación -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Afirmación *
                    </label>
                    <textarea oninput="VerdaderoFalsoManager.actualizarAfirmacion('${actividad.id}', this.value)"
                              placeholder="Escribe una afirmación clara y verificable..."
                              class="w-full h-24 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none">${actividad.contenido.afirmacion}</textarea>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        💡 La afirmación debe ser claramente verdadera o falsa, sin ambigüedades
                    </p>
                </div>
            </div>
        `;
    },

    generarSeccionRespuesta(actividad) {
        const esVerdadero = actividad.contenido.respuesta_correcta === true;
        
        return `
            <div class="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div class="flex items-center gap-2 mb-4">
                    <div class="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                        <i class="fas fa-bullseye text-purple-600 dark:text-purple-400 text-sm"></i>
                    </div>
                    <h4 class="font-semibold text-gray-900 dark:text-white">Respuesta Correcta</h4>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Opción Verdadero -->
                    <div class="respuesta-opcion ${esVerdadero ? 'respuesta-seleccionada' : ''}" 
                         onclick="VerdaderoFalsoManager.seleccionarRespuesta('${actividad.id}', true)">
                        <div class="flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer
                                    ${esVerdadero ? 
                                        'border-green-500 bg-green-50 dark:bg-green-900/20' : 
                                        'border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-700'}">
                            <div class="w-12 h-12 rounded-xl flex items-center justify-center
                                        ${esVerdadero ? 
                                            'bg-green-500 text-white' : 
                                            'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}">
                                <i class="fas fa-check text-lg"></i>
                            </div>
                            <div class="flex-1">
                                <h5 class="font-semibold ${esVerdadero ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}">
                                    Verdadero
                                </h5>
                                <p class="text-sm ${esVerdadero ? 'text-green-600 dark:text-green-300' : 'text-gray-500 dark:text-gray-400'}">
                                    La afirmación es correcta
                                </p>
                            </div>
                            ${esVerdadero ? `
                                <div class="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                    <i class="fas fa-check text-white text-xs"></i>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Opción Falso -->
                    <div class="respuesta-opcion ${!esVerdadero ? 'respuesta-seleccionada' : ''}" 
                         onclick="VerdaderoFalsoManager.seleccionarRespuesta('${actividad.id}', false)">
                        <div class="flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer
                                    ${!esVerdadero ? 
                                        'border-red-500 bg-red-50 dark:bg-red-900/20' : 
                                        'border-gray-200 dark:border-gray-600 hover:border-red-300 dark:hover:border-red-700'}">
                            <div class="w-12 h-12 rounded-xl flex items-center justify-center
                                        ${!esVerdadero ? 
                                            'bg-red-500 text-white' : 
                                            'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}">
                                <i class="fas fa-times text-lg"></i>
                            </div>
                            <div class="flex-1">
                                <h5 class="font-semibold ${!esVerdadero ? 'text-red-700 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}">
                                    Falso
                                </h5>
                                <p class="text-sm ${!esVerdadero ? 'text-red-600 dark:text-red-300' : 'text-gray-500 dark:text-gray-400'}">
                                    La afirmación es incorrecta
                                </p>
                            </div>
                            ${!esVerdadero ? `
                                <div class="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                                    <i class="fas fa-check text-white text-xs"></i>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>

                <div class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div class="flex items-start gap-2">
                        <i class="fas fa-lightbulb text-blue-500 mt-0.5"></i>
                        <p class="text-sm text-blue-700 dark:text-blue-300">
                            <strong>Tip:</strong> Selecciona "Verdadero" si la afirmación es completamente correcta, 
                            o "Falso" si contiene algún error o imprecisión.
                        </p>
                    </div>
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
                               oninput="VerdaderoFalsoManager.actualizarTiempoLimite('${actividad.id}', this.value ? parseInt(this.value) : null)"
                               placeholder="Sin límite"
                               class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Intentos permitidos
                        </label>
                        <select onchange="VerdaderoFalsoManager.actualizarIntentos('${actividad.id}', parseInt(this.value))"
                                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent">
                            <option value="1" ${actividad.config.intentos_permitidos === 1 ? 'selected' : ''}>1 intento</option>
                            <option value="2" ${actividad.config.intentos_permitidos === 2 ? 'selected' : ''}>2 intentos</option>
                            <option value="3" ${actividad.config.intentos_permitidos === 3 ? 'selected' : ''}>3 intentos</option>
                            <option value="0" ${actividad.config.intentos_permitidos === 0 ? 'selected' : ''}>Intentos ilimitados</option>
                        </select>
                    </div>

                    <div class="flex items-center gap-3">
                        <input type="checkbox" 
                               ${actividad.config.mostrar_puntos ? 'checked' : ''}
                               onchange="VerdaderoFalsoManager.actualizarMostrarPuntos('${actividad.id}', this.checked)"
                               class="w-4 h-4 text-green-500 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded">
                        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Mostrar puntos al estudiante
                        </label>
                    </div>

                    <div class="flex items-center gap-3">
                        <input type="checkbox" 
                               ${actividad.config.retroalimentacion_inmediata ? 'checked' : ''}
                               onchange="VerdaderoFalsoManager.actualizarRetroalimentacion('${actividad.id}', this.checked)"
                               class="w-4 h-4 text-green-500 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded">
                        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Retroalimentación inmediata
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
                            Explicación de la respuesta
                        </label>
                        <textarea oninput="VerdaderoFalsoManager.actualizarExplicacion('${actividad.id}', this.value)"
                                  placeholder="Explica por qué la afirmación es verdadera o falsa..."
                                  class="w-full h-32 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none">${actividad.contenido.explicacion}</textarea>
                        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            💡 Esta explicación se mostrará al estudiante después de responder
                        </p>
                    </div>

                    <div class="flex items-center gap-3">
                        <input type="checkbox" 
                               ${actividad.config.mostrar_explicacion ? 'checked' : ''}
                               onchange="VerdaderoFalsoManager.actualizarMostrarExplicacion('${actividad.id}', this.checked)"
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

    seleccionarRespuesta(actividadId, respuesta) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            actividad.contenido.respuesta_correcta = respuesta;
            window.leccionEditor.recargarActividad(actividadId);
            
            const mensaje = respuesta ? 
                '✅ Respuesta correcta establecida: Verdadero' : 
                '✅ Respuesta correcta establecida: Falso';
            window.leccionEditor.mostrarToast(mensaje, 'success');
        }
    },

    actualizarAfirmacion(actividadId, afirmacion) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            actividad.contenido.afirmacion = afirmacion;
        }
    },

    actualizarExplicacion(actividadId, explicacion) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            actividad.contenido.explicacion = explicacion;
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

    actualizarRetroalimentacion(actividadId, retroalimentacion) {
        const actividad = this.getActividad(actividadId);
        if (actividad) {
            actividad.config.retroalimentacion_inmediata = retroalimentacion;
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
            tipo: 'afirmacion',
            elemento: 'verdadero_falso'
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
        const { actividadId, tipo } = window.currentImageContext;

        const actividad = this.getActividad(actividadId);
        if (!actividad) return;

        if (tipo === 'afirmacion') {
            actividad.contenido.imagen = imagenData;
        }

        window.leccionEditor.recargarActividad(actividadId);
    },

    // ========== VALIDACIÓN ==========

    validar(actividad) {
        const errores = [];

        if (!actividad.contenido.afirmacion || !actividad.contenido.afirmacion.trim()) {
            errores.push('La afirmación es requerida');
        }

        if (actividad.contenido.respuesta_correcta === undefined || actividad.contenido.respuesta_correcta === null) {
            errores.push('Debe seleccionar una respuesta correcta');
        }

        if (actividad.puntos < 1 || actividad.puntos > 100) {
            errores.push('Los puntos deben estar entre 1 y 100');
        }

        return errores;
    }
};

// ========== ESTILOS CSS MEJORADOS ==========
const injectVerdaderoFalsoStyles = () => {
    const styles = `
        .respuesta-opcion {
            transition: all 0.3s ease;
            cursor: pointer;
        }
        
        .respuesta-opcion:hover {
            transform: translateY(-2px);
        }
        
        .respuesta-seleccionada {
            transform: scale(1.02);
        }
        
        .respuesta-seleccionada .respuesta-content {
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }
        
        .verdadero-falso-header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
        }
        
        .dark .verdadero-falso-header {
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
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
        
        /* Animaciones específicas para verdadero/falso */
        @keyframes pulseCorrect {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        
        .respuesta-seleccionada {
            animation: pulseCorrect 0.6s ease-in-out;
        }
        
        /* Estados de hover mejorados */
        .respuesta-opcion:hover .respuesta-content {
            border-color: #d1fae5;
        }
        
        .dark .respuesta-opcion:hover .respuesta-content {
            border-color: #065f46;
        }
        
        /* Indicadores visuales */
        .indicador-verdadero {
            background: linear-gradient(135deg, #10b981, #34d399);
        }
        
        .indicador-falso {
            background: linear-gradient(135deg, #ef4444, #f87171);
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .respuesta-opcion {
                margin-bottom: 1rem;
            }
            
            .image-preview-card img {
                max-width: 150px;
                max-height: 120px;
            }
        }
        
        /* Mejoras de accesibilidad */
        .respuesta-opcion:focus {
            outline: 2px solid #3b82f6;
            outline-offset: 2px;
        }
        
        /* Transiciones suaves */
        .respuesta-content {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
    `;

    if (!document.querySelector('#verdadero-falso-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'verdadero-falso-styles';
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }
};

// Inyectar estilos cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectVerdaderoFalsoStyles);
} else {
    injectVerdaderoFalsoStyles();
}

// Inicialización automática
console.log('✅ VerdaderoFalsoManager mejorado cargado correctamente');