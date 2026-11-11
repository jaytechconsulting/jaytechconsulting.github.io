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
npm run build -- --configuration production
```

TypeScript comprueba declaraciones, parámetros e imports sin uso. Las pruebas HTTP usan `HttpTestingController`; las de recursos verifican cancelación, fallos y destrucción; las de permisos usan la sesión efectiva. No hacer pagos ni enviar mensajes reales para validar una refactorización.


## Prerenderizado y publicación

Las páginas públicas se generan como HTML estático en cada build de producción (`outputMode: static`). `src/app/app.routes.server.ts` decide el modo de cada ruta: las públicas se prerenderizan con el contenido publicado del CMS; login, panel de cliente y admin se renderizan en el navegador porque dependen de la sesión. Las rutas de detalle listan ahí sus registros publicados; un registro creado después de la última publicación se resuelve con el fallback de cliente (`404.html`) hasta la siguiente.

El navegador adopta ese HTML (hidratación) y reutiliza las respuestas de la API capturadas en el build, así que una página pública no consulta el CMS al cargar. Para que una lectura anónima se reutilice debe pasar por `ApiClient.getPublic`. La navegación interna posterior sí consulta la API.

El código que corre durante el prerender no tiene `window`: protege almacenamiento, temporizadores, observadores, scroll y media queries con `isBrowser` (`core/platform.ts`), y lee la URL con `DOCUMENT`. El estado del visitante (carrito, cookies, tema) nunca se hornea en el HTML compartido; el tema se aplica con un script en `index.html` antes del primer pintado.

`scripts/prepare-github-pages.mjs` agrega el identificador de build, los fallbacks de rutas privadas y `404.html`, y cancela la publicación si la portada se generó sin contenido del CMS (API inaccesible).

Un cambio guardado en el CMS aparece en la web cuando termina una publicación: el backend ejecuta este workflow (`workflow_dispatch`) y el admin muestra estado e historial en **Publicación web**. Para verificar el prerender en local contra la API local:

```sh
npx ng build -c static-local
```

## Medición con Tag Manager

El contenedor activo es `GTM-PZBV2SLJ`, configurado en ambos entornos. Se carga solo al aceptar analítica. La integración directa con la propiedad GA4 anterior fue retirada para no enviar datos a un destino anterior ni duplicar la instalación.

En el contenedor, configurar y publicar la etiqueta de Google con el ID de medición de la propiedad GA4 correcta. La aplicación emite `app_page_view` con `page_path` al iniciar la medición y al navegar: crear un activador de evento personalizado para este nombre y una etiqueta GA4 que envíe `page_view` con ese parámetro. Desactivar el envío automático de vistas iniciales y por historial si se usa este flujo para evitar duplicados. Respetar el consentimiento de analítica en las etiquetas; la publicidad permanece denegada. Las etiquetas HTML personalizadas requieren configurar sus comprobaciones de consentimiento.

Verificar con Tag Assistant y Tiempo real de Analytics después de aceptar; rechazar no debe descargar el contenedor. La configuración y publicación del contenedor se realizan en Google Tag Manager, fuera del repositorio.

## Documentos legales

`/terminos-y-condiciones` y `/avisos-legales` se editan en Administración → Páginas. Reutilizan `PUT /api/content/{key}` y los permisos existentes de contenido: las claves son `page.terminos-y-condiciones` y `page.avisos-legales`. El cuerpo JSON conserva `description`, `backgroundColor` y añade `content` para el texto completo. El guardado publica el registro con `status: 1`, como el editor de páginas existente. No requiere migraciones ni cambios de backend.

Las páginas públicas leen la instantánea `/api/public-site`, muestran estados de carga/error y usan texto referencial si todavía no existe un documento guardado. El texto se interpola de forma segura y conserva párrafos; no admite HTML ejecutable. Completar el documento aprobado desde el CMS antes de su publicación efectiva.

## Redes sociales del footer

Administración → Pie de página permite gestionar Instagram, Facebook, LinkedIn, YouTube y GitHub. El botón «Guardar redes sociales» guarda la lista en `site.social-links` mediante la API de contenido existente, sin migraciones. Cada entrada contiene `network`, `url` y `enabled`; su orden determina el del footer. Una lista vacía guardada oculta todas las redes. Si todavía no existe configuración, se muestran enlaces de prueba a las páginas principales de las plataformas. Los enlaces solo admiten HTTPS sin credenciales, abren otra pestaña y no cargan widgets ni seguimiento social.
