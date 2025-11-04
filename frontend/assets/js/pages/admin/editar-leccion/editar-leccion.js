/* ============================================
   SPEAKLEXI - EDITOR DE LECCIONES (ADMIN) CORREGIDO
   ============================================ */
(() => {
    'use strict';

    // Variables globales
    let editorQuill;
    let actividades = [];
    let archivosMultimedia = [];
    let leccionId = null;
    let autoSaveInterval;
    let leccionData = null;

    // Configuración
    const config = {
        autoSaveDelay: 30000,
        maxFileSize: 50 * 1024 * 1024,
        allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'audio/mp3', 'application/pdf']
    };

    // Inicialización principal
    async function init() {
        console.log('🚀 Iniciando Editor de Lección...');
        
        try {
            await waitForDependencies();
            
            // 🔍 DEBUG: Verificar configuración
            console.log('🔧 Configuración API:', {
                baseURL: window.apiClient?.baseURL,
                endpoints: window.APP_CONFIG?.API?.ENDPOINTS?.LECCIONES,
                token: localStorage.getItem('token')
            });
            
            if (!verificarPermisosAdmin()) {
                window.location.href = '/pages/auth/login.html';
                return;
            }
            
            inicializarEditor();
            inicializarQuill();
            setupEventListeners();
            
            // Verificar si estamos editando una lección existente
            const urlParams = new URLSearchParams(window.location.search);
            leccionId = urlParams.get('id');
            
            console.log('📋 Parámetros URL:', {
                leccionId: leccionId,
                urlCompleta: window.location.href
            });
            
            if (leccionId) {
                console.log('🔄 Cargando lección existente...');
                // Esperar a que todo esté listo
                await new Promise(resolve => setTimeout(resolve, 500));
                await cargarLeccionExistente(leccionId);
            } else {
                console.log('🆕 Creando nueva lección...');
                document.title = 'Crear Nueva Lección - SpeakLexi';
                actualizarProgreso();
            }
            
            iniciarAutoSave();
            console.log('✅ Editor de Lección inicializado completamente');
        } catch (error) {
            console.error('❌ Error en inicialización:', error);
            window.toastManager?.error('Error al inicializar el editor: ' + error.message);
        }
    }

    function inicializarEditor() {
        document.querySelectorAll('.editor-modulo').forEach((modulo, index) => {
            if (index === 0) {
                modulo.classList.add('active');
            }
        });
    }

    function inicializarQuill() {
        const editorElement = document.getElementById('editor-contenido');
        if (!editorElement) {
            console.warn('❌ Elemento editor-contenido no encontrado');
            return;
        }

        try {
            editorQuill = new Quill('#editor-contenido', {
                theme: 'snow',
                modules: {
                    toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'color': [] }, { 'background': [] }],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        ['link', 'image', 'video'],
                        ['clean']
                    ]
                },
                placeholder: 'Escribe el contenido de tu lección aquí...'
            });

            editorQuill.on('text-change', () => {
                marcarModuloCompletado('contenido');
                actualizarProgreso();
            });
            
            console.log('✅ Quill inicializado correctamente');
        } catch (error) {
            console.error('❌ Error inicializando Quill:', error);
        }
    }

    function setupEventListeners() {
        // Navegación entre módulos
        document.querySelectorAll('.badge-progreso').forEach(badge => {
            badge.addEventListener('click', (e) => {
                e.preventDefault();
                const etapa = badge.dataset.etapa;
                console.log('🎯 Navegando a módulo:', etapa);
                navegarAModulo(etapa);
            });
        });

        // Eventos de formulario
        document.querySelectorAll('#form-leccion input, #form-leccion select, #form-leccion textarea').forEach(input => {
            input.addEventListener('input', () => {
                if (['titulo', 'descripcion', 'nivel', 'idioma'].includes(input.name)) {
                    marcarModuloCompletado('info');
                }
                actualizarProgreso();
            });
        });

        // Botones principales
        document.getElementById('btn-agregar-actividad')?.addEventListener('click', mostrarModalTipoActividad);
        document.getElementById('btn-cancelar-tipo')?.addEventListener('click', ocultarModalTipoActividad);
        document.getElementById('btn-seleccionar-archivos')?.addEventListener('click', () => {
            document.getElementById('input-archivos').click();
        });
        document.getElementById('input-archivos')?.addEventListener('change', manejarSubidaArchivos);
        document.getElementById('btn-guardar-borrador')?.addEventListener('click', guardarBorrador);
        
        // Form submit
        const formLeccion = document.getElementById('form-leccion');
        if (formLeccion) {
            formLeccion.addEventListener('submit', (e) => {
                e.preventDefault();
                publicarLeccion(e);
            });
        }

        // Tipos de actividad
        document.querySelectorAll('.tipo-actividad-card').forEach(card => {
            card.addEventListener('click', () => crearNuevaActividad(card.dataset.tipo));
        });

        setupDragAndDrop();
    }

    function setupDragAndDrop() {
        const dropZone = document.getElementById('zona-upload');
        if (!dropZone) return;
        
        const preventDefaults = (e) => {
            e.preventDefault();
            e.stopPropagation();
        };
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('drag-over'), false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('drag-over'), false);
        });
        
        dropZone.addEventListener('drop', (e) => {
            manejarArchivosSeleccionados(e.dataTransfer.files);
        }, false);
    }

    // 🔧 CARGAR LECCIÓN EXISTENTE - VERSIÓN CORREGIDA
    async function cargarLeccionExistente(id) {
        try {
            console.log('📥 Cargando lección ID:', id);
            
            const endpoint = `/lecciones/${id}`;
            console.log('🔗 Endpoint:', endpoint);
            
            const response = await window.apiClient.get(endpoint);
            
            console.log('📦 Respuesta COMPLETA del servidor:', response);
            
            if (!response.success) {
                throw new Error(response.error || 'Error al cargar lección');
            }
            
            // 🔍 EXTRACCIÓN DE DATOS MEJORADA
            let datos = null;
            
            // Intento 1: response.data.data (estructura api-client)
            if (response.data && response.data.data && response.data.data.titulo) {
                datos = response.data.data;
                console.log('✅ Datos extraídos de: response.data.data');
            }
            // Intento 2: response.data directamente  
            else if (response.data && response.data.titulo) {
                datos = response.data;
                console.log('✅ Datos extraídos de: response.data');
            }
            // Intento 3: response directamente (fallback)
            else if (response.titulo) {
                datos = response;
                console.log('✅ Datos extraídos de: response');
            }
            
            if (!datos || !datos.titulo) {
                console.error('❌ No se encontraron datos válidos en:', response);
                throw new Error('Datos de lección inválidos o vacíos');
            }
            
            leccionData = datos;
            console.log('✅ Datos de lección cargados:', leccionData);
            
            // Esperar a que el DOM esté completamente listo
            await new Promise(resolve => setTimeout(resolve, 300));
            
            cargarDatosEnFormulario(leccionData);
            window.toastManager.success('Lección cargada exitosamente');
            
        } catch (error) {
            console.error('❌ Error cargando lección:', error);
            
            let mensajeError = 'Error al cargar la lección: ';
            if (error.message.includes('Network Error')) {
                mensajeError += 'No se pudo conectar al servidor';
            } else if (error.message.includes('404')) {
                mensajeError += 'Lección no encontrada';
            } else if (error.message.includes('500')) {
                mensajeError += 'Error interno del servidor';
            } else {
                mensajeError += error.message;
            }
            
            window.toastManager.error(mensajeError);
        }
    }

    function cargarDatosEnFormulario(leccion) {
        console.log('📝 Cargando datos en formulario:', leccion);
        
        if (!leccion) {
            console.error('❌ No hay datos de lección para cargar');
            return;
        }
        
        // 🔧 CARGAR CAMPOS DEL FORMULARIO
        const elementos = {
            titulo: document.querySelector('input[name="titulo"]'),
            descripcion: document.querySelector('textarea[name="descripcion"]'),
            idioma: document.querySelector('select[name="idioma"]'),
            nivel: document.querySelector('select[name="nivel"]'),
            duracion: document.querySelector('input[name="duracion_minutos"]'),
            orden: document.querySelector('input[name="orden"]')
        };
        
        console.log('📝 Elementos encontrados:', Object.keys(elementos).filter(k => elementos[k]));
        
        // Cargar valores en los campos
        if (elementos.titulo && leccion.titulo) {
            elementos.titulo.value = leccion.titulo;
            console.log('✅ Título cargado:', leccion.titulo);
        }
        if (elementos.descripcion && leccion.descripcion) {
            elementos.descripcion.value = leccion.descripcion;
            console.log('✅ Descripción cargada');
        }
        if (elementos.idioma && leccion.idioma) {
            elementos.idioma.value = leccion.idioma;
            console.log('✅ Idioma cargado:', leccion.idioma);
        }
        if (elementos.nivel && leccion.nivel) {
            elementos.nivel.value = leccion.nivel;
            console.log('✅ Nivel cargado:', leccion.nivel);
        }
        if (elementos.duracion) {
            elementos.duracion.value = leccion.duracion_minutos || 30;
            console.log('✅ Duración cargada:', elementos.duracion.value);
        }
        if (elementos.orden) {
            elementos.orden.value = leccion.orden || 0;
            console.log('✅ Orden cargado:', elementos.orden.value);
        }
        
        // Contenido en Quill
        if (leccion.contenido && editorQuill) {
            // Pequeño delay para asegurar que Quill esté listo
            setTimeout(() => {
                editorQuill.root.innerHTML = leccion.contenido;
                console.log('✅ Contenido cargado en Quill');
            }, 100);
        }
        
        // Actualizar título de página
        if (leccion.titulo) {
            document.title = `Editando: ${leccion.titulo} - SpeakLexi`;
        }
        
        // Marcar módulos completados
        if (leccion.titulo) marcarModuloCompletado('info');
        if (leccion.contenido) marcarModuloCompletado('contenido');
        
        actualizarProgreso();
        
        console.log('✅ Formulario completamente cargado');
    }

    function manejarSubidaArchivos(e) {
        manejarArchivosSeleccionados(e.target.files);
    }

    async function manejarArchivosSeleccionados(files) {
        if (!leccionId) {
            window.toastManager.warning('Guarda la lección primero antes de subir archivos');
            return;
        }

        for (let file of files) {
            if (!config.allowedFileTypes.includes(file.type)) {
                window.toastManager.error(`Tipo de archivo no permitido: ${file.type}`);
                continue;
            }

            if (file.size > config.maxFileSize) {
                window.toastManager.error(`Archivo demasiado grande: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
                continue;
            }

            try {
                const formData = new FormData();
                formData.append('archivo', file);
                formData.append('leccion_id', leccionId);

                const response = await window.apiClient.uploadFile('/multimedia/upload', formData);
                
                if (response.success) {
                    archivosMultimedia.push(response.data);
                    actualizarGaleriaMultimedia();
                    window.toastManager.success('Archivo subido exitosamente');
                } else {
                    throw new Error(response.error);
                }
            } catch (error) {
                console.error('Error subiendo archivo:', error);
                window.toastManager.error('Error al subir archivo');
            }
        }
    }

    function actualizarGaleriaMultimedia() {
        const galeria = document.getElementById('galeria-archivos');
        if (!galeria) return;

        if (archivosMultimedia.length === 0) {
            galeria.innerHTML = '';
            return;
        }

        galeria.innerHTML = archivosMultimedia.map(archivo => `
            <div class="archivo-item bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <div class="flex items-center gap-3">
                    <i class="fas fa-${obtenerIconoArchivo(archivo.tipo_archivo || archivo.tipo)} text-purple-500"></i>
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-900 dark:text-white truncate">${archivo.nombre_archivo || archivo.nombre}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">${formatearTamañoArchivo(archivo.tamaño)}</p>
                    </div>
                    <button onclick="eliminarArchivo('${archivo.id}')" class="text-red-500 hover:text-red-700">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');

        const contador = document.getElementById('contador-multimedia');
        if (contador) {
            contador.textContent = `${archivosMultimedia.length} archivo${archivosMultimedia.length !== 1 ? 's' : ''}`;
        }
        
        marcarModuloCompletado('multimedia');
        actualizarProgreso();
    }

    function obtenerIconoArchivo(tipo) {
        if (!tipo) return 'file';
        if (tipo.startsWith('image/')) return 'file-image';
        if (tipo.startsWith('video/')) return 'file-video';
        if (tipo.startsWith('audio/')) return 'file-audio';
        if (tipo === 'application/pdf') return 'file-pdf';
        return 'file';
    }

    function formatearTamañoArchivo(bytes) {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function mostrarModalTipoActividad() {
        const modal = document.getElementById('modal-tipo-actividad');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    }

    function ocultarModalTipoActividad() {
        const modal = document.getElementById('modal-tipo-actividad');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    }

    function crearNuevaActividad(tipo) {
        const nuevaActividad = {
            id: Date.now(),
            tipo: tipo,
            titulo: `Nueva actividad ${tipo.replace(/_/g, ' ')}`,
            pregunta: '',
            opciones: [],
            respuesta_correcta: '',
            puntaje: 10,
            orden: actividades.length + 1
        };
        
        actividades.push(nuevaActividad);
        actualizarListaActividades();
        marcarModuloCompletado('actividades');
        actualizarProgreso();
        ocultarModalTipoActividad();
        window.toastManager.success('Actividad creada');
    }

    function actualizarListaActividades() {
        const lista = document.getElementById('lista-actividades');
        const placeholder = document.getElementById('placeholder-actividades');
        
        if (!lista) return;

        if (actividades.length === 0) {
            if (placeholder) placeholder.style.display = 'block';
            lista.innerHTML = '';
        } else {
            if (placeholder) placeholder.style.display = 'none';
            
            lista.innerHTML = actividades.map(actividad => `
                <div class="actividad-item bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <i class="fas fa-${obtenerIconoActividad(actividad.tipo)} text-purple-500"></i>
                            <div>
                                <h4 class="font-semibold text-gray-900 dark:text-white">${actividad.titulo}</h4>
                                <p class="text-sm text-gray-600 dark:text-gray-400">${actividad.tipo.replace(/_/g, ' ')} - ${actividad.puntaje} puntos</p>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="editarActividad(${actividad.id})" class="text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="eliminarActividad(${actividad.id})" class="text-red-600 hover:text-red-800 p-2 rounded hover:bg-red-50">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        actualizarContadorActividades();
    }

    function obtenerIconoActividad(tipo) {
        const icons = {
            seleccion_multiple: 'list-ul',
            verdadero_falso: 'check-circle',
            completar_espacios: 'edit',
            emparejamiento: 'object-group',
            escritura: 'keyboard'
        };
        return icons[tipo] || 'puzzle-piece';
    }

    async function guardarBorrador(e) {
        if (e) e.preventDefault();
        await guardarLeccion('borrador');
    }

    async function publicarLeccion(e) {
        if (e) e.preventDefault();
        
        const titulo = document.querySelector('input[name="titulo"]')?.value;
        if (!titulo) {
            window.toastManager.error('El título es obligatorio');
            return;
        }
        
        await guardarLeccion('activa');
    }

    async function guardarLeccion(estado = 'borrador') {
        try {
            const formData = new FormData(document.getElementById('form-leccion'));
            const contenido = editorQuill ? editorQuill.root.innerHTML : '';

            const datosLeccion = {
                titulo: formData.get('titulo'),
                descripcion: formData.get('descripcion') || '',
                nivel: formData.get('nivel'),
                idioma: formData.get('idioma'),
                duracion_minutos: parseInt(formData.get('duracion_minutos') || 30),
                orden: parseInt(formData.get('orden') || 0),
                contenido: contenido,
                estado: estado
            };

            console.log('💾 Guardando lección:', datosLeccion);

            let response;
            const endpoint = window.APP_CONFIG?.API?.ENDPOINTS?.LECCIONES;
            
            if (leccionId) {
                const url = `/lecciones/${leccionId}`;
                response = await window.apiClient.put(url, datosLeccion);
            } else {
                const url = '/lecciones';
                response = await window.apiClient.post(url, datosLeccion);
            }

            console.log('📦 Respuesta guardar:', response);

            if (response.success) {
                const mensaje = estado === 'activa' ? 'Lección publicada exitosamente' : 'Borrador guardado exitosamente';
                window.toastManager.success(mensaje);
                
                if (!leccionId) {
                    const serverData = response.data;
                    const nuevoId = serverData.data?.id || serverData.data?.leccion_id || serverData.id || serverData.leccion_id;
                    
                    if (nuevoId) {
                        leccionId = nuevoId;
                        console.log('✅ Lección creada con ID:', leccionId);
                        window.history.replaceState({}, '', `?id=${leccionId}`);
                    }
                }
                
                if (estado === 'activa') {
                    setTimeout(() => {
                        window.location.href = '/pages/admin/gestion-lecciones.html';
                    }, 1500);
                }
            } else {
                throw new Error(response.error || 'Error al guardar');
            }
        } catch (error) {
            console.error('❌ Error guardando lección:', error);
            window.toastManager.error('Error al guardar la lección: ' + error.message);
        }
    }

    function iniciarAutoSave() {
        autoSaveInterval = setInterval(() => {
            const titulo = document.querySelector('input[name="titulo"]')?.value;
            if (leccionId && titulo) {
                console.log('💾 Auto-guardado...');
                guardarBorrador();
            }
        }, config.autoSaveDelay);
    }

    function actualizarContadorActividades() {
        const contador = document.getElementById('contador-actividades');
        if (contador) {
            contador.textContent = `${actividades.length} actividad${actividades.length !== 1 ? 'es' : ''}`;
        }
    }

    function actualizarProgreso() {
        const progresoBar = document.getElementById('progreso-bar');
        const progresoPorcentaje = document.getElementById('progreso-porcentaje');
        
        if (!progresoBar || !progresoPorcentaje) return;
        
        let progreso = 0;
        const titulo = document.querySelector('input[name="titulo"]')?.value;
        const contenido = editorQuill?.getText().trim();
        
        if (titulo) progreso += 25;
        if (contenido && contenido.length > 10) progreso += 25;
        if (actividades.length > 0) progreso += 25;
        if (archivosMultimedia.length > 0) progreso += 25;
        
        progresoBar.style.width = `${progreso}%`;
        progresoPorcentaje.textContent = `${progreso}%`;
    }

    function marcarModuloCompletado(modulo) {
        const badge = document.querySelector(`.badge-progreso[data-etapa="${modulo}"]`);
        if (badge) badge.classList.add('completado');
    }

    function navegarAModulo(modulo) {
        document.querySelectorAll('.editor-modulo').forEach(mod => {
            mod.classList.remove('active');
        });
        document.getElementById(`modulo-${modulo}`)?.classList.add('active');
    }

    // Funciones globales para los botones
    function eliminarActividad(id) {
        if (confirm('¿Estás seguro de eliminar esta actividad?')) {
            actividades = actividades.filter(a => a.id != id);
            actualizarListaActividades();
            actualizarProgreso();
            window.toastManager.success('Actividad eliminada');
        }
    }

    function editarActividad(id) {
        window.toastManager.info('Funcionalidad de edición en desarrollo');
    }

    function eliminarArchivo(id) {
        if (confirm('¿Estás seguro de eliminar este archivo?')) {
            archivosMultimedia = archivosMultimedia.filter(a => a.id != id);
            actualizarGaleriaMultimedia();
            window.toastManager.success('Archivo eliminado');
        }
    }

    async function waitForDependencies() {
        const dependencies = ['apiClient', 'toastManager', 'APP_CONFIG', 'Quill'];
        const maxWaitTime = 10000; // 10 segundos
        const startTime = Date.now();
        
        while (dependencies.some(dep => !window[dep])) {
            if (Date.now() - startTime > maxWaitTime) {
                console.error('❌ Timeout esperando dependencias:', dependencies.filter(dep => !window[dep]));
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log('✅ Dependencias cargadas:', dependencies.filter(dep => window[dep]));
    }

    function verificarPermisosAdmin() {
        try {
            const usuario = window.Utils?.getFromStorage(window.APP_CONFIG?.STORAGE?.KEYS?.USUARIO) || 
                           JSON.parse(localStorage.getItem('usuario') || '{}');
            const token = localStorage.getItem('token');
            
            if (!token) {
                window.toastManager?.error('Debes iniciar sesión');
                return false;
            }
            
            const rol = (usuario.rol || usuario.role || '').toLowerCase();
            if (!['admin', 'administrador', 'profesor'].includes(rol)) {
                window.toastManager?.error('No tienes permisos para esta página');
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('Error verificando permisos:', error);
            return false;
        }
    }

    window.addEventListener('beforeunload', () => {
        if (autoSaveInterval) clearInterval(autoSaveInterval);
    });

    // Exportar funciones globalmente
    window.editorLeccion = {
        getLeccionId: () => leccionId,
        getLeccionData: () => leccionData,
        actualizarProgreso: () => actualizarProgreso()
    };

    // Inicialización
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 100);
    }

})();