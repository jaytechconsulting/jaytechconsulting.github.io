import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import {
  ErrorRecovery,
  errorRecoveryGuard,
  notFoundGuard,
  recoveryDestination,
  DOCUMENT_NAVIGATION_TYPE,
  DOCUMENT_ENTRY_PATH,
} from './error-recovery';

@Component({ template: 'Page' })
class Page {}
@Component({ template: 'Error' })
class ErrorView {}

describe('Error page recovery', () => {
  let failing: boolean, attempts: number;
  beforeEach(() => sessionStorage.removeItem('jaytech_error_recovery'));
  afterEach(() => sessionStorage.removeItem('jaytech_error_recovery'));
  function configure(type = 'navigate', entry = '/') {
    failing = true;
    attempts = 0;
    const guarded: CanActivateFn = (_route, state) => {
      attempts++;
      return failing ? inject(ErrorRecovery).error(503, state.url) : true;
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: DOCUMENT_NAVIGATION_TYPE, useValue: type },
        { provide: DOCUMENT_ENTRY_PATH, useValue: entry },
        provideRouter([
          { path: '', component: Page },
          { path: 'private', component: Page, canActivate: [guarded] },
          { path: 'error/503', component: ErrorView, canActivate: [errorRecoveryGuard] },
          { path: 'error/404', component: ErrorView, canActivate: [errorRecoveryGuard] },
          { path: '**', component: ErrorView, canActivate: [notFoundGuard] },
        ]),
      ],
    });
  }
  it('keeps query and fragment of the failed route and retries that route', async () => {
    configure();
    const harness = await RouterTestingHarness.create('/');
    await harness.navigateByUrl('/private?filter=active#details');
    const router = TestBed.inject(Router);
    expect(router.parseUrl(router.url).queryParams['returnTo']).toBe(
      '/private?filter=active#details',
    );
    failing = false;
    await TestBed.inject(ErrorRecovery).retry();
    expect(router.url).toBe('/private?filter=active#details');
    expect(attempts).toBe(2);
  });
  it('F5 on an error URL restores its destination with a new service instance', async () => {
    configure('reload', '/error/503');
    failing = false;
    await RouterTestingHarness.create('/error/503?returnTo=%2Fprivate%3Ffilter%3Dactive%23details');
    expect(TestBed.inject(Router).url).toBe('/private?filter=active#details');
    expect(attempts).toBe(1);
  });
  it('stops after one automatic retry if the service is still unavailable', async () => {
    configure('reload', '/error/503');
    await RouterTestingHarness.create('/error/503?returnTo=%2Fprivate');
    expect(TestBed.inject(Router).url).toBe('/error/503?returnTo=%2Fprivate');
    expect(attempts).toBe(1);
  });
  it('does not automatically retry errors reached during ordinary navigation or reload of the original page', async () => {
    configure('reload', '/private');
    await RouterTestingHarness.create('/private');
    expect(attempts).toBe(1);
    expect(TestBed.inject(Router).url.startsWith('/error/503')).toBe(true);
  });
  it('a missing route can return to the last valid page with its query string', async () => {
    configure();
    failing = false;
    const harness = await RouterTestingHarness.create('/private?filter=active');
    await harness.navigateByUrl('/missing');
    const router = TestBed.inject(Router);
    expect(router.url.startsWith('/error/404?')).toBe(true);
    expect(router.parseUrl(router.url).queryParams['returnTo']).toBe('/private?filter=active');
    await TestBed.inject(ErrorRecovery).retry();
    expect(router.url).toBe('/private?filter=active');
  });
  it('keeps the last valid destination across consecutive missing routes', async () => {
    configure();
    failing = false;
    const harness = await RouterTestingHarness.create('/private?filter=active');
    await harness.navigateByUrl('/missing');
    await harness.navigateByUrl('/another-missing');
    await TestBed.inject(ErrorRecovery).retry();
    expect(TestBed.inject(Router).url).toBe('/private?filter=active');
  });
  it('an initial 404 safely falls back to home instead of a retry loop', async () => {
    configure();
    await RouterTestingHarness.create('/missing');
    await TestBed.inject(ErrorRecovery).retry();
    expect(TestBed.inject(Router).url).toBe('/');
  });
  it('retries the module when the error URL has no returnTo parameter', async () => {
    configure();
    TestBed.inject(ErrorRecovery).startTracking();
    failing = false;
    const harness = await RouterTestingHarness.create('/private?filter=active#details');
    await harness.navigateByUrl('/error/503');
    await TestBed.inject(ErrorRecovery).retry();
    expect(TestBed.inject(Router).url).toBe('/private?filter=active#details');
  });
  it('restores the tab destination after F5 even when the error URL has no returnTo', async () => {
    sessionStorage.setItem(
      'jaytech_error_recovery',
      JSON.stringify({
        valid: '/private?filter=active#details',
        attempted: '/private?filter=active#details',
      }),
    );
    configure('reload', '/error/503');
    failing = false;
    await RouterTestingHarness.create('/error/503');
    expect(TestBed.inject(Router).url).toBe('/private?filter=active#details');
  });
  it('keeps a failed attempted module instead of falling back to the previous home page', async () => {
    configure();
    TestBed.inject(ErrorRecovery).startTracking();
    const harness = await RouterTestingHarness.create('/');
    await harness.navigateByUrl('/private?filter=active');
    await harness.navigateByUrl('/error/503');
    failing = false;
    await TestBed.inject(ErrorRecovery).retry();
    expect(TestBed.inject(Router).url).toBe('/private?filter=active');
  });
  it('rejects unsafe destinations saved in tab storage', async () => {
    sessionStorage.setItem(
      'jaytech_error_recovery',
      JSON.stringify({
        attempted: 'https://evil.test',
        target: '/error/503',
        valid: '//evil.test',
      }),
    );
    configure('reload', '/error/503');
    await RouterTestingHarness.create('/error/503');
    expect(TestBed.inject(Router).url).toBe('/');
  });
  it('rejects external, nested error and malformed recovery destinations', () => {
    for (const value of [
      'https://evil.test',
      '//evil.test',
      '/error/503',
      '/%65rror/404',
      '/private/../error/500',
      '/private%5cevil',
      '/bad%',
      '/error;test=1',
    ])
      expect(recoveryDestination(value)).toBeNull();
    expect(recoveryDestination('/admin?section=clientes#table')).toBe(
      '/admin?section=clientes#table',
    );
  });
});
