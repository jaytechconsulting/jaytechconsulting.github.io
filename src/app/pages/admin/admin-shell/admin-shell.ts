import { SITE_EDITOR_TABS } from '../admin-content/content-modules';
import { firstValueFrom } from 'rxjs';
import { AccessService, AccessMenu } from '../../../core/access/access.service';
import { Icon } from '../../../ui/data-display/icon/icon';
import { OverlayScroll } from '../../../ui/behaviors/overlay-scroll';
import { UserMenu } from '../../../ui/navigation/user-menu/user-menu';
import { LoadingService } from '../../../core/services/loading.service';
import { DialogService } from '../../../core/services/dialog.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  signal,
  computed,
  effect,
  untracked,
  afterRenderEffect,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ThemeService } from '../../../core/services/theme.service';
import { AuthService } from '../../../core/auth/auth.service';
import { AdminNavigationState } from './admin-navigation-state';

@Component({
  selector: 'app-admin-shell',
  imports: [RouterLink, UserMenu, OverlayScroll, Icon],
  templateUrl: './admin-shell.html',
  styleUrl: './admin-shell.css',
})
export class AdminShell {
  readonly title = input('Administración');
  readonly active = input('resumen');
  readonly theme = inject(ThemeService);
  readonly auth = inject(AuthService);
  readonly loading = inject(LoadingService);
  private readonly dialogs = inject(DialogService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly collapsed = signal(localStorage.getItem('jaytech-admin-collapsed') === 'true');
  readonly mobileOpen = signal(false);
  readonly sidebarMotion = signal<'expanding' | 'collapsing' | null>(null);
  readonly mobile = signal(matchMedia('(max-width: 767px)').matches);
  @HostListener('window:resize') onResize(): void {
    const next = matchMedia('(max-width: 767px)').matches;
    if (next === this.mobile()) return;
    const sidebarFocused = this.element.nativeElement
      .querySelector('.admin-sidebar')
      ?.contains(document.activeElement);
    const wasOpen = this.mobileOpen();
    this.mobile.set(next);
    if (!next) this.mobileOpen.set(false);
    if (next && sidebarFocused)
      requestAnimationFrame(() =>
        this.element.nativeElement
          .querySelector<HTMLElement>('.hamburger')
          ?.focus({ preventScroll: true }),
      );
    else if (!next && wasOpen && !this.access.currentMenu())
      requestAnimationFrame(() =>
        this.element.nativeElement
          .querySelector<HTMLElement>('.admin-brand')
          ?.focus({ preventScroll: true }),
      );
  }
  readonly access = inject(AccessService);
  private readonly navigationState = inject(AdminNavigationState);
  private restoreNavigationPosition = true;
  readonly expanded = this.navigationState.expanded;
  rememberMenuScroll(event: Event): void {
    this.navigationState.scrollTop = (event.target as HTMLElement).scrollTop;
  }
  private readonly siteMenu = computed(() => {
    const menus = this.access.session().menus;
    return SITE_EDITOR_TABS.map((tab) => menus.find((menu) => menu.route === tab.route)).find(
      Boolean,
    );
  });
  private isSiteEditor(route: string | null | undefined): boolean {
    return SITE_EDITOR_TABS.some((tab) => tab.route === route);
  }
  readonly displayedMenu = computed(() => {
    const current = this.access.currentMenu();
    return this.isSiteEditor(current?.route) ? this.siteMenu() : current;
  });
  readonly navTitle = computed(() =>
    this.isSiteEditor(this.access.currentMenu()?.route)
      ? 'Sitio web'
      : this.access.currentMenu()?.label,
  );
  readonly nav = computed(() => {
    const site = this.siteMenu();
    const menus = this.access
      .session()
      .menus.filter((menu) => !this.isSiteEditor(menu.route) || menu.id === site?.id);
    const result: (AccessMenu & { depth: number; hasChildren: boolean; expanded: boolean })[] = [];
    const walk = (parentId: string | null, depth: number) => {
      for (const menu of menus.filter((m) => m.parentId === parentId)) {
        const hasChildren = menus.some((m) => m.parentId === menu.id);
        const ancestorOfCurrent = this.isAncestor(menu, this.displayedMenu());
        const expanded = this.expanded()[menu.id] ?? ancestorOfCurrent;
        result.push({
          ...menu,
          label: menu.id === site?.id ? 'Sitio web' : menu.label,
          depth,
          hasChildren,
          expanded,
        });
        if (hasChildren && expanded) walk(menu.id, depth + 1);
      }
    };
    walk(null, 0);
    return result;
  });
  private isAncestor(menu: AccessMenu, current: AccessMenu | undefined): boolean {
    let parent = current?.parentId;
    const menus = this.access.session().menus;
    while (parent) {
      if (parent === menu.id) return true;
      parent = menus.find((m) => m.id === parent)?.parentId;
    }
    return false;
  }
  toggleGroup(id: string): void {
    const open = this.nav().find((item) => item.id === id)?.expanded ?? false;
    this.expanded.update((current) => ({ ...current, [id]: !open }));
    if (this.collapsed() && !this.mobile()) this.toggleCollapsed();
  }
  private readonly activeMenuId = computed(() => this.displayedMenu()?.id);
  private readonly pendingActiveFocus = signal(false);
  private expandActiveAncestors(): void {
    const menus = this.access.session().menus;
    let parent = this.displayedMenu()?.parentId;
    const expanded = { ...this.expanded() };
    const visited = new Set<string>();
    while (parent && !visited.has(parent)) {
      visited.add(parent);
      expanded[parent] = true;
      parent = menus.find((menu) => menu.id === parent)?.parentId;
    }
    this.expanded.set(expanded);
  }
  revealActiveMenu(): void {
    if (this.mobile() && !this.mobileOpen()) return;
    const nav = this.element.nativeElement.querySelector<HTMLElement>('nav');
    const active = nav?.querySelector<HTMLElement>('.nav-item.is-active');
    if (!nav || !active) return;
    const viewport = nav.getBoundingClientRect(),
      item = active.getBoundingClientRect();
    const padding = 12;
    let top = nav.scrollTop;
    if (item.top < viewport.top + padding) top += item.top - viewport.top - padding;
    else if (item.bottom > viewport.bottom - padding)
      top += item.bottom - viewport.bottom + padding;
    active.focus({ preventScroll: true });
    top = Math.max(0, top);
    if (top !== nav.scrollTop)
      nav.scrollTo({
        top,
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      });
  }
  constructor() {
    if (!this.access.loaded()) this.access.load().subscribe();
    effect(() => {
      const id = this.activeMenuId();
      const visible = !this.mobile() || this.mobileOpen();
      if (id && visible)
        untracked(() => {
          this.expandActiveAncestors();
          this.pendingActiveFocus.set(true);
        });
    });
    afterRenderEffect(() => {
      if (!this.pendingActiveFocus() || (this.mobile() && !this.mobileOpen())) return;
      if (this.restoreNavigationPosition) {
        const nav = this.element.nativeElement.querySelector<HTMLElement>('nav');
        if (nav) {
          nav.scrollTop = this.navigationState.scrollTop;
          this.restoreNavigationPosition = false;
        }
      }
      this.revealActiveMenu();
      this.pendingActiveFocus.set(false);
    });
  }
  toggleCollapsed(): void {
    this.sidebarMotion.set(this.collapsed() ? 'expanding' : 'collapsing');
    this.collapsed.update((value) => !value);
    localStorage.setItem('jaytech-admin-collapsed', String(this.collapsed()));
  }
  openMenu(): void {
    this.mobileOpen.set(true);
    if (!this.access.currentMenu())
      requestAnimationFrame(() =>
        this.element.nativeElement
          .querySelector<HTMLElement>('.mobile-close')
          ?.focus({ preventScroll: true }),
      );
  }
  @HostListener('document:keydown.escape') closeMenu(): void {
    const wasOpen = this.mobileOpen();
    this.mobileOpen.set(false);
    if (wasOpen)
      this.element.nativeElement
        .querySelector<HTMLElement>('.hamburger')
        ?.focus({ preventScroll: true });
  }
  @HostListener('document:keydown', ['$event']) trapFocus(event: KeyboardEvent): void {
    if (this.dialogs.dialog() || !this.mobile() || !this.mobileOpen() || event.key !== 'Tab')
      return;
    const controls = Array.from(
      this.element.nativeElement.querySelectorAll<HTMLElement>(
        '.admin-sidebar a, .admin-sidebar button',
      ),
    ).filter((el) => el.getClientRects().length);
    const first = controls[0],
      last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
  async logout(): Promise<void> {
    if (this.loading.hasPendingRequests() || this.dialogs.dialog()) return;
    this.closeMenu();
    const confirmed = await this.dialogs.question({
      title: '¿Cerrar sesión?',
      message: 'Tendrás que iniciar sesión nuevamente para acceder al administrador.',
      confirmLabel: 'Cerrar sesión',
      cancelLabel: 'Seguir trabajando',
    });
    if (!confirmed) return;
    try {
      await firstValueFrom(this.auth.logout());
    } catch {
      this.toast.error('No pudimos cerrar la sesión', 'Inténtalo nuevamente.');
      return;
    }
    this.toast.info('Sesión cerrada', 'Has salido del administrador.');
    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
