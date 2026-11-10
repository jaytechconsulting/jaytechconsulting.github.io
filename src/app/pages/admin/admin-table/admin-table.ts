import { AdminRecordCard } from '../admin-record-card/admin-record-card';
import { Checkbox } from '../../../ui/forms/checkbox/checkbox';
import { ModuleActions } from '../../../ui/actions/module-actions/module-actions';
import { RecordEditor } from '../record-editor/record-editor';
import { DialogService } from '../../../core/services/dialog.service';
import { ToastService } from '../../../core/services/toast.service';
import { Select } from '../../../ui/forms/select/select';
import { Button } from '../../../ui/actions/button/button';
import { Icon } from '../../../ui/data-display/icon/icon';
import { Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Subject, catchError, map, of, switchMap, timer } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api.models';

export interface AdminRow { id: string; name: string; detail: string; client: string; status: string; role: string; progress: number; createdAt: string; }
type RefreshReason = 'load' | 'update' | 'reload' | 'clear';
interface Page { items: AdminRow[]; total: number; page: number; pageSize: number; totalPages: number; }
@Component({ selector: 'app-admin-table', imports: [DatePipe, Select, Button, Icon, ModuleActions, RecordEditor, Checkbox, AdminRecordCard], templateUrl: './admin-table.html', styleUrl: './admin-table.css' })
export class AdminTable {
  readonly resource = input.required<string>();
  readonly edit = output<AdminRow>();
  readonly view = output<AdminRow>();
  readonly create = output<void>();
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastService);
  private readonly dialogs = inject(DialogService);
  readonly selected = signal<AdminRow|null>(null);
  readonly editor = signal<{row:AdminRow|null;readOnly:boolean}|null>(null);
  statusTone(status:string):string {return ['Activo','Entregado','Resuelto','Atendido'].includes(status)?'success':['Abierto','En desarrollo','En progreso','Pendiente'].includes(status)?'warning':['QA','En revisión'].includes(status)?'info':'neutral';}
  select(row:AdminRow):void {if(!this.loading())this.selected.set(this.selected()?.id===row.id?null:row);}
  addRecord():void {if(this.external())this.create.emit();else this.editor.set({row:null,readOnly:false});}
  editRecord():void {const row=this.selected();if(!row)return;if(this.external())this.edit.emit(row);else this.editor.set({row,readOnly:false});}
  viewRecord():void {const row=this.selected();if(!row)return;if(this.external())this.view.emit(row);else this.editor.set({row,readOnly:true});}
  async removeRecord():Promise<void> {
    const row=this.selected();if(!row || this.loading() || this.dialogs.dialog())return;
    const isUser=['clientes','usuarios'].includes(this.resource());
    if(!await this.dialogs.confirm({title:isUser?'¿Inactivar cuenta?':'¿Eliminar proyecto?',message:isUser?`La cuenta de ${row.name} perderá acceso. Podrás reactivarla desde Usuarios.`:`Se eliminará ${row.name}. Esta acción no se puede deshacer.`,tone:'danger',confirmLabel:isUser?'Inactivar':'Eliminar'}))return;
    this.loading.set(true);
    this.http.delete(`${environment.apiUrl}/${isUser?'users':'projects'}/${row.id}`).subscribe({next:()=>{this.toast.success(isUser?'Cuenta inactivada':'Proyecto eliminado');this.refresh();},error:()=>{this.loading.set(false);this.toast.error('No pudimos completar la acción','Verifica los permisos e inténtalo de nuevo.');}});
  }
  /** Resources whose create/view/edit UI lives in the host page instead of the generic record editor. */
  private external():boolean {return ['usuarios','reclamaciones'].includes(this.resource());}
  /** Lists that are only consulted from here: no "Agregar" and no "Eliminar". */
  readonly readOnlyList = computed(() => ['tickets','reclamaciones'].includes(this.resource()));
  editorSaved():void {this.editor.set(null);this.refresh();}
  readonly searchInput = signal(''); readonly expandedFilters = signal(false);
  readonly search = signal(''); readonly status = signal(''); readonly role = signal('');
  readonly page = signal(1); readonly pageSize = signal(10); readonly sort = signal('name'); readonly direction = signal('asc');
  readonly loading = signal(true); readonly error = signal(false);
  readonly data = signal<Page>({ items: [], total: 0, page: 1, pageSize: 10, totalPages: 0 });
  private readonly requests = new Subject<RefreshReason>();
  private readonly typing = new Subject<{ value: string; immediate: boolean }>();
  readonly pageSizes = [10, 15, 25, 50, 100];
  readonly pageSizeOptions = this.pageSizes.map(value => String(value));
  readonly roleOptions = [{value:'',label:'Todos los roles'},{value:'admin',label:'Administrador'},{value:'client',label:'Cliente'}];
  readonly priorityOptions = [{value:'',label:'Todas las prioridades'},'Alta','Media','Baja'];
  readonly statusOptions = computed(() => [{value:'',label:'Todos los estados'},...this.statuses()]);
  readonly claimTypeOptions = [{value:'',label:'Todos los tipos'},'Reclamo','Queja'];
  readonly hasExtraFilters = computed(() => ['tickets','reclamaciones'].includes(this.resource()));
  readonly firstRecord = computed(() => this.data().total ? (this.data().page - 1) * this.data().pageSize + 1 : 0);
  readonly lastRecord = computed(() => Math.min(this.data().page * this.data().pageSize, this.data().total));
  readonly pageNumbers = computed(() => {
    const total = this.data().totalPages;
    const current = this.data().page;
    const result: (number | '…')[] = [];
    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || Math.abs(i - current) <= 1 || total <= 7) result.push(i);
      else if (result[result.length - 1] !== '…') result.push('…');
    }
    return result;
  });
  readonly title = computed(() => ({clientes:'Clientes', proyectos:'Proyectos', tickets:'Tickets', usuarios:'Usuarios', reclamaciones:'Libro de reclamaciones'}[this.resource()] ?? 'Registros'));
  readonly statuses = computed(() => this.resource() === 'proyectos' ? ['En desarrollo','QA','Entregado'] : this.resource() === 'tickets' ? ['Abierto','En revisión','En progreso','Resuelto','Cerrado'] : this.resource() === 'reclamaciones' ? ['Pendiente','Atendido'] : ['Activo','Inactivo']);
  readonly columns = computed(() => {
    if (this.resource() === 'reclamaciones') return [{key:'detail',label:'N.º de hoja'},{key:'name',label:'Consumidor'},{key:'client',label:'Correo'},{key:'role',label:'Tipo'},{key:'status',label:'Estado'},{key:'createdAt',label:'Registrado'}];
    const base = [{ key:'name', label: this.resource() === 'tickets' ? 'Asunto' : this.resource() === 'proyectos' ? 'Proyecto' : 'Nombre' }, { key:'detail', label: this.resource() === 'tickets' ? 'Código' : this.resource() === 'proyectos' ? 'Categoría' : 'Correo' }];
    if (['proyectos','tickets'].includes(this.resource())) base.push({key:'client',label:'Cliente'});
    if (this.resource() === 'usuarios') base.push({key:'role',label:'Tipo de cuenta'});
    if (this.resource() === 'tickets') base.push({key:'role',label:'Prioridad'});
    if (this.resource() === 'proyectos') base.push({key:'progress',label:'Progreso'});
    return [...base,{key:'status',label:'Estado'},{key:'createdAt',label:'Creado'}];
  });
  readonly sortOptions = computed(() => this.columns().map(column => ({value:column.key,label:column.label})));
  readonly cardColumns = computed(() => this.columns().filter(column => !['name','detail','status','progress'].includes(column.key)));
  mobileSort(key:string):void {if(this.loading())return;this.sort.set(key);this.page.set(1);this.refresh();}
  toggleDirection():void {if(this.loading())return;this.direction.set(this.direction()==='asc'?'desc':'asc');this.page.set(1);this.refresh();}
  constructor() {
    this.typing.pipe(switchMap(({value, immediate}) => immediate ? of(value) : timer(350).pipe(map(() => value))),takeUntilDestroyed()).subscribe(value => {
      if (value === this.search()) return;
      this.search.set(value); this.page.set(1); this.refresh();
    });
    this.requests.pipe(switchMap(reason => {
      if (!this.resource()) return of(null);
      this.loading.set(true); this.error.set(false); this.selected.set(null);
      return this.http.get<ApiResponse<Page>>(`${environment.apiUrl}/admin/lists/${this.resource()}`, {params:{page:this.page(),pageSize:this.pageSize(),search:this.search(),status:this.status(),role:this.role(),sort:this.sort(),direction:this.direction()}})
        .pipe(map(r => ({data:r.data,reason})),catchError(() => { this.error.set(true); this.toast.error('No pudimos cargar la tabla', 'Revisa tu conexión e inténtalo nuevamente.'); return of(null); }));
    }),takeUntilDestroyed()).subscribe(result => { if(result) {
      this.data.set(result.data); this.page.set(result.data.page);
      const titles:Record<RefreshReason,string>={load:'Tabla cargada',update:'Tabla actualizada',reload:'Tabla recargada',clear:'Filtros limpiados'};
      this.toast.success(titles[result.reason],`${result.data.total} registros encontrados.`,2500);
    } this.loading.set(false); });
    effect(() => { this.resource(); untracked(() => { this.searchInput.set(''); this.search.set(''); this.typing.next({value:'',immediate:true}); this.expandedFilters.set(false); this.status.set(''); this.role.set(''); this.page.set(1); const newestFirst = this.resource() === 'reclamaciones'; this.sort.set(newestFirst ? 'createdAt' : 'name'); this.direction.set(newestFirst ? 'desc' : 'asc'); this.refresh('load'); }); });
  }
  refresh(reason:RefreshReason='update'): void { this.requests.next(reason); }
  searchChanged(value: string): void { this.searchInput.set(value); this.typing.next({value, immediate:false}); }
  searchNow(): void { this.typing.next({value:this.searchInput(),immediate:true}); }
  clearFilters(): void {
    this.searchInput.set(''); this.search.set(''); this.typing.next({value:'',immediate:true});
    this.status.set(''); this.role.set(''); this.page.set(1); this.refresh('clear');
  }
  filterChanged(kind: 'status'|'role'|'pageSize', value: string): void { if(kind === 'pageSize') this.pageSize.set(Number(value)); else this[kind].set(value); this.page.set(1); this.refresh(); }
  order(key: string): void { if (this.loading()) return; this.direction.set(this.sort() === key && this.direction() === 'asc' ? 'desc' : 'asc'); this.sort.set(key); this.page.set(1); this.refresh(); }
  go(page: number): void { if (this.loading()) return; this.page.set(page); this.refresh(); }
  cell(row: AdminRow, key: string): string | number { return row[key as keyof AdminRow]; }
}
