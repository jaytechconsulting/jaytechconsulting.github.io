import { Icon } from '../../../ui/data-display/icon/icon';
import { NumberInput } from '../../../ui/forms/number-input/number-input';
import { closeModal } from '../../../ui/feedback/modal-motion';
import { Component, afterNextRender, ElementRef, computed, inject, input, output, signal, viewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Button } from '../../../ui/actions/button/button';
import { Select, SelectOption } from '../../../ui/forms/select/select';
import { ToastService } from '../../../core/services/toast.service';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api.models';
import type { AdminRow } from '../admin-table/admin-table';
interface Field {key:string;label:string;type?:string;options?:SelectOption[];required?:boolean;min?:number;max?:number;}
@Component({selector:'app-record-editor',imports:[Button,Select,NumberInput,Icon],templateUrl:'./record-editor.html',styleUrl:'./record-editor.css'})
export class RecordEditor {
 readonly resource=input.required<string>();readonly row=input<AdminRow|null>(null);readonly readOnly=input(false);
 readonly closed=output<void>();readonly saved=output<void>();readonly modal=viewChild<ElementRef<HTMLDialogElement>>('modal');
 private readonly http=inject(HttpClient);private readonly toast=inject(ToastService);
 readonly closing=signal(false);
 readonly data=signal<Record<string,unknown>>({});readonly busy=signal(false);readonly failed=signal(false);
 readonly ticketStates=[{value:'Open',label:'Abierto'},{value:'InReview',label:'En revisión'},{value:'InProgress',label:'En progreso'},{value:'Resolved',label:'Resuelto'},{value:'Closed',label:'Cerrado'}];
 readonly fields=computed<Field[]>(()=>this.resource()==='proyectos' ? [
 {key:'title',label:'Proyecto',required:true},{key:'clientName',label:'Cliente',required:true},{key:'category',label:'Categoría',required:true},
 {key:'year',label:'Año',type:'number',required:true,min:2000,max:2100},{key:'progress',label:'Progreso (%)',type:'number',required:true,min:0,max:100},
 {key:'status',label:'Estado',options:['En desarrollo','QA','Entregado'],required:true},{key:'description',label:'Descripción',type:'textarea',required:true}]
 :this.resource()==='tickets' ? [{key:'title',label:'Asunto'},{key:'description',label:'Descripción',type:'textarea'},{key:'status',label:'Estado',options:this.ticketStates}]
 :[{key:'name',label:'Nombre',required:true},{key:'email',label:'Correo',type:'email',required:true},...(!this.row() ? [{key:'password',label:'Contraseña temporal',type:'password',required:true}]:[])]);
 placeholder(key:string):string {
  const placeholders:Record<string,string>={title:this.resource()==='tickets'?'Ej. Necesito ayuda con mi proyecto':'Ej. Portal de clientes',clientName:'Ej. Comercial Andina',category:'Ej. Aplicación web',year:'Ej. 2026',progress:'De 0 a 100',description:'Describe el proyecto o los detalles de la solicitud…',name:'Ej. María Fernández',email:'nombre@empresa.com',password:'Mínimo 8 caracteres',status:'Selecciona un estado'};
  return placeholders[key] ?? 'Ingresa un valor';
 }
 text(key:string):string{return String(this.data()[key] ?? '');}
 set(key:string,value:string,type?:string):void{this.data.update(d=>({...d,[key]:type==='number' && value!==''?Number(value):value}));}
 constructor(){afterNextRender(()=>{this.modal()!.nativeElement.showModal();this.load();});}
 load():void{
  const row=this.row();
  if(!row){this.data.set(this.resource()==='proyectos'?{title:'',clientName:'',category:'',year:new Date().getFullYear(),progress:0,status:'En desarrollo',description:'',tags:[],isPublished:false,displayOrder:0}:{name:'',email:'',password:'',role:'Client'});return;}
  this.busy.set(true);this.failed.set(false);
  const path=this.resource()==='proyectos'?`projects/admin/${row.id}`:this.resource()==='tickets'?`tickets/${row.id}`:`users/${row.id}`;
  this.http.get<ApiResponse<Record<string,unknown>>>(`${environment.apiUrl}/${path}`).subscribe({next:r=>{
   const d=r.data;if(this.resource()==='tickets' && typeof d['status']==='number')d['status']=['Open','InReview','InProgress','Resolved','Closed'][d['status']];
   this.data.set(d);this.busy.set(false);
  },error:()=>{this.busy.set(false);this.failed.set(true);this.toast.error('No pudimos abrir el registro','Inténtalo nuevamente.');}});
 }
 save(event:Event):void{
  event.preventDefault();if(this.busy() || this.closing() || this.readOnly() || this.failed())return;
  this.busy.set(true);const id=this.row()?.id;const base=this.resource()==='proyectos'?'projects':this.resource()==='tickets'?'tickets':'users';
  // The compact account editor only owns these fields; keep the expanded profile intact.
  const body=this.resource()==='tickets'?{status:['Open','InReview','InProgress','Resolved','Closed'].indexOf(String(this.data()['status']))}:base==='users'?{name:this.data()['name'],email:this.data()['email'],role:this.data()['role'],...(!id?{password:this.data()['password']}:{})}:this.data();
  const path=`${environment.apiUrl}/${base}${id?'/'+id:''}`;
  const request=this.resource()==='tickets'?this.http.patch(path,body):id?this.http.put(path,body):this.http.post(path,body);
  request.subscribe({next:()=>{this.busy.set(false);this.toast.success(id?'Registro actualizado':'Registro creado');void this.dismiss(true);},error:()=>{this.busy.set(false);this.toast.error('No pudimos guardar','Revisa los campos e inténtalo de nuevo.');}});
 }
 close():void{if(!this.busy())void this.dismiss(false);}
 private async dismiss(saved:boolean):Promise<void>{
  if(this.closing())return;this.closing.set(true);
  await closeModal(this.modal()?.nativeElement);
  this.modal()?.nativeElement.close();if(saved)this.saved.emit();else this.closed.emit();
 }
}
