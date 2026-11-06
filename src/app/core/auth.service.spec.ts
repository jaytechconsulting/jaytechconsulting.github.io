import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController,provideHttpClientTesting } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { AuthService } from './auth.service';
describe('Profile session synchronization',()=>{
 let storage:Map<string,string>;let http:HttpTestingController;let auth:AuthService;
 beforeEach(()=>{
  storage=new Map();vi.stubGlobal('localStorage',{getItem:(key:string)=>storage.get(key) ?? null,setItem:(key:string,value:string)=>storage.set(key,value),removeItem:(key:string)=>storage.delete(key)});
  TestBed.configureTestingModule({providers:[provideHttpClient(),provideHttpClientTesting()]});http=TestBed.inject(HttpTestingController);auth=TestBed.inject(AuthService);
  auth.login('old@example.test','test-password').subscribe();http.expectOne(r=>r.url.endsWith('/auth/login')).flush({data:{id:'u1',name:'Ana',email:'old@example.test',role:'admin',token:'initial-token'}});
 });
 afterEach(()=>{http.verify();vi.unstubAllGlobals();});
 it('renews token and stored account details after name and login email updates',()=>{
  auth.updateProfile('Ana Nueva').subscribe();const name=http.expectOne(r=>r.url.endsWith('/auth/me'));expect(name.request.method).toBe('PUT');name.flush({data:{id:'u1',name:'Ana Nueva',email:'old@example.test',role:'admin',token:'name-token'}});
  expect(auth.currentUser()?.name).toBe('Ana Nueva');expect(storage.get('jaytech_token')).toBe('name-token');
  auth.changeEmail('new@example.test','test-current-password').subscribe();const email=http.expectOne(r=>r.url.endsWith('/auth/change-email'));expect(email.request.body.currentPassword).toBe('test-current-password');email.flush({data:{id:'u1',name:'Ana Nueva',email:'new@example.test',role:'admin',token:'email-token'}});
  expect(auth.currentUser()?.email).toBe('new@example.test');expect(storage.get('jaytech_token')).toBe('email-token');expect(JSON.parse(storage.get('jaytech_session')!).email).toBe('new@example.test');
 });
 it('returns personal fields to the form without persisting document data in local storage',()=>{
  let details:any;auth.loadProfile().subscribe(profile=>details=profile);
  http.expectOne(r=>r.url.endsWith('/auth/me')).flush({data:{id:'u1',name:'Ana García',email:'old@example.test',role:'admin',givenNames:'Ana',paternalSurname:'García',documentType:'DNI',documentNumber:'00123456',phone:'999999999',contactEmail:'contact@example.test',sex:'F'}});
  expect(details.documentNumber).toBe('00123456');expect(details.givenNames).toBe('Ana');
  const stored=JSON.parse(storage.get('jaytech_session')!);expect(stored.documentNumber).toBeUndefined();expect(stored.phone).toBeUndefined();
 });
 it('keeps the existing session when the server rejects an account change',()=>{
  auth.changeEmail('duplicate@example.test','wrong-password').subscribe({error:()=>{}});http.expectOne(r=>r.url.endsWith('/auth/change-email')).flush({}, {status:400,statusText:'Rejected'});
  expect(auth.currentUser()?.email).toBe('old@example.test');expect(storage.get('jaytech_token')).toBe('initial-token');
 });
});
