import { ErrorRecovery } from '../../core/error-recovery';
import { ActivatedRoute } from '@angular/router';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ErrorPage } from './error-page';

/** 404 — ruta inexistente. Wildcard del router. */
@Component({
  selector: 'app-not-found',
  imports: [ErrorPage],
  template: `
    <app-error-page
      code="404"
      accent="cyan"
      title="Página no encontrada"
      description="La ruta que buscas no existe o fue movida. Revisa la dirección o vuelve al inicio."
      [log]="log"
      primaryLabel="Reintentar"
      secondaryLabel="Volver al inicio"
      (primaryClicked)="recovery.retry()"
      (secondaryClicked)="router.navigateByUrl('/')"
    />
  `,
})
export class NotFound {
  protected readonly router = inject(Router);
  protected readonly recovery=inject(ErrorRecovery);
  protected readonly log=`GET ${inject(ActivatedRoute).snapshot.queryParamMap.get('path')??'/'} → 404 · not_found`;
}
