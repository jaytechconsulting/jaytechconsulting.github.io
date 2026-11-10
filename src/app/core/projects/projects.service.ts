import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../api.service';
import type { ApiProject } from '../models/api.models';
import { Project } from './projects-data';

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function projectGlyph(category: string): string {
  if (category === 'Landing') return '▲';
  if (category === 'Automatización') return '⬡';
  if (category === 'Integración') return '⬢';
  return '◆';
}

function toProject(project: ApiProject): Project {
  return {
    slug: project.slug || slugify(`${project.clientName}-${project.title}`),
    title: project.title,
    client: project.clientName,
    cat: project.category,
    year: String(project.year),
    color: project.accentColor || '#FF6B35',
    tags: project.tags ?? [],
    metric: project.metric || '',
    glyph: projectGlyph(project.category),
    logo: project.imageUrl || '',
    duration: 'A medida',
    desc: project.description,
    summary: project.description,
    challenge: project.challenge || '',
    solution: project.solution || '',
    results: [
      [project.metric || 'A medida', 'resultado'],
      [project.category, 'tipo'],
      [String(project.year), 'año'],
    ],
    progress: project.progress,
    status: project.status,
  };
}

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private readonly api = inject(ApiService);

  list(): Observable<Project[]> {
    return this.api.projects().pipe(map((projects) => projects.map(toProject)));
  }

  clientList(): Observable<Project[]> {
    return this.api.clientProjects().pipe(map((projects) => projects.map(toProject)));
  }

  bySlug(slug: string): Observable<Project> {
    return this.api.project(slug).pipe(map(toProject));
  }
}
