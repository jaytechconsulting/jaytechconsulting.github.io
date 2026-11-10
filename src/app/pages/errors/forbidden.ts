import { ErrorRecovery } from '../../core/errors/error-recovery';
import { Component, inject } from '@angular/core';
import { ErrorPage } from './error-page';

/** 403 — sin permisos para la sección. Destino del guard en mismatch de rol. */
@Component({
  selector: 'app-forbidden',
  imports: [ErrorPage],
  template: `
    <app-error-page
      code="403"
      accent="yellow"
      title="Acceso restringido"
      description="No tienes permisos para ver esta sección. Inicia sesión con una cuenta autorizada."
      log="GET /admin → 403 · forbidden"
      primaryLabel="Reintentar"
      secondaryLabel="Iniciar sesión"
      (primaryClicked)="recovery.retry()"
      (secondaryClicked)="recovery.signIn()"
    />
  `,
})
export class Forbidden {
  protected readonly recovery = inject(ErrorRecovery);
}
