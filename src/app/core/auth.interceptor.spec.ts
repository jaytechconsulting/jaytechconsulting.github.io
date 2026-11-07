import { vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter,Router } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';
import { SessionLifecycle } from './session-lifecycle.service';
import { LoadingService } from './services/loading.service';
import { environment } from '../../environments/environment';

describe('Cookie authentication and CSRF boundary',()=>{
 let http:HttpClient,control:HttpTestingController,router:Router,auth:any,lifecycle:SessionLifecycle;
 const base=environment.apiUrl;
 beforeEach(()=>{
  auth={clearSession:vi.fn()};TestBed.configureTestingModule({providers:[provideRouter([]),provideHttpClient(withInterceptors([authInterceptor])),provideHttpClientTesting(),{provide:AuthService,useValue:auth}]});
  http=TestBed.inject(HttpClient);control=TestBed.inject(HttpTestingController);router=TestBed.inject(Router);lifecycle=TestBed.inject(SessionLifecycle);vi.spyOn(router,'navigateByUrl').mockResolvedValue(true);vi.spyOn(router,'url','get').mockReturnValue('/admin/usuarios');
 });
 afterEach(()=>control.verify());
 function csrf(token='csrf-test'){const request=control.expectOne(base+'/auth/csrf');expect(request.request.withCredentials).toBe(true);request.flush({data:{token}});}
 it('sends credentials exclusively to this API and never sends bearer tokens',()=>{
  for(const url of [base+'/auth/me','https://external.test/data',base+'.evil.test/data']){http.get(url).subscribe();const request=control.expectOne(url);expect(request.request.withCredentials).toBe(url===base+'/auth/me');expect(request.request.headers.has('Authorization')).toBe(false);request.flush({});}
 });
 it('shares a CSRF request for concurrent mutations and preserves loading state',()=>{
  http.post(base+'/one',{}).subscribe();http.put(base+'/two',{}).subscribe({error:()=>{}});expect(TestBed.inject(LoadingService).hasPendingRequests()).toBe(true);csrf();
  const one=control.expectOne(base+'/one'),two=control.expectOne(base+'/two');expect(one.request.headers.get('X-CSRF-TOKEN')).toBe('csrf-test');one.flush({});expect(TestBed.inject(LoadingService).hasPendingRequests()).toBe(true);
  two.flush({}, {status:500,statusText:'Error'});expect(TestBed.inject(LoadingService).hasPendingRequests()).toBe(false);
 });
 it('refreshes a rejected CSRF token once before retrying the pre-action rejection',()=>{
  http.post(base+'/one',{}).subscribe();csrf();control.expectOne(base+'/one').flush({errors:{code:'csrf_invalid'}},{status:403,statusText:'Forbidden'});csrf('renewed');const retry=control.expectOne(base+'/one');expect(retry.request.headers.get('X-CSRF-TOKEN')).toBe('renewed');retry.flush({});
 });
 it('recognizes the deployed top-level CSRF rejection and retries only once',()=>{
  const failed=vi.fn();http.post(base+'/auth/login',{}).subscribe({error:failed});csrf();
  control.expectOne(base+'/auth/login').flush({code:'csrf_invalid'},{status:403,statusText:'Forbidden'});
  csrf('renewed');const retry=control.expectOne(base+'/auth/login');expect(retry.request.headers.get('X-CSRF-TOKEN')).toBe('renewed');
  retry.flush({code:'csrf_invalid'},{status:403,statusText:'Forbidden'});
  expect(failed).toHaveBeenCalledOnce();control.expectNone(base+'/auth/csrf');expect(TestBed.inject(LoadingService).hasPendingRequests()).toBe(false);
 });
 it('never retries forbidden business operations',()=>{
  http.post(base+'/one',{}).subscribe({error:()=>{}});csrf();control.expectOne(base+'/one').flush({},{status:403,statusText:'Forbidden'});control.expectNone(base+'/auth/csrf');expect(auth.clearSession).not.toHaveBeenCalled();
 });
 it('expires rejected sessions and redirects private routes to login',()=>{
  http.get(base+'/auth/me').subscribe({error:()=>{}});control.expectOne(base+'/auth/me').flush({},{status:401,statusText:'Unauthorized'});expect(auth.clearSession).toHaveBeenCalledOnce();expect(router.navigateByUrl).toHaveBeenCalled();
 });
 it('ignores failures from requests belonging to an older session',()=>{
  http.get(base+'/users').subscribe({error:()=>{}});const old=control.expectOne(base+'/users');lifecycle.advance();old.flush({},{status:401,statusText:'Unauthorized'});expect(auth.clearSession).not.toHaveBeenCalled();
 });
 it('does not treat invalid login credentials as session expiry',()=>{
  http.post(base+'/auth/login',{}).subscribe({error:()=>{}});csrf();control.expectOne(base+'/auth/login').flush({},{status:401,statusText:'Unauthorized'});expect(auth.clearSession).not.toHaveBeenCalled();
 });
});
