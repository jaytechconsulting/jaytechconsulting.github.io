import { profilePhoneValid, profileEmailValid, profileNameValid, profileLegalNameValid } from '../../../core/validation/profile-validation';
import { Avatar } from '../../../ui/data-display/avatar/avatar';
import { ApiService } from '../../../core/api.service';
import { Subscription } from 'rxjs';
import { CatalogService, CatalogItem, catalogValueValid } from '../../../core/catalog.service';
import { forkJoin } from 'rxjs';
import { PasswordStrength, passwordMeetsPolicy } from '../../../ui/forms/password-strength/password-strength';
import { Select } from '../../../ui/forms/select/select';
import type { PersonalProfileFields, PersonalProfileInput } from '../../../core/models/api.models';
import type { AuthUser } from '../../../core/auth.service';
import { Component, computed, inject, signal, ElementRef, viewChild, DestroyRef } from '@angular/core';
import { AdminShell } from '../admin-shell/admin-shell';
import { AuthService } from '../../../core/auth.service';
import { Button } from '../../../ui/actions/button/button';
import { Input } from '../../../ui/forms/input/input';
import { Icon } from '../../../ui/data-display/icon/icon';
import { ToastService } from '../../../core/services/toast.service';
import { DialogService } from '../../../core/services/dialog.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
@Component({selector:'app-admin-profile',imports:[AdminShell,Button,Input,Icon,Select,PasswordStrength,Avatar],templateUrl:'./admin-profile.html',styleUrl:'./admin-profile.css'})
export class AdminProfile {
 private readonly api=inject(ApiService);
 readonly auth=inject(AuthService);private readonly toast=inject(ToastService);private readonly dialogs=inject(DialogService);private readonly catalogs=inject(CatalogService);
 readonly avatarUrl=signal('');readonly avatarZoom=signal(1);readonly avatarX=signal(50);readonly avatarY=signal(50);
 readonly avatarValid=computed(()=>{if(!this.avatarUrl().trim())return true;try{const url=new URL(this.avatarUrl().trim());return url.protocol==='https:' && !url.username && !url.password && url.href.length<=2048;}catch{return false;}});
 changeAvatar(value:string):void{this.avatarUrl.set(value);this.avatarZoom.set(1);this.avatarX.set(50);this.avatarY.set(50);}
 resetAvatar():void{this.avatarZoom.set(1);this.avatarX.set(50);this.avatarY.set(50);}
 private dragPoint:{x:number;y:number;startX:number;startY:number}|null=null;
 startAvatarDrag(event:PointerEvent):void{if(!this.avatarUrl() || this.saving())return;event.preventDefault();(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);this.dragPoint={x:event.clientX,y:event.clientY,startX:this.avatarX(),startY:this.avatarY()};}
 moveAvatar(event:PointerEvent):void{if(!this.dragPoint)return;const size=(event.currentTarget as HTMLElement).clientWidth;const factor=100/(size*Math.max(1,this.avatarZoom()-1));this.avatarX.set(Math.max(0,Math.min(100,this.dragPoint.startX-(event.clientX-this.dragPoint.x)*factor)));this.avatarY.set(Math.max(0,Math.min(100,this.dragPoint.startY-(event.clientY-this.dragPoint.y)*factor)));}
 endAvatarDrag():void{this.dragPoint=null;}
 readonly tab=signal<'personal'|'security'>('personal');readonly saving=signal(false);readonly loading=signal(true);readonly loadFailed=signal(false);
 readonly name=signal(this.auth.currentUser()?.name ?? '');
 readonly paternalSurname=signal('');readonly maternalSurname=signal('');readonly documentType=signal('');readonly documentNumber=signal('');readonly phone=signal('');readonly contactEmail=signal('');readonly sex=signal('');
 readonly documentTypes=signal<CatalogItem[]>([]);readonly sexes=signal<CatalogItem[]>([]);
 readonly documentOptions=computed(()=>[{value:'',label:'Selecciona un tipo'},...this.documentTypes().map(item=>({value:item.code,label:item.name}))]);
 readonly sexOptions=computed(()=>[{value:'',label:'Selecciona una opción'},...this.sexes().map(item=>({value:item.code,label:item.name}))]);
 readonly documentRule=computed(()=>this.documentTypes().find(item=>item.code===this.documentType()));
 readonly touched=signal<Record<string,boolean>>({});
 readonly serverErrors=signal<Record<string,string>>({});
 touch(field:string):void{this.touched.update(value=>({...value,[field]:true}));}
 edit(field:string,value:string):void{
  this.serverErrors.update(errors=>{const next={...errors};delete next[field];return next;});
  switch(field){case 'givenNames':this.name.set(value);break;case 'paternalSurname':this.paternalSurname.set(value);break;case 'maternalSurname':this.maternalSurname.set(value);break;case 'phone':this.phone.set(value);break;case 'contactEmail':this.contactEmail.set(value);break;case 'sex':this.sex.set(value);break;}
 }
 readonly fieldErrors=computed<Record<string,string>>(()=>{
  const p=this.personalInput();const errors:Record<string,string>={};
  if(!p.givenNames)errors['givenNames']='Ingresa tus nombres.';
  for(const field of ['givenNames','paternalSurname','maternalSurname'] as const)if(!(field==='givenNames'&&p.documentType==='RUC'?profileLegalNameValid(p[field]):profileNameValid(p[field])))errors[field]=field==='givenNames'&&p.documentType==='RUC'?'Ingresa una razon social de hasta 150 caracteres.':'Usa letras, espacios, puntos, apóstrofes o guiones; máximo 100 caracteres.';
  if([p.givenNames,p.paternalSurname,p.maternalSurname].filter(Boolean).join(' ').length>150)errors['givenNames']='El nombre completo admite hasta 150 caracteres.';
  if(!profilePhoneValid(p.phone))errors['phone']='Ingresa un celular de 9 dígitos que empiece en 9 o un número internacional válido con +.';
  if(!profileEmailValid(p.contactEmail))errors['contactEmail']='Ingresa un correo válido de hasta 254 caracteres.';
  if(!p.documentType && p.documentNumber)errors['documentType']='Selecciona el tipo de documento.';
  if(p.documentType && !this.documentRule())errors['documentType']='Selecciona un tipo de documento válido.';
  if(p.documentType && !p.documentNumber)errors['documentNumber']='Ingresa el número de documento.';
  if(p.documentNumber && (p.documentNumber.length>100 || !/^[\p{L}\p{N}-]+$/u.test(p.documentNumber) || !catalogValueValid(this.documentRule(),p.documentNumber)))errors['documentNumber']='El documento no cumple el formato requerido.';
  if(p.documentType==='DNI' && !/^[0-9]{8}$/.test(p.documentNumber))errors['documentNumber']='El DNI debe contener 8 dígitos.';
  if(p.documentType==='RUC' && !/^[0-9]{11}$/.test(p.documentNumber))errors['documentNumber']='El RUC debe contener 11 dígitos.';
  if(p.sex && !this.sexes().some(item=>item.code===p.sex))errors['sex']='Selecciona una opción válida.';
  return errors;
 });
 fieldError(field:string):string{return this.serverErrors()[field] || (this.touched()[field] ? this.fieldErrors()[field] || '' : '');}
 private readonly originalPersonal=signal('');
 readonly personalInput=computed<PersonalProfileInput>(()=>({avatarUrl:this.avatarUrl().trim(),avatarZoom:this.avatarZoom(),avatarX:this.avatarX(),avatarY:this.avatarY(),givenNames:this.name().trim(),paternalSurname:this.paternalSurname().trim(),maternalSurname:this.maternalSurname().trim(),documentType:this.documentType(),documentNumber:this.documentNumber().trim(),phone:this.phone().trim(),contactEmail:this.contactEmail().trim(),sex:this.sex()}));
 private fillPersonal(user:AuthUser & PersonalProfileFields):void {
  this.avatarUrl.set(user.avatarUrl ?? '');this.avatarZoom.set(user.avatarZoom ?? 1);this.avatarX.set(user.avatarX ?? 50);this.avatarY.set(user.avatarY ?? 50);
  this.name.set(user.givenNames ?? user.name);this.paternalSurname.set(user.paternalSurname ?? '');this.maternalSurname.set(user.maternalSurname ?? '');this.documentType.set(user.documentType ?? '');this.documentNumber.set(user.documentNumber ?? '');this.phone.set(user.phone ?? '');this.contactEmail.set(user.contactEmail ?? user.email);this.sex.set(user.sex ?? '');this.originalPersonal.set(JSON.stringify(this.personalInput()));this.touched.set({});this.serverErrors.set({});
 }
 readonly lookupState=signal<'idle'|'waiting'|'loading'|'success'|'manual'>('idle');
 readonly namesLocked=computed(()=>this.documentType()==='DNI' && this.lookupState()!=='manual');
 readonly documentTouched=signal(false);
 readonly documentError=computed(()=>!this.documentTouched()?'':this.fieldErrors()['documentNumber'] || (this.lookupState()==='manual'?'No se pudieron obtener los datos. Ingresa los nombres y apellidos manualmente.':''));
 private lookupTimer:ReturnType<typeof setTimeout>|undefined;
 private lookupSubscription?:Subscription;
 private lastLookup='';
 private documentEdited=false;
 changeDocumentType(value:string):void{this.serverErrors.set({});this.touch('documentType');this.documentType.set(value);this.changeDocumentNumber('');this.documentTouched.set(false);}
 changeDocumentNumber(value:string):void{
  if(value===this.documentNumber() && this.documentType()==='DNI' && this.lastLookup==='DNI:'+value.trim())return;
  this.serverErrors.set({});clearTimeout(this.lookupTimer);this.lookupSubscription?.unsubscribe();this.documentNumber.set(value);this.documentEdited=true;
  this.lookupState.set('waiting');this.lastLookup='';
  this.name.set('');this.paternalSurname.set('');this.maternalSurname.set('');
  if(this.documentType()==='DNI' && /^[0-9]{8}$/.test(value.trim()))this.lookupTimer=setTimeout(()=>this.lookupDocument(),500);
 }
 lookupDocument():void{
  this.documentTouched.set(true);this.touch('documentNumber');
  clearTimeout(this.lookupTimer);const number=this.documentNumber().trim();const key=this.documentType()+':'+number;
  if(this.documentType()!=='DNI' || !/^[0-9]{8}$/.test(number) || this.lastLookup===key || this.saving())return;
  this.lastLookup=key;this.lookupState.set('loading');
  this.lookupSubscription=this.api.lookupDocument('DNI',number).subscribe({next:result=>{
   if(this.documentType()+':'+this.documentNumber().trim()!==key)return;
   if(!result.givenNames?.trim()){this.lookupState.set('manual');this.toast.error('No pudimos completar los nombres','Puedes ingresar los datos manualmente.');return;}
   this.name.set(result.givenNames);this.paternalSurname.set(result.paternalSurname ?? '');this.maternalSurname.set(result.maternalSurname ?? '');this.lookupState.set('success');this.toast.success('Datos del documento completados');
  },error:()=>{if(this.documentType()+':'+this.documentNumber().trim()!==key)return;this.lookupState.set('manual');this.toast.error('No pudimos consultar el documento','Puedes ingresar los nombres y apellidos manualmente.');}});
 }
 readonly currentPassword=signal('');readonly newPassword=signal('');readonly confirmPassword=signal('');
 readonly passwordValid=computed(()=>passwordMeetsPolicy(this.newPassword()));
 readonly passwordsMatch=computed(()=>!!this.newPassword() && !!this.confirmPassword() && this.newPassword()===this.confirmPassword());
 readonly passwordMismatch=computed(()=>!!this.confirmPassword() && !this.passwordsMatch());
 readonly canSaveName=computed(()=>this.avatarValid() && Object.keys(this.fieldErrors()).length===0 && !(this.documentEdited && this.documentType()==='DNI' && !['success','manual'].includes(this.lookupState())) && JSON.stringify(this.personalInput())!==this.originalPersonal());

 readonly canSavePassword=computed(()=>this.passwordValid() && !!this.currentPassword() && this.passwordsMatch() && this.newPassword()!==this.currentPassword());
 private readonly personalTab=viewChild<ElementRef<HTMLButtonElement>>('personalTab');private readonly securityTab=viewChild<ElementRef<HTMLButtonElement>>('securityTab');
 constructor(){inject(DestroyRef).onDestroy(()=>{clearTimeout(this.lookupTimer);this.lookupSubscription?.unsubscribe();});forkJoin({user:this.auth.loadProfile(),catalogs:this.catalogs.profile()}).pipe(takeUntilDestroyed()).subscribe({next:({user,catalogs})=>{this.documentTypes.set(catalogs.documents.items);this.sexes.set(catalogs.sex.items);this.fillPersonal(user);this.loading.set(false);},error:()=>{this.loading.set(false);this.loadFailed.set(true);this.toast.error('No pudimos cargar el perfil o sus catálogos','Recarga la página para intentarlo nuevamente.');}});}

 chooseTab(tab:'personal'|'security'):void{if(this.saving())return;this.tab.set(tab);}
 tabKey(event:KeyboardEvent):void{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();this.chooseTab(event.key==='Home'?'personal':event.key==='End'?'security':this.tab()==='personal'?'security':'personal');(this.tab()==='personal'?this.personalTab():this.securityTab())?.nativeElement.focus();}}
 private fail(error:unknown):void{this.saving.set(false);const message=(error as {error?:{message?:string}})?.error?.message;this.toast.error('No pudimos guardar',typeof message==='string'?message:'Inténtalo nuevamente.');}
 savePersonal(event:Event):void{event.preventDefault();this.touched.set(Object.fromEntries(['givenNames','paternalSurname','maternalSurname','phone','contactEmail','documentType','documentNumber','sex'].map(field=>[field,true])));if(!this.canSaveName() || this.saving() || this.loading() || this.loadFailed())return;this.saving.set(true);this.auth.updateProfile(this.personalInput()).subscribe({next:user=>{this.fillPersonal(user);this.saving.set(false);this.toast.success('Datos personales actualizados');},error:error=>{const fields=(error as {error?:{errors?:{fieldErrors?:Record<string,string[]>}}}).error?.errors?.fieldErrors;if(fields)this.serverErrors.set(Object.fromEntries(Object.entries(fields).map(([field,messages])=>[field,messages[0]])));this.fail(error);}});}
 async savePassword(event:Event):Promise<void>{event.preventDefault();if(!this.canSavePassword() || this.saving() || this.loading() || this.loadFailed() || this.dialogs.dialog())return;
 const ok=await this.dialogs.confirm({title:'¿Actualizar contraseña?',message:'Usarás la nueva contraseña en tus próximos accesos.',confirmLabel:'Actualizar contraseña'});if(!ok || this.saving())return;
 this.saving.set(true);this.auth.changePassword(this.currentPassword(),this.newPassword()).subscribe({next:()=>{this.currentPassword.set('');this.newPassword.set('');this.confirmPassword.set('');this.saving.set(false);this.toast.success('Contraseña actualizada');},error:error=>{this.currentPassword.set('');this.fail(error);}});
 }
}
