import { vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';
import { LoadingService } from './services/loading.service';
describe('HTTP progress state',()=>{
  beforeEach(()=>vi.stubGlobal('localStorage',{getItem:()=>null}));
  afterEach(()=>vi.unstubAllGlobals());
  it('remains pending until all requests finish, including errors and cancellation',()=>{
    TestBed.configureTestingModule({providers:[provideHttpClient(withInterceptors([authInterceptor])),provideHttpClientTesting()]});
    const http=TestBed.inject(HttpClient),control=TestBed.inject(HttpTestingController),loading=TestBed.inject(LoadingService);
    http.get('/one').subscribe();http.get('/two').subscribe({error:()=>{}});
    expect(loading.hasPendingRequests()).toBe(true);
    control.expectOne('/one').flush({});expect(loading.hasPendingRequests()).toBe(true);
    control.expectOne('/two').flush({}, {status:500,statusText:'Error'});expect(loading.hasPendingRequests()).toBe(false);
    const canceled=http.get('/cancel').subscribe();control.expectOne('/cancel');canceled.unsubscribe();expect(loading.hasPendingRequests()).toBe(false);control.verify();
  });
});
