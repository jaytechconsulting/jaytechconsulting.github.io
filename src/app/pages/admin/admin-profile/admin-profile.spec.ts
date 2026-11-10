import { Avatar } from '../../../ui/data-display/avatar/avatar';
import { ApiService } from '../../../core/api.service';
import { CatalogService } from '../../../core/catalog/catalog.service';
import { PasswordStrength } from '../../../ui/forms/password-strength/password-strength';
import { Select } from '../../../ui/forms/select/select';
import { Component, input, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AdminProfile } from './admin-profile';
import { AuthService } from '../../../core/auth/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { DialogService } from '../../../core/services/dialog.service';
import { Input } from '../../../ui/forms/input/input';
import { Button } from '../../../ui/actions/button/button';
import { Icon } from '../../../ui/data-display/icon/icon';
@Component({selector:'app-admin-shell',template:'<ng-content />'}) class ShellStub {readonly title=input('');readonly active=input('');}
const user={id:'u1',name:'Ana',email:'ana@example.test',role:'admin',initials:'A'};
describe('Profile tabs and security',()=>{
 let auth:any;let dialogs:any;
 beforeEach(()=>{
  auth={currentUser:signal(user),loadProfile:vi.fn(()=>of(user)),updateProfile:vi.fn(()=>of(user)),changeEmail:vi.fn(()=>of(user)),changePassword:vi.fn(()=>of(undefined))};
  dialogs={dialog:()=>null,confirm:vi.fn(async()=>true)};
  TestBed.configureTestingModule({imports:[AdminProfile],providers:[{provide:ApiService,useValue:{lookupDocument:vi.fn(()=>of({givenNames:"Ana",paternalSurname:"Garc�a",maternalSurname:"L�pez",source:"apiperu"}))}},{provide:CatalogService,useValue:{profile:()=>of({documents:{items:[{id:1,code:'DNI',name:'DNI',order:1,inputKind:'text',minLength:4,maxLength:30,minValue:null,maxValue:null}]},sex:{items:[{code:'F',name:'Femenino'}]}})}},{provide:AuthService,useValue:auth},{provide:DialogService,useValue:dialogs},{provide:ToastService,useValue:{success:vi.fn(),error:vi.fn()}}]});
  TestBed.overrideComponent(AdminProfile,{set:{imports:[ShellStub,Input,Button,Icon,Select,PasswordStrength,Avatar]}});
 });
 function setup(){const f=TestBed.createComponent(AdminProfile);f.detectChanges();return {fixture:f,profile:f.componentInstance};}
 it('switches between the left tabs and shows the security forms',()=>{
  const {fixture,profile}=setup();expect(fixture.nativeElement.querySelector('[role=tab][aria-selected=true]').textContent).toContain('Datos personales');
  profile.chooseTab('security');fixture.detectChanges();expect(fixture.nativeElement.textContent).toContain('Cambiar contraseña');expect(fixture.nativeElement.querySelectorAll('form')).toHaveLength(1);expect(fixture.nativeElement.textContent).not.toContain('Usuario de acceso');
 });
 it('loads and saves the full personal profile without changing the login email',()=>{
  auth.loadProfile.mockReturnValue(of({...user,givenNames:'Ana María',paternalSurname:'García',maternalSurname:'López',documentType:'DNI',documentNumber:'00123456',phone:'+51 999 999 999',contactEmail:'contact@example.test',sex:'F'}));
  const {profile,fixture}=setup();expect(profile.name()).toBe('Ana María');expect(profile.documentNumber()).toBe('00123456');
  expect(fixture.nativeElement.textContent).toContain('Apellido paterno');expect(fixture.nativeElement.textContent).toContain('Sexo');
  profile.phone.set('+51 988 888 888');profile.savePersonal(new Event('submit'));
  expect(auth.updateProfile.mock.calls[0][0]).toMatchObject({givenNames:'Ana María',paternalSurname:'García',maternalSurname:'López',documentNumber:'00123456',phone:'+51 988 888 888',contactEmail:'contact@example.test',sex:'F'});
  expect(auth.changeEmail).not.toHaveBeenCalled();
 });
 it('requires both document fields and validates contact details',()=>{
  const {profile}=setup();profile.documentType.set('DNI');expect(profile.canSaveName()).toBe(false);
  profile.documentNumber.set('00123456');expect(profile.canSaveName()).toBe(true);profile.contactEmail.set('invalid');expect(profile.canSaveName()).toBe(false);
  profile.contactEmail.set('contact@example.test');profile.phone.set('not-a-phone');expect(profile.canSaveName()).toBe(false);
 });
 it('saves personal data once while the request is pending',()=>{
  const {profile}=setup();const pending=new Subject<any>();auth.updateProfile.mockReturnValue(pending);profile.name.set('  Ana Nueva  ');
  profile.savePersonal(new Event('submit'));profile.savePersonal(new Event('submit'));expect(auth.updateProfile).toHaveBeenCalledTimes(1);expect(auth.updateProfile.mock.calls[0][0]).toMatchObject({givenNames:'Ana Nueva',paternalSurname:'',maternalSurname:'',documentType:'',documentNumber:'',phone:'',contactEmail:'ana@example.test',sex:''});
  pending.next({...user,name:'Ana Nueva'});pending.complete();expect(profile.saving()).toBe(false);
 });
 it('rejects weak or mismatched passwords and asks for confirmation before saving',async()=>{
  const {profile}=setup();profile.currentPassword.set('old-password');profile.newPassword.set('weak');profile.confirmPassword.set('weak');await profile.savePassword(new Event('submit'));expect(auth.changePassword).not.toHaveBeenCalled();
  profile.newPassword.set('NewPassword123!');profile.confirmPassword.set('different');await profile.savePassword(new Event('submit'));expect(auth.changePassword).not.toHaveBeenCalled();
  profile.confirmPassword.set('NewPassword123!');await profile.savePassword(new Event('submit'));expect(dialogs.confirm).toHaveBeenCalledOnce();expect(auth.changePassword).toHaveBeenCalledExactlyOnceWith('old-password','NewPassword123!');expect(profile.newPassword()).toBe('');expect(profile.currentPassword()).toBe('');
 });
 it('places document fields first and shows the confirmation state',()=>{
  const {fixture,profile}=setup();
  const labels=Array.from(fixture.nativeElement.querySelectorAll('.personal-fields label')).map((label:any)=>label.textContent.trim()).filter((label:any)=>label!=='Enlace de la imagen');
  expect(labels[0]).toBe('Tipo de documento');expect(labels[1]).toBe('Número de documento');expect(labels[2]).toContain('Nombres');
  profile.chooseTab('security');profile.newPassword.set('NewPassword123!');profile.confirmPassword.set('different');fixture.detectChanges();
  expect(profile.passwordMismatch()).toBe(true);expect(fixture.nativeElement.textContent).toContain('Las contraseñas no coinciden.');
  profile.confirmPassword.set('NewPassword123!');fixture.detectChanges();expect(profile.passwordsMatch()).toBe(true);expect(fixture.nativeElement.textContent).toContain('Las contraseñas coinciden.');
 });
 it('autofills and locks DNI names without duplicate calls',()=>{
  const {profile,fixture}=setup();const api=TestBed.inject(ApiService);
  profile.changeDocumentType('DNI');expect(profile.namesLocked()).toBe(true);
  profile.changeDocumentNumber('12345678');profile.lookupDocument();fixture.detectChanges();
  expect(profile.name()).toBe('Ana');expect(profile.paternalSurname()).toBe('Garc�a');expect(profile.maternalSurname()).toBe('L�pez');
  expect(profile.namesLocked()).toBe(true);profile.lookupDocument();expect(api.lookupDocument).toHaveBeenCalledTimes(1);
 });
 it('unlocks names only after lookup failure and ignores superseded requests',()=>{
  const {profile}=setup();const api=TestBed.inject(ApiService);const pending=new Subject<any>();
  vi.mocked(api.lookupDocument).mockReturnValueOnce(pending).mockReturnValueOnce(throwError(()=>new Error('unavailable')));
  profile.changeDocumentType('DNI');profile.changeDocumentNumber('12345678');profile.lookupDocument();expect(profile.namesLocked()).toBe(true);
  profile.changeDocumentNumber('87654321');pending.next({givenNames:'Wrong'});expect(profile.name()).toBe('');
  profile.lookupDocument();expect(profile.lookupState()).toBe('manual');expect(profile.namesLocked()).toBe(false);
  profile.changeDocumentNumber('1234');expect(profile.namesLocked()).toBe(true);
 });

 it('loads, frames and submits the image URL without image data',()=>{
  auth.loadProfile.mockReturnValue(of({...user,avatarUrl:'https://example.test/avatar.jpg',avatarZoom:1.5,avatarX:35,avatarY:60}));
  const {profile}=setup();expect(profile.avatarZoom()).toBe(1.5);expect(profile.avatarX()).toBe(35);
  profile.avatarZoom.set(2);profile.savePersonal(new Event('submit'));
  expect(auth.updateProfile.mock.calls[0][0]).toMatchObject({avatarUrl:'https://example.test/avatar.jpg',avatarZoom:2,avatarX:35,avatarY:60});
 });
 it('rejects non-HTTPS image links and allows removing the avatar',()=>{
  const {profile}=setup();profile.changeAvatar('data:image/png;base64,test');expect(profile.avatarValid()).toBe(false);expect(profile.canSaveName()).toBe(false);
  profile.changeAvatar('https://example.test/avatar.jpg');expect(profile.avatarValid()).toBe(true);profile.avatarZoom.set(2);profile.changeAvatar('');
  expect(profile.personalInput().avatarUrl).toBe('');expect(profile.avatarZoom()).toBe(1);
 });

 it('shows document feedback only when there is a validation error',()=>{
  const {profile,fixture}=setup();profile.changeDocumentType('DNI');fixture.detectChanges();
  expect(profile.documentError()).toBe('');expect(fixture.nativeElement.textContent).not.toContain('para completar nombres');
  profile.changeDocumentNumber('123');profile.lookupDocument();fixture.detectChanges();expect(profile.documentError()).toContain('8');
  profile.changeDocumentNumber('12345678');profile.lookupDocument();fixture.detectChanges();expect(profile.documentError()).toBe('');
  expect(fixture.nativeElement.querySelector('.document-lookup-status')).toBeNull();
 });

 it('shows phone and email errors after blur and clears them after correction',()=>{
  const {profile,fixture}=setup();profile.edit('phone','123');profile.edit('contactEmail','a..b@example.com');
  expect(profile.fieldError('phone')).toBe('');profile.touch('phone');profile.touch('contactEmail');fixture.detectChanges();
  expect(profile.fieldError('phone')).not.toBe('');expect(profile.fieldError('contactEmail')).not.toBe('');expect(profile.canSaveName()).toBe(false);
  const inputs=Array.from(fixture.nativeElement.querySelectorAll('input[aria-invalid=true]'));expect(inputs.length).toBeGreaterThanOrEqual(2);
  profile.edit('phone','999999999');profile.edit('contactEmail','ana@example.com');fixture.detectChanges();
  expect(profile.fieldError('phone')).toBe('');expect(profile.fieldError('contactEmail')).toBe('');
 });
 it('maps backend field validation to the corresponding input',()=>{
  const {profile}=setup();profile.edit('phone','999999999');auth.updateProfile.mockReturnValue(throwError(()=>({error:{errors:{fieldErrors:{phone:['Server phone error']}}}})));
  profile.savePersonal(new Event('submit'));expect(profile.fieldError('phone')).toBe('Server phone error');
  profile.edit('phone','988888888');expect(profile.fieldError('phone')).toBe('');
 });

});
