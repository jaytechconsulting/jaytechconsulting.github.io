import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap, tap, timeout } from 'rxjs';
import { Badge } from '../../../ui/data-display/badge/badge';
import { Button } from '../../../ui/actions/button/button';
import { Wordmark } from '../../../ui/brand/wordmark/wordmark';
import { WhatsAppFab } from '../../../ui/marketing/whatsapp-fab/whatsapp-fab';
import { Project } from '../../../core/projects/projects-data';
import { ProjectsService } from '../../../core/projects/projects.service';
import { SeoService } from '../../../core/services/seo.service';
import { Reveal } from '../../../ui/behaviors/reveal';

@Component({
  selector: 'app-project-detail',
  imports: [Badge, Button, Wordmark, WhatsAppFab, Reveal],
  templateUrl: './project-detail.html',
  styleUrl: './project-detail.css',
})
export class ProjectDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly projectsService = inject(ProjectsService);
  private readonly seo = inject(SeoService);

  private readonly projectState = signal<Project | undefined>(undefined);
  readonly notFound = signal(false);
  related: Project[] = [];
  metaRows: [string, string][] = [];

  get project(): Project | undefined {
    return this.projectState();
  }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        tap(() => {
          this.notFound.set(false);
          this.projectState.set(undefined);
        }),
        switchMap((params) =>
          this.projectsService.bySlug(params.get('slug') ?? '').pipe(timeout({ first: 10000 })),
        ),
      )
      .subscribe({
        next: (project) => {
          this.projectState.set(project);
          this.seo.update({
            title: `${project.title} para ${project.client} | Jaytech`,
            description:
              project.summary ||
              `Proyecto de ${project.cat.toLowerCase()} desarrollado por Jaytech para ${project.client}.`,
            path: `/proyectos/${project.slug}`,
            image: project.logo,
            type: 'article',
          });
          this.metaRows = [
            ['Cliente', project.client],
            ['Categoría', project.cat],
            ['Año', project.year],
            ['Duración', project.duration],
          ];
        },
        error: () => {
          this.seo.update({
            title: 'Proyecto no encontrado | Jaytech',
            description: 'El proyecto solicitado no está disponible.',
            path: this.router.url,
            index: false,
          });
          this.notFound.set(true);
          this.projectState.set(undefined);
          this.metaRows = [];
        },
      });
  }

  back(): void {
    this.router.navigate(['/proyectos']);
  }
  openRelated(slug: string): void {
    this.router.navigate(['/proyectos', slug]);
  }
  requestProposal(): void {
    this.router.navigate(['/solicitar-propuesta']);
  }
}
