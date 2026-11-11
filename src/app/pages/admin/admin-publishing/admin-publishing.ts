import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminShell } from '../admin-shell/admin-shell';
import { ApiService } from '../../../core/api.service';
import { AccessService } from '../../../core/access/access.service';
import { ToastService } from '../../../core/services/toast.service';
import type { ApiPublishRun, ApiPublishStatus } from '../../../core/models/api.models';
import { Badge, BadgeTone } from '../../../ui/data-display/badge/badge';
import { Icon } from '../../../ui/data-display/icon/icon';
import { Button } from '../../../ui/actions/button/button';
import { Checkbox } from '../../../ui/forms/checkbox/checkbox';

const ACTIVE_POLL_MS = 6_000;
const IDLE_POLL_MS = 30_000;
/** A requested run takes a few seconds to show up in the history. */
const DISPATCH_GRACE_MS = 45_000;

/**
 * The public website is prerendered: what visitors see is the CMS content of the last publish.
 * This page shows whether saved changes are still waiting, lets an admin publish them and
 * follows every publish until it is live.
 */
@Component({
  selector: 'app-admin-publishing',
  imports: [AdminShell, DatePipe, Badge, Icon, Button, Checkbox],
  templateUrl: './admin-publishing.html',
  styleUrl: './admin-publishing.css',
})
export class AdminPublishing {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly access = inject(AccessService);

  readonly status = signal<ApiPublishStatus | null>(null);
  readonly failed = signal(false);
  readonly requesting = signal(false);
  readonly savingSettings = signal(false);
  private readonly dispatchedAt = signal(0);
  private timer?: ReturnType<typeof setTimeout>;
  private destroyed = false;

  readonly canPublish = computed(() => this.access.can('publishing', 'create'));
  readonly canConfigure = computed(() => this.access.can('publishing', 'update'));

  /** One headline state for the whole site, from the most to the least urgent. */
  readonly summary = computed<{ tone: BadgeTone; label: string; text: string }>(() => {
    const s = this.status();
    if (!s) return { tone: 'neutral', label: 'Cargando', text: '' };
    if (!s.configured)
      return {
        tone: 'danger',
        label: 'Sin configurar',
        text: 'Falta configurar en el servidor el repositorio y el token de publicación.',
      };
    if (s.publishing)
      return {
        tone: 'info',
        label: 'Publicando',
        text: 'Se están generando las páginas con el contenido actual. Suele tardar de 2 a 4 minutos.',
      };
    if (s.pendingChanges)
      return {
        tone: 'warning',
        label: 'Cambios sin publicar',
        text: s.autoPublish
          ? 'Hay cambios guardados que la web aún no muestra. Se publicarán solos en breve, o puedes publicarlos ahora.'
          : 'Hay cambios guardados que la web aún no muestra. Publícalos cuando estén listos.',
      };
    return {
      tone: 'success',
      label: 'Al día',
      text: 'La web muestra todo el contenido guardado en el CMS.',
    };
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      clearTimeout(this.timer);
    });
    this.load();
  }

  load(): void {
    clearTimeout(this.timer);
    this.api.publishStatus().subscribe({
      next: (status) => {
        this.failed.set(false);
        this.status.set(status);
        this.schedule();
      },
      error: () => {
        if (!this.status()) this.failed.set(true);
        this.schedule();
      },
    });
  }

  private schedule(): void {
    if (this.destroyed) return;
    const waitingForRun = Date.now() - this.dispatchedAt() < DISPATCH_GRACE_MS;
    const delay = this.status()?.publishing || waitingForRun ? ACTIVE_POLL_MS : IDLE_POLL_MS;
    this.timer = setTimeout(() => this.load(), delay);
  }

  publish(): void {
    if (this.requesting()) return;
    this.requesting.set(true);
    this.api.publishSite().subscribe({
      next: () => {
        this.requesting.set(false);
        this.dispatchedAt.set(Date.now());
        this.toast.success('Publicación iniciada', 'Verás el avance en el historial.');
        this.load();
      },
      error: (error: HttpErrorResponse) => {
        this.requesting.set(false);
        this.toast.error(
          'No se pudo publicar',
          error.error?.errors?.message ?? 'Inténtalo nuevamente.',
        );
      },
    });
  }

  setAutoPublish(autoPublish: boolean): void {
    if (this.savingSettings()) return;
    this.savingSettings.set(true);
    this.api.updatePublishSettings(autoPublish).subscribe({
      next: () => {
        this.savingSettings.set(false);
        this.status.update((s) => (s ? { ...s, autoPublish } : s));
        this.toast.success(
          'Preferencia guardada',
          autoPublish
            ? 'Los cambios del CMS se publicarán solos.'
            : 'Los cambios se publicarán solo cuando lo indiques.',
        );
      },
      error: (error: HttpErrorResponse) => {
        this.savingSettings.set(false);
        this.toast.error(
          'No pudimos guardar',
          error.error?.errors?.message ?? 'Inténtalo nuevamente.',
        );
        this.load();
      },
    });
  }

  runState(run: ApiPublishRun): { tone: BadgeTone; label: string } {
    if (run.status === 'queued' || run.status === 'waiting' || run.status === 'pending')
      return { tone: 'neutral', label: 'En cola' };
    if (run.status !== 'completed') return { tone: 'info', label: 'En curso' };
    switch (run.conclusion) {
      case 'success':
        return { tone: 'success', label: 'Publicado' };
      case 'cancelled':
        return { tone: 'neutral', label: 'Reemplazado' };
      case 'skipped':
        return { tone: 'neutral', label: 'Omitido' };
      default:
        return { tone: 'danger', label: 'Falló' };
    }
  }

  origin(run: ApiPublishRun): string {
    return run.event === 'workflow_dispatch' ? 'Cambios del CMS' : 'Actualización del sitio';
  }

  duration(run: ApiPublishRun): string {
    if (run.status !== 'completed' || !run.startedAt) return '—';
    const seconds = Math.max(0, Math.round((Date.parse(run.updatedAt) - Date.parse(run.startedAt)) / 1000));
    return seconds < 60 ? `${seconds} s` : `${Math.floor(seconds / 60)} min ${seconds % 60} s`;
  }
}
