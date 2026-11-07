# Sesiones del navegador

Implementación local en `dev`. Frontend: `http://localhost:4200`; API: `http://localhost:5257/api`.

- Cookie opaca y HttpOnly; nunca se entrega un JWT ni una clave de sesión en JSON. La base de datos conserva únicamente el hash de la clave y el ticket cifrado mediante ASP.NET Data Protection.
- La sesión se verifica en PostgreSQL en cada petición. Inactividad: 30 minutos. Límite absoluto: 8 horas. Cerrar sesión revoca su registro antes de limpiar la interfaz.
- Cambiar o recuperar contraseña invalida las demás sesiones. El cambio autenticado conserva una sesión nueva. Desactivar una cuenta o cambiar sus credenciales invalida el acceso.
- La identidad vive sólo en memoria del frontend y se recupera mediante `GET /api/auth/me` en la primera entrada privada o tras F5. Entre módulos se utiliza exclusivamente el estado ya validado en memoria para dibujar la vista inmediatamente; los permisos se actualizan después de activarla, sin bloquear el cambio de pantalla. Cada endpoint mantiene su autorización en servidor. Si la actualización detecta revocación, se retira el acceso; ante un 401 se limpia la sesión y se vuelve al login. Las claves antiguas `jaytech_token` y `jaytech_session` se eliminan del navegador. Sólo se guarda un evento sin identidad ni credenciales para sincronizar pestañas.
- Cada POST, PUT, PATCH o DELETE requiere `X-CSRF-TOKEN`, incluido login y formularios públicos. El token se obtiene de `GET /api/auth/csrf` y permanece en memoria. Se permite una sola repetición ante el código específico `csrf_invalid`, emitido antes de ejecutar la acción; otros errores no reintentan escrituras.
- Las respuestas de identidad y permisos llevan `Cache-Control: no-store`. Las políticas de permisos siguen leyendo los roles y excepciones por usuario desde el backend.

## Endpoints

`GET /api/auth/csrf`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout` y `POST /api/auth/logout-all`. Logout-all permite invalidar todas las sesiones del usuario autenticado. Los clientes envían cookies sólo a la API configurada, mediante `withCredentials`.

## Producción pendiente

No se ha publicado esta migración. `jaytechconsulting.github.io` y la API actual en `sslip.io` son sitios diferentes. Las cookies Strict no funcionarán entre ambos: se necesita dominio propio con frontend/API en el mismo sitio o alojar el frontend junto al backend. No cambiar a SameSite=None para ocultar esa limitación.

Fuera de Development las cookies usan `__Host-`, `Secure`, `HttpOnly`, `SameSite=Strict`, `Path=/` y ningún Domain. La excepción HTTP es sólo para desarrollo local. Debe utilizarse HTTPS en producción. CORS admite credenciales exclusivamente para la lista exacta configurada de orígenes; nunca usar un origen comodín.

Persistir `.data/keys` (o configurar `DataProtection__KeyPath`) en un volumen privado compartido por las instancias, con permisos de acceso restringidos y copias de seguridad protegidas. Perder esas claves fuerza un nuevo login; no expone las credenciales. La carpeta se excluye de Git. El proxy/CDN debe respetar no-store y no cachear respuestas con Set-Cookie ni rutas /api/auth/* y /api/access/*.

## Migración y reversión

`AddServerSessions` añade únicamente `auth_sessions`, sus índices y la FK con usuarios. No modifica cuentas, contraseñas ni permisos existentes. Los JWT anteriores dejan de ser aceptados; se requiere iniciar sesión otra vez. Frontend y backend deben desplegarse coordinadamente, sin mezclar el cliente antiguo de bearer con la nueva API de cookies.

La reversión de esquema elimina sólo la tabla de sesiones y obliga a volver a iniciar sesión; no se ha ejecutado. No reactivar aceptación de JWT antiguos al revertir: cualquier vuelta a una versión anterior de autenticación debe rotar sus claves y forzar login. La versión estable anterior de la aplicación puede mantenerse mientras se prepara el dominio, sin publicar esta rama local.

## Verificación

Frontend: pruebas de auth.guard, auth.service, auth.interceptor y AccessService. Backend: tests/SessionChecks (CSRF, cookies, replay tras logout, contraseña, inactividad y expiración absoluta), AccessControlChecks --http (permisos con cookies) y UserProfileChecks (flujos de perfil con cookies). Las cuentas temporales se eliminan al terminar; no se usan documentos reales ni APIPERU.
