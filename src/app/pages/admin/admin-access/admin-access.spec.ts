import {Component,input,signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {ActivatedRoute,convertToParamMap,provideRouter} from '@angular/router';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController,provideHttpClientTesting} from '@angular/common/http/testing';
import {of} from 'rxjs';
import {vi} from 'vitest';
import {AdminAccess} from './admin-access';
import {AdminShell} from '../admin-shell/admin-shell';
import {AccessService} from '../../../core/access.service';
import {ToastService} from '../../../core/services/toast.service';
import {DialogService} from '../../../core/services/dialog.service';
@Component({selector:'app-admin-shell',template:'<ng-content/>'})class ShellStub{readonly title=input('');readonly active=input('');}
const metadata={roles:[{id:'role',code:'operator',name:'Operador',isActive:true,isSystem:false,permissionIds:['read','edit']}],permissions:[{id:'read',code:'users.read',resource:'users',action:'read',name:'Ver usuarios',isActive:true},{id:'edit',code:'users.update',resource:'users',action:'update',name:'Editar usuarios',isActive:true}],menus:[]};
describe('Access administration',()=>{
 let http:HttpTestingController;
 beforeEach(()=>{TestBed.configureTestingModule({imports:[AdminAccess],providers:[provideHttpClient(),provideHttpClientTesting(),provideRouter([]),{provide:ActivatedRoute,useValue:{paramMap:of(convertToParamMap({view:'roles'}))}},{provide:AccessService,useValue:{currentMenu:()=>({label:'Roles'}),allowed:()=>true,can:()=>true,load:()=>of({})}},{provide:ToastService,useValue:{success:vi.fn(),error:vi.fn()}},{provide:DialogService,useValue:{confirm:vi.fn(async()=>true)}}]});TestBed.overrideComponent(AdminAccess,{remove:{imports:[AdminShell]},add:{imports:[ShellStub]}});http=TestBed.inject(HttpTestingController);});
 afterEach(()=>http.verify());
 async function setup(){const fixture=TestBed.createComponent(AdminAccess);fixture.detectChanges();http.expectOne(r=>r.url.endsWith('/access/state')).flush({data:metadata});await fixture.whenStable();fixture.detectChanges();return{fixture,component:fixture.componentInstance};}
 it('loads actual roles and renders their permission matrix',async()=>{const {fixture,component}=await setup();await component.select('role');fixture.detectChanges();expect(component.readOnly()).toBe(false);expect(component.grantIds().has('edit')).toBe(true);expect(fixture.nativeElement.textContent).toContain('Ver usuarios');component.edit();expect(component.readOnly()).toBe(false);component.toggleGrant('edit',false);expect(component.grantIds().has('edit')).toBe(false);});
 it('previews inherited grants with individual denials',async()=>{const {component}=await setup();component.chosenRoles.set(new Set(['role']));expect(component.effective().has('edit')).toBe(true);component.setOverride('edit','deny');expect(component.effective().has('edit')).toBe(false);component.setOverride('edit','');expect(component.effective().has('edit')).toBe(true);});
 it('allows protected role metadata while keeping permissions and status locked',async()=>{
  const {component,fixture}=await setup();component.create();expect(component.draftErrors()['code']).toBeTruthy();component.state.update(s=>({...s,roles:s.roles.map(r=>({...r,isSystem:true}))}));await component.select('role');fixture.detectChanges();
  expect(component.readOnly()).toBe(false);expect(fixture.nativeElement.querySelector('app-input[label=Nombre] input').disabled).toBe(false);expect(Array.from(fixture.nativeElement.querySelectorAll('input[type=checkbox]')).every((input:any)=>input.disabled)).toBe(true);
  component.toggleGrant('edit',false);expect(component.grantIds().has('edit')).toBe(true);
 });
 it('saves a sibling move atomically and immediately updates the local menu order',async()=>{
  const {component}=await setup();component.view.set('menus');const menu=(id:string)=>({id,code:id,label:id,route:'/admin',section:id,icon:'user',parentId:null,permissionId:'read',sortOrder:0,isActive:true});component.state.update(state=>({...state,menus:[menu('a'),menu('b'),menu('c')]}));
  const save=component.moveMenu('a','c',true);const request=http.expectOne(r=>r.url.endsWith('/access/menus/order'));expect(request.request.method).toBe('PUT');expect(request.request.body).toEqual({parentId:null,menuIds:['b','c','a'],expectedMenuIds:['a','b','c']});
  request.flush({data:{saved:true}});await save;expect(component.state().menus.map(menu=>menu.id)).toEqual(['b','c','a']);expect(component.state().menus.map(menu=>menu.sortOrder)).toEqual([0,10,20]);expect(component.busy()).toBe(false);
 });
 it('does not reorder across groups or while search is filtering the tree',async()=>{
  const {component}=await setup();component.view.set('menus');const base={code:'menu',label:'Menu',route:'/admin',section:'resumen',icon:'user',permissionId:'read',sortOrder:0,isActive:true};component.state.update(state=>({...state,menus:[{...base,id:'a',parentId:null},{...base,id:'b',parentId:'group'}]}));
  await component.moveMenu('a','b',true);http.expectNone(r=>r.url.endsWith('/access/menus/order'));component.query.set('Menu');expect(component.canReorder()).toBe(false);
 });

 it('shows the drop marker after the complete subtree and can cancel a drag',async()=>{
  const {component}=await setup();component.view.set('menus');const base={code:'menu',label:'Menu',route:null,section:null,icon:'user',permissionId:null,sortOrder:0,isActive:true};component.state.update(state=>({...state,menus:[{...base,id:'group',parentId:null},{...base,id:'other',parentId:null},{...base,id:'child',parentId:'group'}]}));
  expect(component.menuRows().map(row=>row.id)).toEqual(['group','child','other']);component.dropTarget.set({id:'group',after:true});expect(component.dropAfterRowId()).toBe('child');component.draggingId.set('other');component.dragPoint.set({x:10,y:20});component.cancelMenuDrag();expect(component.draggingId()).toBeNull();expect(component.dragPoint()).toBeNull();expect(component.dropTarget()).toBeNull();
 });

 it('keeps roles read-only for users without update permission',async()=>{
  const {component}=await setup();vi.spyOn(TestBed.inject(AccessService),'can').mockReturnValue(false);await component.select('role');expect(component.readOnly()).toBe(true);component.edit();component.toggleGrant('edit',false);expect(component.readOnly()).toBe(true);expect(component.grantIds().has('edit')).toBe(true);
 });
 it('saves edited role metadata and permissions through the backend',async()=>{
  const {component}=await setup();await component.select('role');component.set('name','Operador actualizado');component.toggleGrant('edit',false);const saving=component.save(new Event('submit'));
  const request=http.expectOne(r=>r.url.endsWith('/access/roles/role'));expect(request.request.method).toBe('PUT');expect(request.request.body.name).toBe('Operador actualizado');expect(request.request.body.permissionIds).toEqual(['read']);request.flush({data:{saved:true}});
  await vi.waitFor(()=>http.expectOne(r=>r.url.endsWith('/access/state')).flush({data:metadata}));await saving;
 });

});
