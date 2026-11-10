import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  provideRouter,
} from '@angular/router';
import { firstValueFrom, isObservable, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { AccessService } from '../access/access.service';
import { privateReturnUrl } from './auth-navigation';

describe('Private route authorization', () => {
  let auth: any, access: any, router: Router;
  beforeEach(() => {
    auth = {
      currentUser: vi.fn(() => ({ role: 'admin' })),
      isAuthenticated: vi.fn(() => true),
      clearSession: vi.fn(),
      loadProfile: vi.fn(() => of({ role: 'admin' })),
    };
    const session = { canAdmin: true, menus: [], permissions: [{ id: 'read' }] };
    access = {
      session: vi.fn(() => session),
      revalidateAfterNavigation: vi.fn(),
      load: vi.fn(() => {
        access.loaded.mockReturnValue(true);
        return of(session);
      }),
      loaded: vi.fn(() => false),
      menuFor: vi.fn(() => ({ permissionId: 'read' })),
      link: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        { provide: AccessService, useValue: access },
      ],
    });
    router = TestBed.inject(Router);
  });
  async function navigate(url = '/admin/usuarios', role = 'admin') {
    const result = TestBed.runInInjectionContext(() =>
      authGuard(
        { data: { role } } as unknown as ActivatedRouteSnapshot,
        { url } as RouterStateSnapshot,
      ),
    );
    return isObservable(result) ? await firstValueFrom(result) : await result;
  }
  it('redirects logged-out deep links with their full query string', async () => {
    auth.loadProfile.mockReturnValue(throwError(() => ({ status: 401 })));
    const result = await navigate('/admin?section=clientes');
    expect(router.serializeUrl(result as any)).toBe(
      '/login?redirectTo=%2Fadmin%3Fsection%3Dclientes',
    );
    expect(auth.loadProfile).toHaveBeenCalled();
  });
  it('redirects expired sessions to login instead of forbidden', async () => {
    auth.loadProfile.mockReturnValue(throwError(() => ({ status: 401 })));
    expect(router.serializeUrl((await navigate()) as any)).toBe(
      '/login?redirectTo=%2Fadmin%2Fusuarios',
    );
    expect(auth.clearSession).toHaveBeenCalled();
  });
  it('does not grant admin profile to an authenticated account with no admin access', async () => {
    access.load.mockImplementation(() => {
      access.loaded.mockReturnValue(true);
      return of({ canAdmin: false, menus: [], permissions: [] });
    });
    expect(router.serializeUrl((await navigate('/admin/perfil')) as any)).toBe(
      '/error/403?returnTo=%2Fadmin%2Fperfil',
    );
  });
  it('requires both a backend menu and its effective permission', async () => {
    expect(await navigate()).toBe(true);
    access.menuFor.mockReturnValue({ permissionId: 'missing' });
    expect(router.serializeUrl((await navigate()) as any)).toBe(
      '/error/403?returnTo=%2Fadmin%2Fusuarios',
    );
  });
  it('fails closed on an unavailable permissions service without logging out', async () => {
    access.loaded.mockReturnValue(false);
    access.load.mockImplementation(() => of({ canAdmin: false, menus: [], permissions: [] }));
    expect(router.serializeUrl((await navigate()) as any)).toBe(
      '/error/503?returnTo=%2Fadmin%2Fusuarios',
    );
    expect(auth.clearSession).not.toHaveBeenCalled();
  });
  it('shows service unavailability instead of login when restoring an unknown session fails', async () => {
    auth.isAuthenticated.mockReturnValue(false);
    auth.loadProfile.mockReturnValue(throwError(() => ({ status: 503 })));
    expect(router.serializeUrl((await navigate()) as any)).toBe(
      '/error/503?returnTo=%2Fadmin%2Fusuarios',
    );
    expect(auth.clearSession).not.toHaveBeenCalled();
  });
  it('uses the server-verified in-memory role for client routes', async () => {
    expect(router.serializeUrl((await navigate('/panel-cliente', 'client')) as any)).toBe('/admin');
    auth.currentUser.mockReturnValue({ role: 'client' });
    expect(await navigate('/panel-cliente', 'client')).toBe(true);
    expect(auth.loadProfile).not.toHaveBeenCalled();
  });
  it('routes a restored administrator session to admin from the portal entry', async () => {
    auth.isAuthenticated.mockReturnValue(false);
    auth.loadProfile.mockImplementation(() => {
      auth.isAuthenticated.mockReturnValue(true);
      return of({ role: 'admin' });
    });
    expect(
      router.serializeUrl((await navigate('/panel-cliente?tab=cursos', 'client')) as any),
    ).toBe('/admin');
  });
  it('keeps client deep links restricted to client accounts', async () => {
    expect(
      router.serializeUrl((await navigate('/panel-cliente/tickets/nuevo', 'client')) as any),
    ).toBe('/error/403?returnTo=%2Fpanel-cliente%2Ftickets%2Fnuevo');
  });
  it('redirects an unauthenticated portal visit to login with its destination', async () => {
    auth.isAuthenticated.mockReturnValue(false);
    auth.loadProfile.mockReturnValue(throwError(() => ({ status: 401 })));
    expect(router.serializeUrl((await navigate('/panel-cliente', 'client')) as any)).toBe(
      '/login?redirectTo=%2Fpanel-cliente',
    );
  });
  it('activates a known module without waiting for profile or permissions HTTP and queues revalidation', async () => {
    access.loaded.mockReturnValue(true);
    expect(await navigate()).toBe(true);
    expect(auth.loadProfile).not.toHaveBeenCalled();
    expect(access.load).not.toHaveBeenCalled();
    expect(access.revalidateAfterNavigation).toHaveBeenCalledOnce();
  });
  it('does not use a previous account permission cache when the session has been cleared', async () => {
    access.loaded.mockReturnValue(true);
    auth.isAuthenticated.mockReturnValue(false);
    auth.loadProfile.mockReturnValue(throwError(() => ({ status: 401 })));
    expect(router.serializeUrl((await navigate()) as any)).toContain('/login');
    expect(auth.loadProfile).toHaveBeenCalled();
    expect(access.revalidateAfterNavigation).not.toHaveBeenCalled();
  });
  it('accepts private internal return URLs and rejects external or malformed destinations', () => {
    expect(privateReturnUrl('/admin?section=clientes')).toBe('/admin?section=clientes');
    for (const value of [
      'https://evil.test',
      '//evil.test',
      '/login',
      '/admin%2f%2fevil',
      '/admin%5cevil',
      '/admin/%',
      'admin/usuarios',
    ])
      expect(privateReturnUrl(value)).toBeNull();
  });
});
