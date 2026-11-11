import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { routes } from '../../../app.routes';
import { authGuard } from '../../../core/auth/auth.guard';
import { AccessService } from '../../../core/access/access.service';
import { firstValueFrom, isObservable, of, throwError } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { AdminContent } from './admin-content';
import { CONTENT_MODULES } from './content-modules';
describe('Independent content modules', () => {
  it('gives each section a unique protected URL and the correct editor section', async () => {
    expect(CONTENT_MODULES.length).toBeGreaterThan(0);
    expect(new Set(CONTENT_MODULES.map((module) => module.route)).size).toBe(
      CONTENT_MODULES.length,
    );
    for (const module of CONTENT_MODULES) {
      const route = routes.find((route) => route.path === module.route.slice(1));
      expect(await route?.loadComponent?.()).toBe(AdminContent);
      expect(route?.data?.['contentSection']).toBe(module.section);
      expect(route?.data?.['role']).toBe('admin');
      expect(route?.canActivate).toContain(authGuard);
    }
  });
  it('keeps the previous content URL as an exact redirect', () => {
    expect(routes.find((route) => route.path === 'admin/contenido')).toMatchObject({
      redirectTo: 'admin/empresas',
      pathMatch: 'full',
    });
  });
  it('requires a verified session and backend permission for content modules', async () => {
    let authenticated = false,
      canAdmin = false;
    const auth = {
      isAuthenticated: () => authenticated,
      currentUser: () => ({ role: 'admin' }),
      clearSession: () => {},
      loadAdminSession: () =>
        authenticated ? of(access.session()) : throwError(() => ({ status: 401 })),
    };
    const access = {
      loaded: () => true,
      session: () => ({ canAdmin, menus: [], permissions: [{ id: 'read' }] }),
      menuFor: () => ({ permissionId: 'read' }),
      revalidateAfterNavigation: () => {},
    };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        { provide: AccessService, useValue: access },
      ],
    });
    const router = TestBed.inject(Router),
      snapshot = { data: { role: 'admin' } } as unknown as ActivatedRouteSnapshot;
    const check = async () => {
      const result = TestBed.runInInjectionContext(() =>
        authGuard(snapshot, { url: '/admin/empresas' } as RouterStateSnapshot),
      );
      return isObservable(result) ? await firstValueFrom(result) : await result;
    };
    expect(router.serializeUrl((await check()) as UrlTree)).toContain('/login');
    authenticated = true;
    expect(router.serializeUrl((await check()) as UrlTree)).toContain('/error/403');
    canAdmin = true;
    expect(await check()).toBe(true);
  });
});
