import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController,provideHttpClientTesting} from '@angular/common/http/testing';
import {provideRouter} from '@angular/router';
import {AccessService,AccessSession} from './access.service';
import {ModuleActions} from '../ui/actions/module-actions/module-actions';
const session:AccessSession={canAdmin:true,roles:[{id:'role',code:'viewer',name:'Viewer'}],permissions:[{id:'read',code:'users.read',resource:'users',action:'read',name:'Ver usuarios'}],menus:[{id:'menu',code:'users',label:'Usuarios desde DB',route:'/admin',section:'usuarios',icon:'user',parentId:null,permissionId:'read',sortOrder:1,isActive:true}]};
describe('Dynamic backend access',()=>{
 let http:HttpTestingController;let access:AccessService;
 beforeEach(()=>{TestBed.configureTestingModule({providers:[provideHttpClient(),provideHttpClientTesting(),provideRouter([])]});http=TestBed.inject(HttpTestingController);access=TestBed.inject(AccessService);});
 afterEach(()=>http.verify());
 it('shares concurrent session requests and uses backend permissions',()=>{
  access.load().subscribe();access.load().subscribe();http.expectOne(r=>r.url.endsWith('/access/me')).flush({data:session});
  expect(access.can('users','read')).toBe(true);expect(access.can('users','update')).toBe(false);expect(access.menuFor('/admin?section=usuarios')?.label).toBe('Usuarios desde DB');expect(access.menuFor('/admin?section=proyectos')).toBeUndefined();
 });
 it('fails closed when backend access cannot be loaded',()=>{
  access.session.set(session);access.load(true).subscribe();http.expectOne(r=>r.url.endsWith('/access/me')).flush({}, {status:503,statusText:'Unavailable'});
  expect(access.session().permissions).toHaveLength(0);expect(access.session().menus).toHaveLength(0);
 });
 it('does not restore an old account session after logout',()=>{
  access.load().subscribe();const pending=http.expectOne(r=>r.url.endsWith('/access/me'));access.clear();pending.flush({data:session});
  expect(access.session().permissions).toHaveLength(0);expect(access.loaded()).toBe(false);
 });
 it('shows toolbar actions from the loaded permission set',()=>{
  access.session.set(session);access.url.set('/admin?section=usuarios');const fixture=TestBed.createComponent(ModuleActions);fixture.componentRef.setInput('selected','Ana');fixture.detectChanges();
  const labels=()=>Array.from(fixture.nativeElement.querySelectorAll('button')).map((button:any)=>button.textContent.trim());
  expect(labels()).toEqual(['Ver']);access.session.set({...session,permissions:[...session.permissions,{id:'edit',code:'users.update',resource:'users',action:'update',name:'Editar'}]});fixture.detectChanges();expect(labels()).toEqual(['Ver','Editar']);
 });
});
