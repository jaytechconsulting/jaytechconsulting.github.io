# Revisión y refactorización del frontend

Trabajo sobre `dev`, conservando los cambios pendientes y los contratos de la API.

## Hallazgos y medidas

| Hallazgo | Medida aplicada |
| --- | --- |
| El servicio CMS mezclaba contratos, configuración, conversiones, persistencia y estado. | Separación en `core/cms`; el servicio de estado pasó de unas 964 a 248 líneas. |
| El editor de contenido incluía configuración estática extensa. | Registro declarativo en `content-editor.config.ts`, con tipos compartidos. |
| La extracción de `ApiResponse.data` y las URLs se repetían en los endpoints. | `ApiClient` común utilizado por los 67 métodos de la fachada API; cookies y CSRF siguen en el interceptor. |
| Lecturas de imágenes repetidas y callbacks que podían finalizar tras cambiar de registro. | `ImageFileService` y `ImageFile`, con límites configurables, cancelación, restablecimiento por contexto y limpieza. |
| Fondos y formato monetario repetidos en páginas. | Funciones compartidas `backgroundStyle` y `formatSoles`, con un formateador reutilizado. |
| Servicios y directivas mezclados en carpetas generales. | Servicios agrupados por dominio y directivas visuales en `ui/behaviors`. |
| Las consultas rápidas podían terminar fuera de orden o seguir activas tras destruir una vista. | `createLatestRequest` usado en capacitaciones y proyectos; cancela lecturas obsoletas y libera recursos. |
| Imports y datos de ejemplo sin uso. | Eliminación y controles permanentes `noUnusedLocals`/`noUnusedParameters`. |
| Dos pruebas antiguas asumían rutas sin carga diferida y autorización por el modelo anterior. | Actualización para comprobar rutas diferidas, sesión verificada y permisos efectivos. |
| El primer paquete incluía las secciones inferiores de la portada. | `@defer (on idle)` mantiene la primera pantalla y difiere código no crítico. |

## Verificación

- Línea base: 152 pruebas pasaban y 2 fallaban por expectativas antiguas.
- Resultado: 162 pruebas pasan en 37 archivos.
- `npm run check`: correcto, incluidas declaraciones e imports sin uso.
- `npm run build -- --configuration production`: correcto, incluido `postbuild` de GitHub Pages.
- Paquete inicial antes/después de diferir las secciones: 605,98 → 542,91 kB; transferencia estimada 138,99 → 127,63 kB. Es una medición del build, no una medición de latencia en dispositivos reales.
- Los servicios locales responden HTTP 200 en 4200 y en `/health` del backend.

Permanecen dos advertencias previas del presupuesto de estilos: `admin-shell.css` y `admin-access.css`. No se aumentaron los límites para ocultarlas. Esta refactorización no certifica pasarelas de pago ni sustituye pruebas con credenciales de sandbox.

Ver [arquitectura y patrones de reutilización](frontend-architecture.md) para agregar funcionalidades manteniendo estas fronteras.
