# Análisis de Errores y Soluciones - Proyecto SpeakLexi 2.0

## ERRORES IDENTIFICADOS Y RESOLUCIONES

### 1. ERROR: Unknown column 'fecha_creacion' in 'field list'

**Contexto:**
El usuario intentaba registrar un nuevo usuario pero el backend devolvía un error 500.

**Causa Raíz:**
Inconsistencia entre los nombres de columnas utilizados en el código del backend y el esquema real de la base de datos.

**Detalles Técnicos:**
- Archivo afectado: `backend/controllers/authController.js` (línea 73)
- Código problemático:
```javascript
await connection.query(
    `INSERT INTO perfil_usuarios (usuario_id, nombre_completo, fecha_creacion) 
     VALUES (?, ?, NOW())`,
    [usuario_id, nombre_completo]
);
```
- El esquema de base de datos define la columna como `creado_en`, no `fecha_creacion`
- La columna `creado_en` tiene un valor DEFAULT CURRENT_TIMESTAMP

**Solución:**
Remover la referencia a la columna inexistente, permitiendo que use el valor por defecto:
```javascript
await connection.query(
    `INSERT INTO perfil_usuarios (usuario_id, nombre_completo) 
     VALUES (?, ?)`,
    [usuario_id, nombre_completo]
);
```

**Errores Adicionales del Mismo Tipo:**
También se encontró `email_verificado` cuando debería ser `correo_verificado` en múltiples ubicaciones:
- authController.js líneas 245, 308, 564
- authMiddleware.js líneas 50, 180

**Lección Aprendida:**
Siempre verificar que los nombres de columnas en el código coincidan exactamente con el esquema de base de datos. Revisar tanto controllers como middlewares para inconsistencias similares.

---

### 2. ERROR: Route.get() requires a callback function but got a [object Undefined]

**Contexto:**
Después de corregir el primer error, el servidor no iniciaba y mostraba un error de Express.

**Causa Raíz:**
El archivo de rutas (`auth-routes.js`) estaba intentando usar funciones del controlador que no existían o no estaban exportadas correctamente.

**Detalles Técnicos:**
- Error en línea 365 de `auth-routes.js`
- Las rutas esperaban funciones `obtenerPerfil` y `cerrarSesion` que no existían en el controlador
- El archivo actualizado incluía rutas protegidas adicionales que requerían estas funciones

**Solución:**
Agregar las funciones faltantes al controlador:

1. `exports.obtenerPerfil`:
   - Recupera datos completos del usuario autenticado
   - Incluye información del perfil específico según el rol (estudiante/profesor/admin)

2. `exports.cerrarSesion`:
   - Maneja el cierre de sesión
   - Registra el evento en logs
   - Nota: En JWT stateless, el logout es principalmente del lado del cliente

**Lección Aprendida:**
Al actualizar archivos de rutas, verificar que todas las funciones referenciadas existan en sus respectivos controladores. Mantener sincronización entre rutas y controladores.

---

### 3. ERROR: Acceso no autorizado, Token requerido

**Contexto:**
Durante el flujo de onboarding, después de verificar el email, el usuario no podía asignar su nivel.

**Causa Raíz:**
El endpoint `/api/auth/actualizar-nivel` estaba protegido con middleware de autenticación, pero durante el onboarding el usuario aún no tiene un token JWT (no ha iniciado sesión).

**Detalles Técnicos:**
- Archivo: `backend/routes/auth-routes.js` línea 377-383
- El endpoint tenía:
```javascript
router.patch(
  '/actualizar-nivel', 
  authMiddleware.verificarToken,  // REQUIERE TOKEN
  authMiddleware.verificarEmail,
  validacionesActualizarNivel, 
  authController.actualizarNivel
);
```
- El flujo de onboarding es: Registro → Verificar Email → Asignar Nivel → Login
- En "Asignar Nivel" el usuario NO tiene token aún

**Solución:**
Remover los middlewares de autenticación del endpoint, dejándolo público:
```javascript
router.patch('/actualizar-nivel', validacionesActualizarNivel, authController.actualizarNivel);
```

El controlador ya validaba el usuario usando el correo del body del request.

**Lección Aprendida:**
Diferenciar entre endpoints que requieren autenticación y aquellos que son parte del proceso de onboarding. Documentar claramente el flujo de autenticación y en qué punto se obtiene el token.

---

### 4. ERROR: No se encontró el correo del usuario

**Contexto:**
En la página de asignar nivel, después de verificar el email, se mostraba un error de que no se encontró el correo.

**Causa Raíz:**
El localStorage se estaba limpiando prematuramente en `verificar-email.html`, antes de que el usuario llegara a `asignar-nivel.html`.

**Detalles Técnicos:**
- En `verificar-email.html` líneas 280-284:
```javascript
localStorage.removeItem('correo');
localStorage.removeItem('idioma');
// Luego redirige a asignar-nivel.html
```
- En `asignar-nivel.html` línea 492:
```javascript
const correo = localStorage.getItem('correo'); // null
```

**Flujo del Problema:**
1. Registro → guarda correo e idioma en localStorage
2. Verificar email → BORRA localStorage → redirige a asignar nivel
3. Asignar nivel → intenta leer localStorage vacío → error

**Solución:**
No borrar el localStorage en `verificar-email.html`. Dejarlo para que se borre después de asignar el nivel exitosamente (lo cual ya estaba implementado en `asignar-nivel.html` líneas 515-516).

**Lección Aprendida:**
Mapear completamente el flujo de datos entre páginas. El localStorage debe mantenerse hasta que todo el proceso de onboarding esté completo.

---

### 5. ERROR: Respuesta inválida del servidor (login)

**Contexto:**
Al intentar hacer login, el frontend mostraba "Respuesta inválida del servidor" aunque el backend respondía correctamente.

**Causa Raíz:**
Inconsistencia en el nombre de la propiedad del token entre backend y frontend.

**Detalles Técnicos:**
- Backend (`authController.js` respuesta de login):
```javascript
res.json({
    mensaje: 'Login exitoso',
    token: token,  // Propiedad llamada "token"
    usuario: { ... }
});
```

- Frontend (`login.html` línea 460):
```javascript
const access_token = data.access_token;  // Buscando "access_token"
if (!usuario || !access_token) {
    throw new Error('Respuesta inválida del servidor');
}
```

**Solución:**
Cambiar el frontend para usar el nombre correcto:
```javascript
const token = data.token;
if (!usuario || !token) {
    throw new Error('Respuesta inválida del servidor');
}
localStorage.setItem('token', token);
```

**Lección Aprendida:**
Mantener consistencia en los nombres de propiedades entre frontend y backend. Documentar la estructura de respuestas de la API.

---

### 6. ERROR: Cannot GET /estudiante/estudiante-dashboard.html

**Contexto:**
Después de un login exitoso, la redirección fallaba con 404.

**Causa Raíz:**
Las rutas de redirección en el frontend no coincidían con la estructura real de carpetas del proyecto.

**Detalles Técnicos:**
- Código de redirección usaba:
```javascript
let redirectPath = '/estudiante/estudiante-dashboard.html';
```

- Estructura real de carpetas:
```
frontend/pages/estudiante/dashboard-estudiante.html
```

**Solución:**
Corregir las rutas de redirección para que coincidan con la estructura de carpetas:
```javascript
let redirectPath = '/pages/estudiante/dashboard-estudiante.html';
```

**Lección Aprendida:**
Verificar la estructura de carpetas del proyecto antes de codificar rutas. Considerar usar constantes o un archivo de configuración para las rutas.

---

## GUIDELINES PARA DESARROLLO CON IA

### A. Verificación de Esquema de Base de Datos

1. **SIEMPRE** pedir o revisar el esquema de base de datos antes de escribir queries
2. Verificar nombres exactos de:
   - Tablas
   - Columnas
   - Tipos de datos
   - Valores por defecto
3. Buscar inconsistencias comunes:
   - `email` vs `correo`
   - `fecha_creacion` vs `creado_en` vs `created_at`
   - `verificado` vs `email_verificado` vs `correo_verificado`

### B. Sincronización Frontend-Backend

1. Documentar estructura de respuestas de API:
```javascript
// Ejemplo de documentación
// POST /api/auth/login
// Response: { token: string, usuario: Object, redirectUrl: string }
```

2. Mantener nombres de propiedades consistentes entre ambos lados
3. Usar TypeScript o JSDoc para tipado cuando sea posible

### C. Gestión de Estado y Flujo de Datos

1. Mapear el flujo completo de datos ANTES de implementar:
```
Registro → localStorage: {correo, idioma}
Verificar Email → NO borrar localStorage
Asignar Nivel → usar localStorage → borrar después
Login → guardar token
```

2. Documentar el ciclo de vida de datos temporales (localStorage, sessionStorage)
3. Identificar puntos de limpieza de datos

### D. Middlewares de Autenticación

1. Clasificar endpoints por tipo:
   - Públicos (registro, login, verificar email)
   - Onboarding (asignar nivel - sin token pero con validación)
   - Protegidos (dashboard, perfil - requieren token)

2. Documentar claramente en qué punto del flujo se obtiene el token JWT

3. Para endpoints de transición (onboarding), considerar validación alternativa (email en body en lugar de token)

### E. Verificación de Rutas y Archivos

1. SIEMPRE verificar estructura de carpetas antes de codificar rutas
2. Usar rutas absolutas desde la raíz cuando sea posible
3. Considerar crear un archivo de configuración:
```javascript
const ROUTES = {
  ESTUDIANTE_DASHBOARD: '/pages/estudiante/dashboard-estudiante.html',
  ADMIN_DASHBOARD: '/pages/admin/dashboard-admin.html',
  // ...
};
```

### F. Manejo de Errores en Transacciones

1. En operaciones con transacciones de base de datos:
```javascript
let connection;
try {
    connection = await database.getConnection();
    await connection.beginTransaction();
    // operaciones
    await connection.commit();
} catch (error) {
    if (connection) await connection.rollback();
    // manejo de error
} finally {
    if (connection) connection.release();
}
```

2. Logs descriptivos en cada paso de la transacción
3. Rollback automático en caso de cualquier error

### G. Exportaciones de Funciones

1. Al crear nuevas rutas, verificar INMEDIATAMENTE que las funciones existan
2. Verificar que las funciones estén exportadas correctamente:
```javascript
exports.nombreFuncion = async (req, res) => { ... }
```

3. No confiar en que la función existe solo porque está en un archivo anterior; verificar físicamente

### H. Testing de Flujos Completos

1. Probar el flujo completo de usuario ANTES de considerar terminado:
   - Registro
   - Verificación de email
   - Asignación de nivel
   - Login
   - Navegación al dashboard

2. Verificar que los datos persistan correctamente en cada paso
3. Probar con y sin datos en localStorage/sessionStorage

### I. Consistencia en Nombres

Mantener un glosario de términos del proyecto:
```
usuario vs user
correo vs email
contrasena vs password
nivel vs level
idioma vs language
fecha_creacion vs created_at vs creado_en
```

Elegir UNA convención y mantenerla en todo el proyecto.

### J. Archivos de Configuración y Middleware

Al actualizar archivos que otros archivos importan:
1. Listar todos los archivos que lo usan
2. Verificar que las exportaciones no se rompan
3. Verificar que las importaciones usen los nombres correctos
4. Probar que el servidor inicie correctamente después de cambios

---

## CHECKLIST ANTES DE ENTREGAR CÓDIGO

- [ ] Verificar nombres de columnas contra esquema de BD
- [ ] Verificar nombres de propiedades entre frontend/backend
- [ ] Verificar que todas las funciones referenciadas existan
- [ ] Verificar rutas de archivos contra estructura de carpetas
- [ ] Mapear flujo completo de datos y su ciclo de vida
- [ ] Clasificar endpoints por nivel de autenticación requerido
- [ ] Verificar manejo de transacciones con try-catch-finally
- [ ] Probar flujo completo de usuario
- [ ] Documentar estructura de respuestas de API
- [ ] Verificar que el servidor inicie sin errores