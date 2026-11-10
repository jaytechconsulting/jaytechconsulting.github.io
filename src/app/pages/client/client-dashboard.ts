import { ToastService } from '../../core/services/toast.service';
import { firstValueFrom } from 'rxjs';
import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { ProjectsService } from '../../core/projects/projects.service';
import { Router } from '@angular/router';
import { Card } from '../../ui/data-display/card/card';
import { Badge, type BadgeTone } from '../../ui/data-display/badge/badge';
import { Button } from '../../ui/actions/button/button';
import { Tag } from '../../ui/data-display/tag/tag';
import { IconButton } from '../../ui/actions/icon-button/icon-button';
import { Wordmark } from '../../ui/brand/wordmark/wordmark';
import { AuthService } from '../../core/auth/auth.service';
import { TicketsService } from '../../core/support/tickets.service';
import { ApiService } from '../../core/api.service';
import { Icon } from '../../ui/data-display/icon/icon';
import type { ApiCoursePurchase } from '../../core/models/api.models';

interface NavItem {
  id: string;
  label: string;
  icon: string;
}

interface ProjectItem {
  slug: string;
  name: string;
  progress: number;
  status: [string, BadgeTone];
  stack: string[];
}

interface ActivityItem {
  verb: string;
  subject: string;
  time: string;
}

const NAV: NavItem[] = [
  { id: 'resumen', label: 'Resumen', icon: '◧' },
  { id: 'proyectos', label: 'Proyectos', icon: '▤' },
  { id: 'tickets', label: 'Tickets', icon: '◇' },
  { id: 'cursos', label: 'Mis cursos', icon: '▣' },
  { id: 'facturas', label: 'Facturas', icon: '▦' },
  { id: 'archivos', label: 'Archivos', icon: '▥' },
];

const MATERIAL_ICON: Record<string, string> = {
  video: 'cmsanimacion',
  pdf: 'cmspaginas',
  archivo: 'folder',
};

const ACTIVITY: ActivityItem[] = [
  { verb: 'Se desplegó', subject: 'Landing campaña Q3', time: 'hace 2 h' },
  { verb: 'Nuevo comentario en', subject: 'DR-238', time: 'hace 5 h' },
  { verb: 'Factura emitida', subject: 'F-2026-041', time: 'ayer' },
  { verb: 'Se completó el hito', subject: 'Diseño de UI', time: 'hace 3 días' },
];

/** Client portal: overview, projects, activity and support tickets. */
@Component({
  selector: 'app-client-dashboard',
  imports: [Card, Badge, Button, Tag, IconButton, Wordmark, Icon],
  templateUrl: './client-dashboard.html',
})
export class ClientDashboard implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly ticketsService = inject(TicketsService);
  private readonly projectsService = inject(ProjectsService);
  private readonly api = inject(ApiService);

  readonly nav = NAV;
  readonly projects = signal<ProjectItem[]>([]);
  readonly tickets = this.ticketsService.tickets;
  readonly activity = ACTIVITY;
  readonly coursePurchases = signal<ApiCoursePurchase[]>([]);

  readonly user = this.auth.currentUser;

  readonly active = signal('resumen');
  readonly activeLabel = computed(() => this.nav.find((n) => n.id === this.active())?.label ?? '');
  ngOnInit(): void {
    this.projectsService
      .clientList()
      .subscribe((items) =>
        this.projects.set(
          items.map(
            (p) =>
              ({
                slug: p.slug,
                name: p.title,
                progress: p.progress,
                status: [p.status, p.progress === 100 ? 'success' : 'warning'],
                stack: p.tags,
              }) as ProjectItem,
          ),
        ),
      );
    this.ticketsService.load();
    this.api.myCoursePurchases().subscribe((purchases) => this.coursePurchases.set(purchases));
  }

  materialIcon(type: string): string {
    return MATERIAL_ICON[type] ?? 'folder';
  }

  navClasses(id: string): string {
    const on = id === this.active();
    return [
      'flex items-center gap-3 rounded-md px-3.5 py-[11px] text-left font-body text-[15px] transition-colors duration-200 ease-out',
      on
        ? 'bg-[image:var(--gradient-hud)] font-semibold text-ink-950 shadow-glow-soft-cyan'
        : 'font-medium text-text-inverse-muted hover:text-text-on-inverse',
    ].join(' ');
  }

  progressBarClass(progress: number): string {
    return progress === 100 ? 'bg-success' : 'bg-brand-orange';
  }

  openProject(slug: string): void {
    this.router.navigate(['/panel-cliente/proyectos', slug]);
  }

  openNewTicket(): void {
    this.router.navigateByUrl('/panel-cliente/tickets/nuevo');
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.auth.logout());
    } catch {
      this.toast.error('No pudimos cerrar la sesión', 'Inténtalo nuevamente.');
      return;
    }
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
