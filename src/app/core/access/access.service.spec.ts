import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AccessService, AccessSession } from './access.service';
import { ModuleActions } from '../../ui/actions/module-actions/module-actions';
@Component({ template: 'Module visible' })
class ModuleView {}
const session: AccessSession = {
  canAdmin: true,
  roles: [{ id: 'role', code: 'viewer', name: 'Viewer' }],
  permissions: [
    { id: 'read', code: 'users.read', resource: 'users', action: 'read', name: 'Ver usuarios' },
  ],
  menus: [
    {
      id: 'menu',
      code: 'users',
      label: 'Usuarios desde DB',
      route: '/admin',
      section: 'usuarios',
      icon: 'user',
      parentId: null,
      permissionId: 'read',
      sortOrder: 1,
      isActive: true,
    },
  ],
};
describe('Dynamic backend access', () => {
  let http: HttpTestingController;
  let access: AccessService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'admin', component: ModuleView },
          { path: 'error/403', component: ModuleView },
          { path: 'error/503', component: ModuleView },
        ]),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    access = TestBed.inject(AccessService);
  });
  afterEach(() => http.verify());
  it('shares concurrent session requests and uses backend permissions', () => {
    access.load().subscribe();
    access.load().subscribe();
    http.expectOne((r) => r.url.endsWith('/access/me')).flush({ data: session });
    expect(access.can('users', 'read')).toBe(true);
    expect(access.can('users', 'update')).toBe(false);
    expect(access.menuFor('/admin?section=usuarios')?.label).toBe('Usuarios desde DB');
    expect(access.menuFor('/admin?section=proyectos')).toBeUndefined();
  });
  it('fails closed when backend access cannot be loaded', () => {
    access.session.set(session);
    access.load(true).subscribe();
    http
      .expectOne((r) => r.url.endsWith('/access/me'))
      .flush({}, { status: 503, statusText: 'Unavailable' });
    expect(access.session().permissions).toHaveLength(0);
    expect(access.session().menus).toHaveLength(0);
  });
  it('does not restore an old account session after logout', () => {
    access.load().subscribe();
    const pending = http.expectOne((r) => r.url.endsWith('/access/me'));
    access.clear();
    pending.flush({ data: session });
    expect(access.session().permissions).toHaveLength(0);
    expect(access.loaded()).toBe(false);
  });
  it('shows toolbar actions from the loaded permission set', () => {
    access.session.set(session);
    access.url.set('/admin?section=usuarios');
    const fixture = TestBed.createComponent(ModuleActions);
    fixture.componentRef.setInput('selected', 'Ana');
    fixture.detectChanges();
    const labels = () =>
      Array.from(fixture.nativeElement.querySelectorAll('button')).map((button: any) =>
        button.textContent.trim(),
      );
    expect(labels()).toEqual(['Ver']);
    access.session.set({
      ...session,
      permissions: [
        ...session.permissions,
        { id: 'edit', code: 'users.update', resource: 'users', action: 'update', name: 'Editar' },
      ],
    });
    fixture.detectChanges();
    expect(labels()).toEqual(['Ver', 'Editar']);
  });
  it('finishes navigation before background permissions arrive', async () => {
    access.session.set(session);
    access.loaded.set(true);
    access.revalidateAfterNavigation();
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/admin?section=usuarios');
    const pending = http.expectOne((r) => r.url.endsWith('/access/me'));
    expect(router.url).toBe('/admin?section=usuarios');
    expect(access.loaded()).toBe(true);
    pending.flush({ data: session });
    expect(access.can('users', 'read')).toBe(true);
  });
  it('leaves a module if permissions were revoked during background validation', async () => {
    access.session.set(session);
    access.loaded.set(true);
    access.revalidateAfterNavigation();
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/admin?section=usuarios');
    http
      .expectOne((r) => r.url.endsWith('/access/me'))
      .flush({ data: { canAdmin: false, roles: [], menus: [], permissions: [] } });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(router.url).toBe('/error/403?returnTo=%2Fadmin%3Fsection%3Dusuarios');
  });
  it('does not redirect a new account because of an old background request', async () => {
    access.session.set(session);
    access.loaded.set(true);
    access.revalidateAfterNavigation();
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/admin?section=usuarios');
    const pending = http.expectOne((r) => r.url.endsWith('/access/me'));
    access.clear();
    pending.flush({ data: session });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(router.url).toBe('/admin?section=usuarios');
    expect(access.loaded()).toBe(false);
    expect(access.session().menus).toHaveLength(0);
  });
});
