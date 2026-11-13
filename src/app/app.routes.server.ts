import { inject } from '@angular/core';
import { RenderMode, ServerRoute } from '@angular/ssr';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './core/api.service';
import { COURSES } from './pages/asesorias/courses-data';

/**
 * Public pages are rendered to static HTML on every publish, with the published CMS content
 * inside. Private areas (login, client panel, admin) stay client-rendered: they depend on the
 * visitor's session and must never be baked into a shared file.
 *
 * Detail pages list their published records here. A record created after the last publish has
 * no file yet, so the host serves the client-rendered fallback until the next publish.
 */
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'terminos-y-condiciones', renderMode: RenderMode.Prerender },
  { path: 'avisos-legales', renderMode: RenderMode.Prerender },
  { path: 'libro-de-reclamaciones', renderMode: RenderMode.Prerender },
  { path: 'solicitar-propuesta', renderMode: RenderMode.Prerender },
  { path: 'conocenos', renderMode: RenderMode.Prerender },
  { path: 'proyectos', renderMode: RenderMode.Prerender },
  {
    path: 'proyectos/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () =>
      (await firstValueFrom(inject(ApiService).projects())).map(({ slug }) => ({ slug })),
  },
  { path: 'asesorias', renderMode: RenderMode.Prerender },
  {
    path: 'asesorias/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => COURSES.map(({ slug }) => ({ slug })),
  },
  { path: 'capacitaciones', renderMode: RenderMode.Prerender },
  {
    path: 'capacitaciones/:id',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () =>
      (await firstValueFrom(inject(ApiService).trainingPrograms({ pageSize: 100 }))).items.map(
        ({ id }) => ({ id }),
      ),
  },
  { path: 'cursos', renderMode: RenderMode.Prerender },
  { path: 'cursos/checkout', renderMode: RenderMode.Client },
  {
    path: 'cursos/:id',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () =>
      (await firstValueFrom(inject(ApiService).courses())).map(({ id, slug }) => ({ id: slug || id })),
  },
  { path: '**', renderMode: RenderMode.Client },
];
