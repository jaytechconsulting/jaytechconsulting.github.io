import {Component,input,output} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {of,Subject,throwError} from 'rxjs';
import {vi} from 'vitest';
import {AdminUsers} from './admin-users';
import {AdminShell} from '../admin-shell/admin-shell';
import {AdminTable} from '../admin-table/admin-table';
import {UsersService} from '../../../core/users.service';
import {CatalogService} from '../../../core/catalog.service';
import {ApiService} from '../../../core/api.service';
import {AccessService} from '../../../core/access.service';
import {ToastService} from '../../../core/services/toast.service';
import {DialogService} from '../../../core/services/dialog.service';
@Component({selector:'app-admin-shell',template:'<ng-content/>'})class ShellStub{readonly title=input('');readonly active=input('');}
@Component({selector:'app-admin-table',template:''})class TableStub{readonly resource=input('');readonly create=output<void>();readonly edit=output<any>();readonly view=output<any>();}
const user={id:'u1',name:'Ana Garcia Lopez',email:'login@example.com',role:'client' as const,isActive:true,createdAt:'2026-11-01',givenNames:'Ana',paternalSurname:'Garcia',maternalSurname:'Lopez',documentType:'DNI',documentNumber:'12345678',phone:'999999999',contactEmail:'contact@example.com',sex:'F',avatarUrl:'https://example.com/photo.jpg',avatarZoom:1.5,avatarX:30,avatarY:60};
const item={id:1,code:'DNI',name:'DNI',inputKind:'digits',minLength:8,maxLength:8,minValue:null,maxValue:null};
describe('Complete user modal',()=>{
 let users:any;let api:any;let access:any;
 afterEach(()=>vi.unstubAllGlobals());
 beforeEach(()=>{vi.stubGlobal('ResizeObserver',class{observe(){}unobserve(){}disconnect(){}});users={get:vi.fn(()=>of(user)),create:vi.fn(()=>of(user)),update:vi.fn(()=>of(user)),remove:vi.fn(()=>of(undefined)),activate:vi.fn(()=>of(user))};api={lookupDocument:vi.fn(()=>of({givenNames:'Ana',paternalSurname:'Garcia',maternalSurname:'Lopez'}))};access={can:vi.fn(()=>true)};
 TestBed.configureTestingModule({imports:[AdminUsers],providers:[{provide:UsersService,useValue:users},{provide:ApiService,useValue:api},{provide:CatalogService,useValue:{profile:()=>of({documents:{items:[item,{...item,id:2,code:'RUC',name:'RUC',minLength:11,maxLength:11}]},sex:{items:[{...item,code:'F',name:'Femenino'}]}})}},{provide:AccessService,useValue:access},{provide:ToastService,useValue:{success:vi.fn(),error:vi.fn()}},{provide:DialogService,useValue:{dialog:()=>null,confirm:vi.fn(async()=>true)}}]});TestBed.overrideComponent(AdminUsers,{remove:{imports:[AdminShell,AdminTable]},add:{imports:[ShellStub,TableStub]}});});
 function setup(){const fixture=TestBed.createComponent(AdminUsers);fixture.detectChanges();return{fixture,component:fixture.componentInstance};}
 it('fetches and displays complete persisted data instead of only table columns',()=>{const {fixture,component}=setup();component.openEdit({...user,givenNames:undefined,phone:undefined});fixture.detectChanges();expect(users.get).toHaveBeenCalledWith('u1');expect(component.editing()?.draft).toMatchObject({givenNames:'Ana',paternalSurname:'Garcia',maternalSurname:'Lopez',documentNumber:'12345678',phone:'999999999',contactEmail:'contact@example.com',sex:'F',avatarZoom:1.5});expect(fixture.nativeElement.textContent).toContain('Apellido materno');expect(fixture.nativeElement.textContent).toContain('Correo de contacto');});
 it('validates phone, login email and temporary password before allowing creation',()=>{const {component}=setup();component.openNew();component.setField('givenNames','Ana');component.setField('email','bad');component.setField('phone','123');component.setField('password','weak');expect(component.draftValid()).toBe(false);component.setField('email','ana@example.com');component.setField('phone','999999999');component.setField('password','Temporary123!');expect(component.draftValid()).toBe(true);component.save();expect(users.create).toHaveBeenCalledWith(expect.objectContaining({givenNames:'Ana',phone:'999999999',name:'Ana'}));});
 it('preserves names and avatar framing when saving a different field',()=>{const {component}=setup();component.openEdit(user);component.setField('phone','988888888');component.save();expect(users.update).toHaveBeenCalledWith('u1',expect.objectContaining({givenNames:'Ana',paternalSurname:'Garcia',maternalSurname:'Lopez',phone:'988888888',avatarUrl:user.avatarUrl,avatarZoom:1.5,avatarX:30,avatarY:60}));});
 it('autofills DNI names and unlocks them only after lookup failure',()=>{const {component}=setup();component.openNew();component.changeDocumentType('DNI');component.changeDocumentNumber('12345678');expect(component.namesLocked()).toBe(true);component.lookupDocument();expect(component.editing()?.draft.givenNames).toBe('Ana');expect(component.namesLocked()).toBe(true);api.lookupDocument.mockReturnValue(throwError(()=>new Error('unavailable')));component.changeDocumentNumber('87654321');component.lookupDocument();expect(component.namesLocked()).toBe(false);expect(component.lookupError()).toBeTruthy();});
 it('does not save when catalog loading failed or permission is missing',()=>{const {component}=setup();component.openEdit(user);component.loadFailed.set(true);component.save();expect(users.update).not.toHaveBeenCalled();component.loadFailed.set(false);access.can.mockReturnValue(false);component.save();expect(users.update).not.toHaveBeenCalled();});
 it('shows server field errors without closing the modal',()=>{const {component}=setup();component.openEdit(user);users.update.mockReturnValue(throwError(()=>({error:{errors:{fieldErrors:{phone:['Telefono no valido']}}}})));component.save();expect(component.fieldError('phone')).toBe('Telefono no valido');expect(component.editing()).not.toBeNull();});
 it('uses the complete modal for viewing without allowing accidental writes',()=>{const {fixture,component}=setup();component.viewRow({id:'u1',name:user.name,detail:user.email,role:'client',status:'Activo',createdAt:user.createdAt,client:'',progress:0});fixture.detectChanges();expect(component.readOnly()).toBe(true);expect(fixture.nativeElement.textContent).toContain('Ver usuario');expect(component.editing()?.draft.phone).toBe('999999999');component.save();expect(users.update).not.toHaveBeenCalled();component.enableEditing();expect(component.readOnly()).toBe(false);});

 it('autofills RUC legal names without inventing surnames and saves the business account',()=>{
  const {component,fixture}=setup();api.lookupDocument.mockReturnValue(of({legalName:'2M & ASOCIADOS S.A.C.',fullName:'2M & ASOCIADOS S.A.C.',source:'persistent_cache'}));component.openNew();component.changeDocumentType('RUC');component.changeDocumentNumber('20131312955');component.lookupDocument();fixture.detectChanges();
  expect(api.lookupDocument).toHaveBeenCalledWith('RUC','20131312955');expect(component.editing()?.draft).toMatchObject({givenNames:'2M & ASOCIADOS S.A.C.',name:'2M & ASOCIADOS S.A.C.',paternalSurname:'',maternalSurname:''});expect(fixture.nativeElement.textContent).toContain('Razón social');expect(fixture.nativeElement.querySelector('app-input[label="Apellido paterno"]')).toBeNull();expect(component.namesLocked()).toBe(true);
  component.setField('email','company@example.com');component.setField('password','Temporary123!');expect(component.draftValid()).toBe(true);component.save();expect(users.create).toHaveBeenCalledWith(expect.objectContaining({documentType:'RUC',documentNumber:'20131312955',givenNames:'2M & ASOCIADOS S.A.C.'}));
 });
 it('deduplicates blur/Enter lookups and ignores incomplete documents',()=>{
  const {component}=setup();component.openNew();component.changeDocumentType('DNI');component.changeDocumentNumber('123');component.lookupDocument();expect(api.lookupDocument).not.toHaveBeenCalled();component.changeDocumentNumber('12345678');component.lookupDocument();component.lookupDocument();component.changeDocumentNumber('12345678');component.lookupDocument();expect(api.lookupDocument).toHaveBeenCalledTimes(1);
 });
 it('unlocks the legal name for manual entry when RUC lookup fails',()=>{
  const {component}=setup();api.lookupDocument.mockReturnValue(throwError(()=>new Error('unavailable')));component.openNew();component.changeDocumentType('RUC');component.changeDocumentNumber('20131312955');component.lookupDocument();expect(component.namesLocked()).toBe(false);expect(component.lookupError()).toBeTruthy();
 });

 it('disables the document input until a document type is selected',()=>{
  const {component,fixture}=setup();component.openNew();fixture.detectChanges();
  const documentInput=()=>fixture.nativeElement.querySelector('app-input[label="Número de documento"] input') as HTMLInputElement;
  expect(documentInput().disabled).toBe(true);
  component.changeDocumentType('DNI');fixture.detectChanges();expect(documentInput().disabled).toBe(false);
  component.changeDocumentType('');fixture.detectChanges();expect(documentInput().disabled).toBe(true);
  expect(api.lookupDocument).not.toHaveBeenCalled();
 });

 it.each([['DNI','12345678'],['RUC','20131312955']])('automatically looks up %s after typing without blur or Enter',async(type,number)=>{
  const {component,fixture}=setup();api.lookupDocument.mockReturnValue(of({givenNames:'Ana',paternalSurname:'Garcia',maternalSurname:'Lopez',legalName:'Ana'}));component.openNew();component.changeDocumentType(type);fixture.detectChanges();const input=fixture.nativeElement.querySelector('app-input[label="Número de documento"] input') as HTMLInputElement;
  expect(input).toBeTruthy();input.value=number;input.dispatchEvent(new Event('input',{bubbles:true}));await new Promise(resolve=>setTimeout(resolve,650));
  expect(api.lookupDocument).toHaveBeenCalledExactlyOnceWith(type,number);expect(component.editing()?.draft.givenNames).toBe('Ana');
 });

});
