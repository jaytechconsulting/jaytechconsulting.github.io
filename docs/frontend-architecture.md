# Arquitectura del frontend

Angular standalone, rutas diferidas y permisos efectivos del backend. Las secciones inferiores de la portada se cargan con `@defer (on idle)` para no incluir su código en el primer paquete. La UI conserva los tokens, marcas y componentes existentes.

## Responsabilidades

| Ruta                                                                         | Responsabilidad                                                              |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `core/http`                                                                  | Transporte HTTP y ciclo de vida de consultas reutilizables.                  |
| `core/api.service.ts`                                                        | Fachada tipada de los endpoints existentes.                                  |
| `core/auth`                                                                  | Sesiones, cookies, CSRF, interceptor y guard.                                |
| `core/access`                                                                | Permisos, menú del backend y precarga autorizada.                            |
| `core/cms`                                                                   | Modelos, conversiones, configuración inicial, persistencia y estado del CMS. |
| `core/catalog`                                                               | Contratos, validación y consultas de catálogos.                              |
| `core/users`, `projects`, `support`, `commerce`                              | Usuarios, proyectos, tickets y carrito.                                      |
| `core/files`                                                                 | Lectura y validación local de imágenes; no decide su persistencia.           |
| `core/models`, `validation`, `formatting`                                    | Contratos generales y funciones compartidas.                                 |
| `core/services`                                                              | Tema, progreso, avisos, diálogos, SEO y analítica.                           |
| `ui/actions`, `forms`, `data-display`, `feedback`, `navigation`, `marketing` | Componentes reutilizables según su responsabilidad.                          |
| `ui/behaviors`                                                               | Directivas: permisos visuales, scroll, reveal e imágenes.                    |
| `ui/styles`                                                                  | Funciones puras de presentación independientes del CMS.                      |
| `pages`                                                                      | Composición y estado específicos de cada pantalla.                           |

## CMS: una responsabilidad por archivo

- `cms.models.ts`: contratos internos de editor y web. Importar los modelos desde aquí.
- `cms.defaults.ts`: estructura y estado inicial vacío. Los ejemplos no se dibujan mientras se consulta la API.
- `cms.mappers.ts`: conversiones puras del backend a la vista; conserva anuncios anteriores.
- `cms-collection.repository.ts`: transforma y persiste borradores mediante los endpoints existentes; no mantiene señales de pantalla.
- `cms-content.service.ts`: coordina carga, reintento, estado y actualización tras guardar. Para la web pública consume una sola instantánea coherente de `/api/public-site`; el administrador conserva sus consultas autenticadas. Una respuesta pública pendiente se cancela al entrar al editor para no sobrescribir borradores.
- `pages/admin/admin-content/content-editor.config.ts`: definición declarativa de campos y opciones del editor, sin consultas ni persistencia.

El servicio reexporta sus tipos para conservar el contrato de los consumidores existentes.

## HTTP y consultas

`ApiClient` centraliza URL base, parámetros, cuerpo y extracción de `ApiResponse.data`. Propaga errores HTTP y admite respuestas 204; no pierde `0` ni `false` en filtros. `API_BASE_URL` permite reemplazar la base en pruebas sin cambiar el entorno.

El interceptor sigue siendo el responsable de cookies, CSRF y del contador global de carga. Los servicios nuevos no deben duplicar esa lógica ni almacenar credenciales en el navegador.

Para lecturas que cambian con filtros:

```ts
private readonly results = createLatestRequest<ApiPagedResult<Item>>({
  items: [], total: 0, page: 1, pageSize: 10,
});
readonly items = computed(() => this.results.value().items);
readonly loading = this.results.loading;

reload(): void {
  this.results.load(this.api.search(this.filters()));
}
```

Crear la fábrica en un campo de componente/servicio o contexto de inyección. Una consulta nueva cancela la anterior; el error queda disponible, el flujo acepta nuevas consultas y `DestroyRef` libera el trabajo pendiente. No usar esta estrategia para cancelar escrituras o pagos.

## Imágenes y directivas

`ImageFileService.read(file, options)` devuelve un observable del Data URL. Configura tamaño, MIME y decodificación. La cancelación aborta `FileReader`; los callbacks se limpian al finalizar.

```html
<input
  type="file"
  appImageFile
  accept="image/*"
  (imageSelected)="image.set($event)"
  (imageError)="showImageError($event)"
/>
```

La directiva permite volver a elegir el mismo archivo, descarta lecturas obsoletas y se limpia al destruirse. `imageResetKey` cancela una lectura si cambia el registro; `exportAs="imageFile"` expone `cancel()` para acciones de limpiar. La pantalla decide el aviso y la persistencia. `verifyImage=true` y `imageTypes` configuran las restricciones del anuncio. La validación local no sustituye la del servidor.

Todas las directivas visuales se agrupan en `ui/behaviors`. `AccessAction` solo controla presentación: el backend sigue autorizando cada operación.

## Reglas de componentes y presentación

1. Revisar primero `ui/README.md`; reutilizar un control existente antes de crear otro.
2. Usar inputs/outputs tipados. Los componentes compartidos no reciben al componente padre ni modifican sus señales directamente.
3. Separar configuración, conversiones y persistencia de los ciclos de vida de la vista.
4. Usar claves estables en listas. Evitar peticiones o crear formateadores dentro de funciones ejecutadas desde templates.
5. `backgroundStyle()` reutiliza el tratamiento de fondos; `formatSoles()` reutiliza una instancia de `Intl.NumberFormat`.
6. Conservar foco accesible y movimiento reducido; liberar listeners, temporizadores, observadores y suscripciones.
7. Comentar decisiones, límites y limpieza de recursos. Evitar comentarios que solo repitan una asignación.
8. Mantener separadas las páginas públicas, el CMS y el portal. Registrar una ruta no concede permiso.

## Verificación

```sh
npm run check
npm run test:ci
node --test scripts/cms-bootstrap.test.mjs
npm run build -- --configuration production
```

TypeScript comprueba declaraciones, parámetros e imports sin uso. Las pruebas HTTP usan `HttpTestingController`; las de recursos verifican cancelación, fallos y destrucción; las de permisos usan la sesión efectiva. No hacer pagos ni enviar mensajes reales para validar una refactorización.


## Conexión inicial de producción

El postbuild agrega `preconnect` al origen de `environment.prod.ts` para anticipar DNS/TLS durante la descarga de Angular. El contenido público se revalida con ETag y no se persiste en localStorage para mostrar una versión antigua antes de la actual. Publicar el backend con `/api/public-site` antes del frontend que lo consume.

`public/cms-bootstrap.js` inicia el GET público durante el análisis del HTML, con `credentials: omit`, revalidación y un límite de 15 segundos. En desarrollo se carga desde `src/index.html`; el postbuild lo incrusta al principio del HTML y sustituye el endpoint por el de producción para evitar una descarga adicional del script.

`publicSiteBootstrapInterceptor` se ejecuta dentro del interceptor de autenticación/carga y entrega esa respuesta una sola vez al GET público marcado con `PUBLIC_READ`. Comprueba URL exacta y antigüedad; nunca reemplaza operaciones privadas. Las siguientes recargas y reintentos usan HTTP normalmente. Los errores anticipados se convierten a `HttpErrorResponse`; no se realiza un segundo intento automático ni se guarda contenido entre navegaciones.

## Medición con Tag Manager

El contenedor activo es `GTM-PZBV2SLJ`, configurado en ambos entornos. Se carga solo al aceptar analítica. La integración directa con la propiedad GA4 anterior fue retirada para no enviar datos a un destino anterior ni duplicar la instalación.

En el contenedor, configurar y publicar la etiqueta de Google con el ID de medición de la propiedad GA4 correcta. La aplicación emite `app_page_view` con `page_path` al iniciar la medición y al navegar: crear un activador de evento personalizado para este nombre y una etiqueta GA4 que envíe `page_view` con ese parámetro. Desactivar el envío automático de vistas iniciales y por historial si se usa este flujo para evitar duplicados. Respetar el consentimiento de analítica en las etiquetas; la publicidad permanece denegada. Las etiquetas HTML personalizadas requieren configurar sus comprobaciones de consentimiento.

Verificar con Tag Assistant y Tiempo real de Analytics después de aceptar; rechazar no debe descargar el contenedor. La configuración y publicación del contenedor se realizan en Google Tag Manager, fuera del repositorio.
