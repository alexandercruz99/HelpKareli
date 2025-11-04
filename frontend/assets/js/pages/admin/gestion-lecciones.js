/* ============================================
   SPEAKLEXI - GESTIÓN DE LECCIONES (ADMIN) CORREGIDO
   Archivo: assets/js/pages/admin/gestion-lecciones.js
   ============================================ */
(() => {
    'use strict';

    let leccionesData = [];
    let paginaActual = 1;
    const leccionesPorPagina = 10;

    async function init() {
        console.log('🚀 Iniciando Gestión de Lecciones...');
        
        await waitForDependencies();
        
        if (!verificarPermisosAdmin()) {
            return;
        }
        
        setupEventListeners();
        await cargarLecciones();
        
        console.log('✅ Gestión de Lecciones inicializada');
    }

    function setupEventListeners() {
        document.getElementById('btn-crear-leccion')?.addEventListener('click', mostrarModalCrear);
        document.getElementById('btn-refrescar')?.addEventListener('click', cargarLecciones);
        document.getElementById('btn-cancelar-crear')?.addEventListener('click', ocultarModalCrear);
        document.getElementById('btn-guardar-leccion')?.addEventListener('click', crearLeccion);
        document.getElementById('buscar-leccion')?.addEventListener('input', filtrarLecciones);
        document.getElementById('filtro-nivel')?.addEventListener('change', filtrarLecciones);
        document.getElementById('btn-prev')?.addEventListener('click', () => cambiarPagina(-1));
        document.getElementById('btn-next')?.addEventListener('click', () => cambiarPagina(1));
        
        document.getElementById('buscar-leccion')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                filtrarLecciones();
            }
        });
    }

    async function cargarLecciones() {
        try {
            mostrarLoading(true);
            
            const endpoint = window.APP_CONFIG?.API?.ENDPOINTS?.LECCIONES?.LISTAR || '/lecciones';
            const response = await window.apiClient.get(endpoint);
            
            console.log('📦 Respuesta completa:', response);
            
            if (response.success) {
                // 🔧 CORRECCIÓN: response.data contiene {success, data, paginacion}
                // El array de lecciones está en response.data.data
                const serverData = response.data;
                
                // Verificar estructura de la respuesta
                if (serverData.data && Array.isArray(serverData.data)) {
                    leccionesData = serverData.data;
                    console.log('✅ Lecciones cargadas del servidor:', leccionesData.length);
                } else if (Array.isArray(serverData)) {
                    // Fallback: si data es directamente un array
                    leccionesData = serverData;
                    console.log('✅ Lecciones cargadas (estructura alternativa):', leccionesData.length);
                } else {
                    console.warn('⚠️ Estructura de respuesta inesperada:', serverData);
                    throw new Error('Estructura de datos incorrecta');
                }
                
                actualizarEstadisticas();
                mostrarLecciones();
                window.toastManager.success(`${leccionesData.length} lecciones cargadas correctamente`);
            } else {
                throw new Error(response.error || 'Error al cargar lecciones');
            }
        } catch (error) {
            console.warn('⚠️ Error cargando lecciones:', error);
            window.toastManager.warning('Usando datos de demostración. Servidor no disponible.');
            
            leccionesData = obtenerLeccionesDemo();
            actualizarEstadisticas();
            mostrarLecciones();
        } finally {
            mostrarLoading(false);
        }
    }

    function obtenerLeccionesDemo() {
        return [
            {
                id: 1,
                titulo: "Saludos y Presentaciones Básicas",
                descripcion: "Aprende a saludar y presentarte en situaciones cotidianas",
                nivel: "A1",
                idioma: "Inglés",
                estado: "activa",
                duracion_minutos: 45,
                orden: 1,
                creado_en: new Date().toISOString(),
                creado_por: "Admin Demo"
            },
            {
                id: 2,
                titulo: "Números y Fechas",
                descripcion: "Domina los números cardinales, ordinales y cómo expresar fechas",
                nivel: "A1",
                idioma: "Inglés", 
                estado: "borrador",
                duracion_minutos: 60,
                orden: 2,
                creado_en: new Date(Date.now() - 86400000).toISOString(),
                creado_por: "Admin Demo"
            },
            {
                id: 3,
                titulo: "Conversaciones en Restaurante",
                descripcion: "Frases útiles para pedir comida en un restaurante",
                nivel: "A2",
                idioma: "Inglés",
                estado: "inactiva",
                duracion_minutos: 50,
                orden: 3,
                creado_en: new Date(Date.now() - 172800000).toISOString(),
                creado_por: "Admin Demo"
            }
        ];
    }

    function actualizarEstadisticas() {
        // 🔧 VALIDACIÓN: Asegurar que leccionesData es un array
        if (!Array.isArray(leccionesData)) {
            console.error('❌ leccionesData no es un array:', typeof leccionesData, leccionesData);
            leccionesData = [];
            return;
        }
        
        const total = leccionesData.length;
        const activas = leccionesData.filter(l => l.estado === 'activa').length;
        const borrador = leccionesData.filter(l => l.estado === 'borrador').length;
        const inactivas = leccionesData.filter(l => l.estado === 'inactiva').length;

        const totalEl = document.getElementById('total-lecciones');
        const activasEl = document.getElementById('lecciones-activas');
        const borradorEl = document.getElementById('lecciones-borrador');
        const inactivasEl = document.getElementById('lecciones-inactivas');

        if (totalEl) totalEl.textContent = total;
        if (activasEl) activasEl.textContent = activas;
        if (borradorEl) borradorEl.textContent = borrador;
        if (inactivasEl) inactivasEl.textContent = inactivas;
    }

    function mostrarLecciones() {
        const tbody = document.getElementById('tabla-lecciones');
        if (!tbody) return;

        const leccionesFiltradas = obtenerLeccionesFiltradas();
        const inicio = (paginaActual - 1) * leccionesPorPagina;
        const fin = inicio + leccionesPorPagina;
        const leccionesPagina = leccionesFiltradas.slice(inicio, fin);

        if (leccionesPagina.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="py-12 text-center text-gray-500 dark:text-gray-400">
                        <i class="fas fa-search text-3xl mb-3 opacity-50"></i>
                        <p class="text-lg">No se encontraron lecciones</p>
                        <p class="text-sm mt-1">Intenta ajustar los filtros de búsqueda</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = leccionesPagina.map(leccion => `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <td class="py-4 px-4">
                    <div>
                        <p class="font-medium text-gray-900 dark:text-white">${escapeHtml(leccion.titulo)}</p>
                        <p class="text-sm text-gray-600 dark:text-gray-400">${escapeHtml(leccion.descripcion || 'Sin descripción')}</p>
                    </div>
                </td>
                <td class="py-4 px-4">
                    <span class="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                        ${escapeHtml(leccion.nivel)}
                    </span>
                </td>
                <td class="py-4 px-4 text-gray-600 dark:text-gray-400">${escapeHtml(leccion.idioma)}</td>
                <td class="py-4 px-4">
                    <span class="px-2 py-1 text-xs ${
                        leccion.estado === 'activa' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                        leccion.estado === 'borrador' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' :
                        'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                    } rounded-full">
                        ${leccion.estado}
                    </span>
                </td>
                <td class="py-4 px-4 text-gray-600 dark:text-gray-400">${leccion.duracion_minutos} min</td>
                <td class="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">${formatearFecha(leccion.creado_en)}</td>
                <td class="py-4 px-4">
                    <div class="flex gap-2">
                        <button onclick="window.gestionLecciones.editarLeccion(${leccion.id})" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="window.gestionLecciones.verLeccion(${leccion.id})" class="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 transition-colors p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20" title="Ver">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="window.gestionLecciones.gestionarMultimedia(${leccion.id})" class="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 transition-colors p-2 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20" title="Multimedia">
                            <i class="fas fa-file-upload"></i>
                        </button>
                        <button onclick="window.gestionLecciones.eliminarLeccion(${leccion.id})" class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        actualizarPaginacion(leccionesFiltradas.length);
    }

    function obtenerLeccionesFiltradas() {
        const busquedaEl = document.getElementById('buscar-leccion');
        const nivelFiltroEl = document.getElementById('filtro-nivel');
        
        if (!busquedaEl || !nivelFiltroEl) return leccionesData;
        
        const busqueda = busquedaEl.value.toLowerCase();
        const nivelFiltro = nivelFiltroEl.value;
        
        return leccionesData.filter(leccion => {
            const coincideBusqueda = !busqueda || 
                leccion.titulo.toLowerCase().includes(busqueda) || 
                (leccion.descripcion && leccion.descripcion.toLowerCase().includes(busqueda));
            const coincideNivel = !nivelFiltro || leccion.nivel === nivelFiltro;
            
            return coincideBusqueda && coincideNivel;
        });
    }

    function filtrarLecciones() {
        paginaActual = 1;
        mostrarLecciones();
    }

    function actualizarPaginacion(total) {
        const desde = Math.min((paginaActual - 1) * leccionesPorPagina + 1, total);
        const hasta = Math.min(paginaActual * leccionesPorPagina, total);
        
        const desdeEl = document.getElementById('mostrando-desde');
        const hastaEl = document.getElementById('mostrando-hasta');
        const totalEl = document.getElementById('total-registros');
        const prevBtn = document.getElementById('btn-prev');
        const nextBtn = document.getElementById('btn-next');
        
        if (desdeEl) desdeEl.textContent = desde;
        if (hastaEl) hastaEl.textContent = hasta;
        if (totalEl) totalEl.textContent = total;
        
        if (prevBtn) prevBtn.disabled = paginaActual === 1;
        if (nextBtn) nextBtn.disabled = hasta >= total;
    }

    function cambiarPagina(direccion) {
        const leccionesFiltradas = obtenerLeccionesFiltradas();
        const totalPaginas = Math.ceil(leccionesFiltradas.length / leccionesPorPagina);
        const nuevaPagina = paginaActual + direccion;
        
        if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
            paginaActual = nuevaPagina;
            mostrarLecciones();
        }
    }

    function mostrarModalCrear() {
        const modal = document.getElementById('modal-crear-leccion');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    }

    function ocultarModalCrear() {
        const modal = document.getElementById('modal-crear-leccion');
        const form = document.getElementById('form-crear-leccion');
        
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
        if (form) {
            form.reset();
        }
    }

    async function crearLeccion() {
        const form = document.getElementById('form-crear-leccion');
        if (!form) return;
        
        const formData = new FormData(form);
        
        const titulo = formData.get('titulo');
        const nivel = formData.get('nivel');
        const idioma = formData.get('idioma');
        
        if (!titulo || !nivel || !idioma) {
            window.toastManager.error('Por favor completa todos los campos requeridos');
            return;
        }
        
        const datosLeccion = {
            titulo: titulo,
            descripcion: formData.get('descripcion') || '',
            nivel: nivel,
            idioma: idioma,
            duracion_minutos: parseInt(formData.get('duracion_minutos') || 30),
            orden: parseInt(formData.get('orden') || 0),
            contenido: formData.get('contenido') || '',
            estado: 'borrador'
        };

        try {
            mostrarLoading(true);
            
            const endpoint = window.APP_CONFIG?.API?.ENDPOINTS?.LECCIONES?.CREAR || '/lecciones';
            const response = await window.apiClient.post(endpoint, datosLeccion);
            
            console.log('📦 Respuesta crear lección:', response);
            
            if (response.success) {
                window.toastManager.success('Lección creada exitosamente');
                ocultarModalCrear();
                await cargarLecciones();
                
                // Redirigir al editor
                setTimeout(() => {
                    // 🔧 CORRECCIÓN: response.data contiene {success, data, mensaje}
                    const serverData = response.data;
                    const leccionId = serverData.data?.id || serverData.data?.leccion_id;
                    
                    if (leccionId) {
                        window.location.href = `/pages/admin/editor-leccion.html?id=${leccionId}`;
                    }
                }, 1000);
                
            } else {
                throw new Error(response.error || 'Error al crear lección');
            }
        } catch (error) {
            console.error('Error creando lección:', error);
            window.toastManager.error('Error al crear la lección: ' + (error.message || 'Error desconocido'));
        } finally {
            mostrarLoading(false);
        }
    }

    // Exportar funciones globalmente
    window.gestionLecciones = {
        editarLeccion: (id) => {
            window.location.href = `/pages/admin/editor-leccion.html?id=${id}`;
        },
        
        verLeccion: (id) => {
            window.location.href = `/pages/admin/vista-previa.html?id=${id}`;
        },
        
        gestionarMultimedia: (id) => {
            window.location.href = `/pages/admin/gestion-multimedia.html?leccion_id=${id}`;
        },
        
        eliminarLeccion: async (id) => {
            if (!confirm('¿Estás seguro de que quieres eliminar esta lección?\nEsta acción no se puede deshacer.')) {
                return;
            }
            
            try {
                mostrarLoading(true);
                
                const endpoint = window.APP_CONFIG?.API?.ENDPOINTS?.LECCIONES?.ELIMINAR?.replace(':id', id) || `/lecciones/${id}`;
                const response = await window.apiClient.delete(endpoint);
                
                if (response.success) {
                    window.toastManager.success('Lección eliminada exitosamente');
                    await cargarLecciones();
                } else {
                    throw new Error(response.error || 'Error al eliminar lección');
                }
            } catch (error) {
                console.error('Error eliminando lección:', error);
                window.toastManager.error('Error al eliminar la lección');
            } finally {
                mostrarLoading(false);
            }
        }
    };

    // Funciones auxiliares
    function formatearFecha(fechaISO) {
        try {
            const fecha = new Date(fechaISO);
            return fecha.toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return 'Fecha inválida';
        }
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function mostrarLoading(mostrar) {
        document.body.style.cursor = mostrar ? 'wait' : 'default';
    }

    async function waitForDependencies() {
        const dependencies = ['APP_CONFIG', 'apiClient', 'toastManager', 'Utils'];
        const maxWaitTime = 5000;
        const startTime = Date.now();
        
        while (dependencies.some(dep => !window[dep])) {
            if (Date.now() - startTime > maxWaitTime) {
                console.error('❌ Timeout esperando dependencias');
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
            
            const token = window.Utils?.getFromStorage(window.APP_CONFIG?.STORAGE?.KEYS?.TOKEN) || 
                         localStorage.getItem('token');
            
            console.log('👤 Usuario actual:', usuario);
            console.log('🔑 Token presente:', !!token);
            
            if (!token) {
                console.warn('⚠️ No hay token de autenticación');
                mostrarErrorPermisos('Debes iniciar sesión para acceder a esta página');
                return false;
            }
            
            const rol = (usuario.rol || usuario.role || '').toLowerCase();
            console.log('👔 Rol del usuario:', rol);
            
            const rolesAdmin = ['admin', 'administrador'];
            
            if (!rolesAdmin.includes(rol)) {
                console.warn('⚠️ Usuario sin permisos de admin. Rol:', rol);
                mostrarErrorPermisos('No tienes permisos para acceder a esta página');
                return false;
            }
            
            console.log('✅ Usuario con permisos de admin verificado');
            return true;
            
        } catch (error) {
            console.error('💥 Error verificando permisos:', error);
            mostrarErrorPermisos('Error al verificar permisos');
            return false;
        }
    }

    function mostrarErrorPermisos(mensaje) {
        if (window.toastManager) {
            window.toastManager.error(mensaje);
        } else {
            alert(mensaje);
        }
        
        setTimeout(() => {
            window.location.href = '/pages/auth/login.html';
        }, 2000);
    }

    // Inicializar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 100);
    }

})();