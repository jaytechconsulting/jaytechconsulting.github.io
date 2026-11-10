import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { AdminShell } from './admin-shell';
import { AuthService } from '../../../core/auth/auth.service';
import { AccessService } from '../../../core/access/access.service';
import { ThemeService } from '../../../core/services/theme.service';
import { DialogService } from '../../../core/services/dialog.service';
import { ToastService } from '../../../core/services/toast.service';
import { AdminNavigationState } from './admin-navigation-state';
describe('Responsive admin navigation', () => {
  let small: boolean;
  const leaf = {
    id: 'leaf',
    code: 'leaf',
    label: 'Roles',
    route: '/admin/accesos/roles',
    section: null,
    parentId: 'group',
    permissionId: 'read',
    icon: 'shield',
    sortOrder: 2,
    isActive: true,
  };
  beforeEach(() => {
    small = false;
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: vi.fn() });
    vi.stubGlobal('matchMedia', () => ({ matches: small }));
    TestBed.configureTestingModule({
      imports: [AdminShell],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: {} },
        { provide: ThemeService, useValue: { theme: signal('light') } },
        { provide: DialogService, useValue: {} },
        { provide: ToastService, useValue: {} },
        {
          provide: AccessService,
          useValue: {
            loaded: () => true,
            currentMenu: () => leaf,
            session: () => ({
              menus: [
                {
                  ...leaf,
                  id: 'group',
                  code: 'group',
                  label: 'Security',
                  route: null,
                  parentId: null,
                },
                leaf,
              ],
            }),
          },
        },
      ],
    });
    TestBed.overrideComponent(AdminShell, {
      set: {
        template:
          '<aside class="admin-sidebar"><nav><a class="nav-item is-active" href="#">Current</a></nav></aside><button class="hamburger">Menu</button>',
      },
    });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });
  it('switches viewport modes, closes the mobile drawer and preserves the collapse preference', () => {
    const fixture = TestBed.createComponent(AdminShell);
    fixture.detectChanges();
    const shell = fixture.componentInstance;
    shell.collapsed.set(true);
    small = true;
    shell.onResize();
    expect(shell.mobile()).toBe(true);
    shell.mobileOpen.set(true);
    small = false;
    shell.onResize();
    expect(shell.mobile()).toBe(false);
    expect(shell.mobileOpen()).toBe(false);
    expect(shell.collapsed()).toBe(true);
  });
  it('opens backend menu ancestors and allows collapsing the active group', () => {
    const fixture = TestBed.createComponent(AdminShell);
    fixture.detectChanges();
    const shell = fixture.componentInstance;
    expect(shell.nav()).toHaveLength(2);
    shell.toggleGroup('group');
    expect(shell.nav()).toHaveLength(1);
    shell.toggleGroup('group');
    expect(shell.nav()).toHaveLength(2);
  });
  it('restores sidebar scroll and expanded groups when another module recreates the shell', () => {
    const first = TestBed.createComponent(AdminShell);
    first.detectChanges();
    first.componentInstance.expanded.update((value) => ({ ...value, other: true }));
    const firstNav = first.nativeElement.querySelector('nav') as HTMLElement;
    firstNav.scrollTop = 420;
    first.componentInstance.rememberMenuScroll({ target: firstNav } as unknown as Event);
    first.destroy();
    const next = TestBed.createComponent(AdminShell);
    next.detectChanges();
    expect((next.nativeElement.querySelector('nav') as HTMLElement).scrollTop).toBe(420);
    expect(next.componentInstance.expanded()['other']).toBe(true);
    expect(TestBed.inject(AdminNavigationState).scrollTop).toBe(420);
  });
  it('reveals a selected item below the viewport and focuses it without scrolling the page', () => {
    const fixture = TestBed.createComponent(AdminShell);
    fixture.detectChanges();
    const nav = fixture.nativeElement.querySelector('nav') as HTMLElement;
    const active = nav.querySelector('a')!;
    nav.scrollTop = 100;
    nav.getBoundingClientRect = () => ({ top: 100, bottom: 300 }) as DOMRect;
    active.getBoundingClientRect = () => ({ top: 350, bottom: 398 }) as DOMRect;
    nav.scrollTo = vi.fn();
    const focus = vi.spyOn(active, 'focus');
    const pageScroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    fixture.componentInstance.revealActiveMenu();
    expect(nav.scrollTo).toHaveBeenCalledWith({ top: 210, behavior: 'smooth' });
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(pageScroll).not.toHaveBeenCalled();
  });
  it('reveals items above the viewport and avoids scrolling when they already fit', () => {
    const fixture = TestBed.createComponent(AdminShell);
    fixture.detectChanges();
    const nav = fixture.nativeElement.querySelector('nav') as HTMLElement;
    const active = nav.querySelector('a')!;
    nav.scrollTop = 100;
    nav.getBoundingClientRect = () => ({ top: 100, bottom: 300 }) as DOMRect;
    active.getBoundingClientRect = () => ({ top: 40, bottom: 88 }) as DOMRect;
    nav.scrollTo = vi.fn();
    fixture.componentInstance.revealActiveMenu();
    expect(nav.scrollTo).toHaveBeenCalledWith({ top: 28, behavior: 'smooth' });
    vi.mocked(nav.scrollTo).mockClear();
    active.getBoundingClientRect = () => ({ top: 150, bottom: 198 }) as DOMRect;
    fixture.componentInstance.revealActiveMenu();
    expect(nav.scrollTo).not.toHaveBeenCalled();
  });
  it('does not focus the active item inside a closed mobile menu', () => {
    const fixture = TestBed.createComponent(AdminShell);
    fixture.detectChanges();
    const active = fixture.nativeElement.querySelector('nav a') as HTMLElement;
    const focus = vi.spyOn(active, 'focus');
    fixture.componentInstance.mobile.set(true);
    fixture.componentInstance.mobileOpen.set(false);
    fixture.componentInstance.revealActiveMenu();
    expect(focus).not.toHaveBeenCalled();
  });
  it('reveals the active menu while a request is still pending', () => {
    const fixture = TestBed.createComponent(AdminShell);
    const shell = fixture.componentInstance;
    shell.loading.start();
    const reveal = vi.spyOn(shell, 'revealActiveMenu');
    fixture.detectChanges();
    expect(reveal).toHaveBeenCalledOnce();
    expect(shell.loading.hasPendingRequests()).toBe(true);
  });
});
