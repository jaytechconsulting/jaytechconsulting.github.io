import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NavigationEnd, Router } from '@angular/router';
import { Observable, catchError, finalize, map, of, shareReplay, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../environments/environment';
import { ErrorRecovery } from './error-recovery';
import { ApiResponse } from './models/api.models';
export interface AccessPermission {id:string;code:string;resource:string;action:string;name:string;description?:string|null;isActive?:boolean;isSystem?:boolean;}
export interface AccessMenu {id:string;code:string;label:string;route:string|null;section:string|null;icon:string;parentId:string|null;permissionId:string|null;sortOrder:number;isActive:boolean;}
export interface AccessSession {canAdmin:boolean;roles:{id:string;code:string;name:string}[];permissions:AccessPermission[];menus:AccessMenu[];}
const empty=():AccessSession=>({canAdmin:false,roles:[],permissions:[],menus:[]});
@Injectable({providedIn:'root'})
export class AccessService {
 private readonly http=inject(HttpClient);private readonly router=inject(Router);
 readonly session=signal<AccessSession>(empty());readonly loaded=signal(false);private pending?:Observable<AccessSession>;private generation=0;private refreshQueued=false;
 private readonly recovery=inject(ErrorRecovery);
 readonly url=signal(this.router.url);
 readonly currentMenu=computed(()=>this.menuFor(this.url()));
 readonly resource=computed(()=>this.session().permissions.find(p=>p.id===this.currentMenu()?.permissionId)?.resource ?? '');
 constructor(){this.router.events.pipe(takeUntilDestroyed()).subscribe(event=>{
  if(!(event instanceof NavigationEnd))return;
  this.url.set(event.urlAfterRedirects);
  if(!this.refreshQueued)return;this.refreshQueued=false;
  const destination=event.urlAfterRedirects;
  if(!this.loaded() || !/^\/admin(?:[/?#]|$)/.test(destination))return;
  const generation=this.generation;
  this.load(true).subscribe(session=>{
   if(generation!==this.generation || this.router.url!==destination)return;
   if(!this.loaded()){void this.router.navigateByUrl(this.recovery.error(503,destination),{replaceUrl:true});return;}
   const menu=this.menuFor(destination);
   const allowed=session.canAdmin && (destination.split(/[?#]/)[0]==='/admin/perfil' ||
    !!menu?.permissionId && session.permissions.some(p=>p.id===menu.permissionId));
   if(!allowed)void this.router.navigateByUrl(this.recovery.error(403,destination),{replaceUrl:true});
  });
 });}
 // Refresh permissions after the new module has activated; endpoints remain authoritative.
 revalidateAfterNavigation():void{this.refreshQueued=true;}
 load(force=false):Observable<AccessSession>{
  if(this.pending)return this.pending;if(this.loaded() && !force)return of(this.session());
  const generation=this.generation;
  this.pending=this.http.get<ApiResponse<AccessSession>>(`${environment.apiUrl}/access/me`).pipe(map(r=>generation===this.generation?r.data:empty()),tap(value=>{if(generation!==this.generation)return;this.session.set(value);this.loaded.set(true);}),catchError(()=>{if(generation===this.generation){this.session.set(empty());this.loaded.set(false);}return of(empty());}),finalize(()=>{if(generation===this.generation)this.pending=undefined;}),shareReplay({bufferSize:1,refCount:false}));return this.pending;
 }
 clear():void{this.refreshQueued=false;this.generation++;this.pending=undefined;this.session.set(empty());this.loaded.set(false);}
 can(resource:string,action:string):boolean{return !!resource && this.session().permissions.some(p=>p.resource===resource && p.action===action);}
 allowed(action:string):boolean{return this.can(this.resource(),action);}
 menuFor(url:string):AccessMenu|undefined{const tree=this.router.parseUrl(url);const path='/'+(tree.root.children['primary']?.segments.map(s=>s.path).join('/') ?? '');const section=tree.queryParams['section'] ?? (path==='/admin'?'resumen':null);return this.session().menus.find(m=>m.route===path && (m.section ?? (path==='/admin'?'resumen':null))===section);}
 link(menu:AccessMenu):string{return menu.route+(menu.section?'?section='+encodeURIComponent(menu.section):'');}
}
