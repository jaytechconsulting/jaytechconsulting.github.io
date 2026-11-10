# Jaytech · Frontend

Aplicación Angular standalone para la web pública, el administrador/CMS y el portal de clientes.

## Desarrollo

```sh
npm ci
npm start -- --port 4200
```

Frontend: `http://localhost:4200`. La API local se configura en `src/environments/environment.ts`; producción usa `environment.prod.ts`. Las claves privadas permanecen en el backend. Trabajar en `dev`; el backend tiene su propio repositorio.

## Estructura y reutilización

- [Arquitectura y patrones](docs/frontend-architecture.md): responsabilidades, servicios, consultas, imágenes, componentes y directivas.
- [Catálogo de componentes](src/app/ui/README.md): controles compartidos existentes.
- `src/app/core`: servicios, contratos y lógica por dominio.
- `src/app/ui`: componentes y comportamientos reutilizables.
- `src/app/pages`: composición y estado de cada pantalla.
- `public`: recursos estáticos de marca y del sitio.

## Validación

```sh
npm run check
npm run test:ci
npm run build -- --configuration production
```

Las pruebas usan Vitest y no realizan transacciones reales. `check` detecta también declaraciones e imports sin uso.

## Publicación

Un push a `main` activa `.github/workflows/deploy-pages.yml`. El `postbuild` prepara `404.html`, `.nojekyll` y la versión para GitHub Pages. Producción usa recursos con hash.

Los menús y permisos administrativos vienen del backend; registrar una ruta en Angular no concede acceso. Conservar cookies, CSRF y autorización al agregar funcionalidades.
