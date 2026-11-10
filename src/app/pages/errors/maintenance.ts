import { ErrorRecovery } from '../../core/errors/error-recovery';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ErrorPage } from './error-page';

/** 503 — mantenimiento programado. "Reintentar" vuelve a la ruta que falló; secundario lleva a contacto. */
@Component({
  selector: 'app-maintenance',
  imports: [ErrorPage],
  template: `
    <app-error-page
      code="503"
      accent="cyan"
      title="En mantenimiento"
      description="Estamos desplegando mejoras. El servicio vuelve en unos minutos."
      log="GET /api/health → 503 · maintenance"
      primaryLabel="Reintentar"
      secondaryLabel="Estado del servicio"
      (primaryClicked)="reload()"
      (secondaryClicked)="router.navigate(['/'], { fragment: 'contacto' })"
    />
  `,
})
export class Maintenance {
  protected readonly router = inject(Router);

  private readonly recovery = inject(ErrorRecovery);
  reload(): void {
    void this.recovery.retry();
  }
}
