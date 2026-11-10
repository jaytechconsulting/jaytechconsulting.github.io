import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoadingService } from '../services/loading.service';
import { authInterceptor } from '../auth/auth.interceptor';
import { PUBLIC_READ } from './api-client';
import { publicSiteBootstrapInterceptor } from './public-site-bootstrap.interceptor';

describe('Early public CMS handoff', () => {
  const endpoint = environment.apiUrl + '/public-site';
  const context = () => new HttpContext().set(PUBLIC_READ, true);
  let http: HttpClient;
  let control: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(withInterceptors([authInterceptor, publicSiteBootstrapInterceptor])),
      provideHttpClientTesting(),
    ] });
    http = TestBed.inject(HttpClient);
    control = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    delete window.__publicSiteBootstrap;
    control.verify();
  });
  function seed(body: unknown = { data: { cms: {}, content: [] } }) {
    window.__publicSiteBootstrap = {
      url: endpoint, startedAt: performance.now(),
      result: Promise.resolve({ ok: true, status: 200, statusText: 'OK', body }),
    };
  }
  it('waits for the early response with progress active and sends no duplicate request', async () => {
    let finish!: (result: any) => void;
    seed();
    window.__publicSiteBootstrap!.result = new Promise(resolve => finish = resolve);
    const response = firstValueFrom(http.get(endpoint, { context: context() }));
    expect(TestBed.inject(LoadingService).hasPendingRequests()).toBe(true);
    control.expectNone(endpoint);
    finish({ ok: true, status: 200, statusText: 'OK', body: { data: 'published' } });
    expect(await response).toEqual({ data: 'published' });
    expect(TestBed.inject(LoadingService).hasPendingRequests()).toBe(false);
    expect(window.__publicSiteBootstrap).toBeUndefined();
    // A later refresh always revalidates over HTTP.
    http.get(endpoint, { context: context() }).subscribe();
    control.expectOne(endpoint).flush({ data: 'updated' });
  });
  it('propagates the initial error and permits a fresh retry', async () => {
    seed();
    window.__publicSiteBootstrap!.result = Promise.resolve({ ok: false, status: 503, statusText: 'Unavailable', body: { message: 'offline' } });
    await expect(firstValueFrom(http.get(endpoint, { context: context() }))).rejects.toMatchObject({ status: 503 });
    expect(TestBed.inject(LoadingService).hasPendingRequests()).toBe(false);
    http.get(endpoint, { context: context() }).subscribe();
    control.expectOne(endpoint).flush({ data: 'recovered' });
  });
  it('ignores stale or differently configured responses', () => {
    for (const mismatch of ['age', 'url']) {
      seed();
      if (mismatch === 'age') window.__publicSiteBootstrap!.startedAt -= 16000;
      else window.__publicSiteBootstrap!.url = 'https://other.test/api/public-site';
      http.get(endpoint, { context: context() }).subscribe();
      const request = control.expectOne(endpoint);
      expect(request.request.credentials).toBe('omit');
      request.flush({ data: 'fresh' });
    }
  });
  it('never substitutes private reads or consumes the handoff for them', () => {
    seed();
    http.get(environment.apiUrl + '/auth/me').subscribe();
    const request = control.expectOne(environment.apiUrl + '/auth/me');
    expect(request.request.withCredentials).toBe(true);
    request.flush({ data: { id: 'user' } });
    expect(window.__publicSiteBootstrap).toBeDefined();
  });
});
