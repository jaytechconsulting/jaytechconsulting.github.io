# Componentes propios de Jaytech

Los controles compartidos usan los tokens del proyecto y se adaptan al tema claro/oscuro.

## Select (`app-select`)

Ubicación: `forms/select`. Acepta `options` como cadenas o `{ value, label }`, `value`, `label`, `placeholder`, `disabled`, `required`, `hint`, `error` y emite `valueChange`.

El panel es propio y usa Popover para mostrarse por encima de tablas y contenedores con overflow. Incluye búsqueda local sin distinción de acentos, estado sin coincidencias, opción seleccionada y navegación con flechas, Inicio/Fin, Enter y Escape. Cierra al hacer clic fuera o al cambiar la posición de la ventana. `searchable=false` oculta la búsqueda para listas cortas; `compact=true` sirve para paginación.

## Botón (`app-button`) e icono (`app-icon`)

Ubicaciones: `actions/button` y `data-display/icon`. El botón conserva sus variantes, tamaños, contenido y slots anteriores. Acepta un `icon` del catálogo `IconName`; `iconOnly` debe acompañarse de `label`. `active`, `expanded`, `controls` y `current` permiten expresar selección, despliegue y página activa. Los iconos de marca se cargan desde los SVG existentes en `public/brand/animated`.

## Diálogos y notificaciones

`DialogService.question(...)` plantea preguntas, `confirm(...)` confirma acciones y `alert(...)` muestra avisos. Devuelven una promesa booleana. Los diálogos tienen foco contenido, restauración de foco, Escape, Cancelar y Confirmar. Montar un solo `app-dialog-outlet` en la raíz.

`ToastService.success/error/warning/info` muestra notificaciones desde un solo `app-toast-stack` en la raíz. Las escrituras del administrador notifican éxito o error; los listados notifican carga, actualización, recarga y limpieza al completar la consulta, y muestran errores cuando falla.

## Progreso y bloqueo

El interceptor HTTP alimenta `LoadingService` mediante un contador que se libera al completar, fallar o cancelar una petición. La raíz muestra `app-nav-progress-bar` durante HTTP o navegación. El administrador bloquea sus controles mientras hay peticiones pendientes para impedir acciones duplicadas. Al entrar directamente al administrador se utiliza la barra, sin el loader de presentación de la marca.


## Botonera de módulo (`app-module-actions`)

`actions/module-actions` proporciona Agregar, Ver, Editar y Eliminar/Inactivar. Se configura con `selected`, `busy`, `canCreate`, `canRemove` y `removeLabel`; emite las acciones al módulo. Sin selección, las acciones sobre un registro están deshabilitadas. La tabla usa selección única y la limpia al cambiar de consulta. Tickets solo ofrece Ver y Editar estado, porque la API actual no permite que un administrador cree o elimine tickets.

En administración, la barra de progreso usa la variante `inset` y se sitúa en el borde inferior del topbar, desde el borde del contenido hasta la derecha. Los SVG originales de `public/brand/animated` ahora incluyen animaciones CSS y respetan movimiento reducido.


## Checkbox (`app-checkbox`) y movimiento de modales

`forms/checkbox` conserva un input nativo accesible con un diseño propio según los tokens del tema. Acepta `checked`, `disabled`, `indeterminate`, `label` y `text`; emite `checkedChange`. El checkbox de las tablas usa este componente.

`feedback/modal-motion.ts` proporciona la animación compartida de salida. Los editores y las confirmaciones mantienen su vista montada hasta terminarla. Cada apertura vuelve a ejecutar la entrada y todos los efectos respetan la preferencia de movimiento reducido. Los formularios de usuarios y de registros están centrados en la ventana.


## Campo numérico (`app-number-input`)

`forms/number-input` usa un input numérico accesible sin los spinners del navegador. Ofrece controles propios de disminuir/aumentar, respeta `min`, `max`, `step`, `required` y `disabled`, y emite `valueChange` como cadena. Acepta `label`, `value` y `placeholder`. Conserva la validación y la navegación numérica nativas, incluidos los límites del formulario.


## Tablas en móvil

Por debajo de 768px, la tabla comparte los mismos datos y selección con `app-admin-record-card`. La botonera usa `mobileIcon` para ocultar visualmente la descripción de cada acción y conservar su nombre accesible. Los filtros muestran las acciones junto a la búsqueda. El ordenamiento móvil ofrece columna y dirección, y el paginador compacto mantiene cantidad, conteo y anterior/siguiente, usando las mismas consultas paginadas del servidor.


## Módulos de contenido

`pages/admin/admin-content/content-modules.ts` centraliza las nueve entradas de contenido del sidebar y sus rutas. Todas usan el editor existente con `contentSection` en los datos de ruta y conservan el guard de administrador. `/admin/contenido` redirige a `/admin/empresas`. El sidebar permite desplazarse sin ocultar las entradas inferiores.


## Indicador de contraseña (`app-password-strength`)

`forms/password-strength` muestra cuatro barras de nivel estimado y los cinco requisitos de la política existente. Comparte `passwordMeetsPolicy` con el formulario de Perfil y no envía ni almacena el valor. En Perfil, Seguridad contiene solo el cambio de contraseña y su confirmación visual. Los selects e inputs comparten el fondo `surface-card` en estado habilitado.

## Accesos y navegación del administrador

`AccessService` carga `/api/access/me`. El sidebar dibuja exclusivamente el árbol entregado por el backend, incluidos nombre, icono, orden, grupos y permisos. `CONTENT_MODULES` registra las vistas implementadas y no es la fuente de navegación. El guard consulta los accesos al navegar, incluso al cambiar `section`; los tipos de cuenta antiguos no conceden permisos administrativos.

`ModuleActions` comprueba las acciones del recurso de la vista actual y `AccessAction` permite aplicar la misma regla a operaciones del CMS. Ambos ocultan acciones sin autorización; la API también las rechaza independientemente. La página Seguridad y accesos ofrece roles, permisos, menús, asignaciones por usuario y auditoría. El menú de usuario muestra los nombres de los roles recibidos del backend.

Al redimensionar, el layout conserva dos columnas y anima el ancho reservado al sidebar hasta cero; el sidebar mantiene posicionamiento fijo y cambia su transformación/opacidad. El botón hamburguesa anima ancho, opacidad y escala sin depender de `display:none`. La preferencia de colapso de escritorio se conserva y el drawer móvil se cierra al volver al escritorio. El foco se traslada al control visible cuando hace falta y se respeta `prefers-reduced-motion`.
