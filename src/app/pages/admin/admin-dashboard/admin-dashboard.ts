import { ToastService } from '../../../core/services/toast.service';
import { Component, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api.models';
interface Dashboard { clients:number; projects:number; openTickets:number; users:number; months:{label:string;count:number}[]; projectStates:{label:string;count:number}[]; urgentTickets:{id:string;code:string;title:string;client:string}[]; }
@Component({selector:'app-admin-dashboard',imports:[RouterLink],templateUrl:'./admin-dashboard.html',styleUrl:'./admin-dashboard.css'})
export class AdminDashboard {
  private readonly http=inject(HttpClient);
  private readonly toast=inject(ToastService);
  readonly data=signal<Dashboard|null>(null); readonly loading=signal(true); readonly error=signal(false);
  readonly maxTickets=computed(()=>Math.max(1,...(this.data()?.months.map(x=>x.count) ?? [])));
  readonly maxProjects=computed(()=>Math.max(1,...(this.data()?.projectStates.map(x=>x.count) ?? [])));
  readonly metrics=computed(()=>{const d=this.data();return d ? [{label:'Clientes activos',value:d.clients,section:'clientes'},{label:'Proyectos',value:d.projects,section:'proyectos'},{label:'Tickets pendientes',value:d.openTickets,section:'tickets'},{label:'Usuarios',value:d.users,section:'usuarios'}] : [];});
  constructor(){this.load();}
  load():void{this.loading.set(true);this.error.set(false);this.http.get<ApiResponse<Dashboard>>(`${environment.apiUrl}/admin/dashboard`).subscribe({next:r=>{this.data.set(r.data);this.loading.set(false);},error:()=>{this.toast.error('No pudimos cargar el dashboard','Inténtalo nuevamente en unos momentos.');this.error.set(true);this.loading.set(false);}});}
}
