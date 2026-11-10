import { createLatestRequest } from '../../../core/http/latest-request';
import type { Project } from '../../../core/projects/projects-data';
import { backgroundStyle } from '../../../ui/styles/background-style';
import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { Badge } from '../../../ui/data-display/badge/badge';
import { Tag } from '../../../ui/data-display/tag/tag';
import { Button } from '../../../ui/actions/button/button';
import { Wordmark } from '../../../ui/brand/wordmark/wordmark';
import { WhatsAppFab } from '../../../ui/marketing/whatsapp-fab/whatsapp-fab';
import { ProjectsService } from '../../../core/projects/projects.service';
import { CmsContentService } from '../../../core/cms/cms-content.service';
import { Reveal } from '../../../ui/behaviors/reveal';

const FILTERS = ['Todos', 'Web', 'Landing', 'Automatización', 'Integración'];
const PAGE_SIZE = 6;
const STATS: [string, string][] = [
  ['+40', 'proyectos entregados'],
  ['12', 'sectores'],
  ['98%', 'clientes que repiten'],
];

/** Public project gallery: category filters, search by name/client/tech and pagination. */
@Component({
  selector: 'app-project-list',
  imports: [Badge, Tag, Button, Wordmark, WhatsAppFab, RouterLink, Reveal],
  templateUrl: './project-list.html',
})
export class ProjectList implements OnInit {
  private readonly router = inject(Router);
  private readonly projectsService = inject(ProjectsService);
  private readonly cms = inject(CmsContentService);

  readonly filters = FILTERS;
  readonly stats = STATS;
  readonly pageDesign = computed(() => this.cms.pages().proyectos);
  readonly headerStyle = computed(() => backgroundStyle(this.pageDesign()));
  private readonly projectsRequest = createLatestRequest<Project[]>([]);
  readonly projects = this.projectsRequest.value;
  ngOnInit(): void {
    this.projectsRequest.load(this.projectsService.list());
  }

  readonly filter = signal('Todos');
  readonly query = signal('');
  readonly page = signal(1);

  readonly filtered = computed(() => {
    const f = this.filter();
    const q = this.query().trim().toLowerCase();
    return this.projects().filter((p) => {
      const okCat = f === 'Todos' || p.cat === f;
      const okQ =
        !q || (p.title + ' ' + p.client + ' ' + p.tags.join(' ')).toLowerCase().includes(q);
      return okCat && okQ;
    });
  });

  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.filtered().length / PAGE_SIZE)));
  readonly safePage = computed(() => Math.min(this.page(), this.pageCount()));
  readonly shown = computed(() => {
    const sp = this.safePage();
    return this.filtered().slice((sp - 1) * PAGE_SIZE, sp * PAGE_SIZE);
  });
  readonly pages = computed(() => Array.from({ length: this.pageCount() }, (_, i) => i + 1));

  filterCount(f: string): number {
    return f === 'Todos'
      ? this.projects().length
      : this.projects().filter((p) => p.cat === f).length;
  }

  setFilter(f: string): void {
    this.filter.set(f);
    this.page.set(1);
  }

  setQuery(value: string): void {
    this.query.set(value);
    this.page.set(1);
  }

  clearQuery(): void {
    this.setQuery('');
  }

  prevPage(): void {
    this.page.set(Math.max(1, this.safePage() - 1));
  }

  nextPage(): void {
    this.page.set(Math.min(this.pageCount(), this.safePage() + 1));
  }

  goToPage(n: number): void {
    this.page.set(n);
  }

  openProject(slug: string): void {
    this.router.navigate(['/proyectos', slug]);
  }

  requestProposal(): void {
    this.router.navigate(['/solicitar-propuesta']);
  }
}
