import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminShell } from './admin-shell/admin-shell';
import { AdminTable } from './admin-table/admin-table';
import { AdminDashboard } from './admin-dashboard/admin-dashboard';
@Component({selector:'app-admin-panel',imports:[AdminShell,AdminTable,AdminDashboard],templateUrl:'./admin-panel.html'})
export class AdminPanel {
  readonly active = signal('resumen');
  readonly labels: Record<string,string> = {resumen:'Dashboard',clientes:'Clientes',proyectos:'Proyectos',tickets:'Tickets'};
  constructor() { inject(ActivatedRoute).queryParamMap.pipe(takeUntilDestroyed()).subscribe(params => {const section=params.get('section') ?? 'resumen';this.active.set(this.labels[section] ? section : 'resumen');}); }
}
