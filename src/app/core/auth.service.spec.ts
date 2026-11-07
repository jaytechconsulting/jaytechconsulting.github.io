import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController,provideHttpClientTesting } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { AuthService } from './auth.service';

describe('Server session lifecycle',()=>{
 let storage:Map<string,string>;let http:HttpTestingController;let auth:AuthService;
 const profile={id:'u1',name:'Ana',email:'old@example.test',role:'admin'};
 beforeEach(()=>{
  storage=new Map([['jaytech_token','legacy-secret'],['jaytech_session','legacy-profile']]);
  vi.stubGlobal('localStorage',{getItem:(key:string)=>storage.get(key)??null,setItem:(key:string,value:string)=>storage.set(key,value),removeItem:(key:string)=>storage.delete(key)});
  TestBed.configureTestingModule({providers:[provideHttpClient(),provideHttpClientTesting()]});http=TestBed.inject(HttpTestingController);auth=TestBed.inject(AuthService);
 });
 afterEach(()=>{http.verify();vi.unstubAllGlobals();});
 function login(){auth.login(profile.email,'test-password').subscribe();http.expectOne(r=>r.url.endsWith('/auth/login')).flush({data:profile});http.expectOne(r=>r.url.endsWith('/auth/me')).flush({data:profile});}
 it('removes legacy credentials and verifies cookies with the backend after login',()=>{
  expect(storage.get('jaytech_token')).toBeUndefined();expect(storage.get('jaytech_session')).toBeUndefined();
  auth.login(profile.email,'test-password').subscribe();http.expectOne(r=>r.url.endsWith('/auth/login')).flush({data:profile});expect(auth.isAuthenticated()).toBe(false);
  http.expectOne(r=>r.url.endsWith('/auth/me')).flush({data:profile});expect(auth.isAuthenticated()).toBe(true);
  expect([...storage.keys()]).toEqual(['jaytech_auth_event']);expect(storage.get('jaytech_auth_event')).not.toContain('old@example.test');
 });
 it('restores a page reload from the server without browser-stored identity',()=>{
  auth.loadProfile().subscribe();http.expectOne(r=>r.url.endsWith('/auth/me')).flush({data:profile});expect(auth.currentUser()?.id).toBe('u1');
 });
 it('synchronizes profile changes without saving tokens or personal fields',()=>{
  login();let details:any;auth.updateProfile('Ana Nueva').subscribe(value=>details=value);
  http.expectOne(r=>r.url.endsWith('/auth/me')).flush({data:{...profile,name:'Ana Nueva',documentNumber:'00123456',phone:'999999999'}});
  expect(details.documentNumber).toBe('00123456');expect(auth.currentUser()?.name).toBe('Ana Nueva');expect(storage.get('jaytech_session')).toBeUndefined();
 });
 it('waits for server revocation before clearing the authenticated UI',()=>{
  login();auth.logout().subscribe();expect(auth.isAuthenticated()).toBe(true);http.expectOne(r=>r.url.endsWith('/auth/logout')).flush({data:null});expect(auth.isAuthenticated()).toBe(false);
 });
 it('keeps the session if server logout cannot be completed',()=>{
  login();auth.logout().subscribe({error:()=>{}});http.expectOne(r=>r.url.endsWith('/auth/logout')).flush({}, {status:503,statusText:'Unavailable'});expect(auth.isAuthenticated()).toBe(true);
 });
 it('does not restore identity from late profile or credential updates after clearing the session',()=>{
  login();auth.updateProfile('Ana').subscribe({error:()=>{}});const pending=http.expectOne(r=>r.url.endsWith('/auth/me'));auth.clearSession();pending.flush({data:profile});expect(auth.currentUser()).toBeNull();
 });
 it('synchronizes logout between tabs using only a non-sensitive event',()=>{
  login();window.dispatchEvent(new StorageEvent('storage',{key:'jaytech_auth_event',newValue:JSON.stringify({kind:'logout',nonce:'test'})}));expect(auth.currentUser()).toBeNull();
 });
});
