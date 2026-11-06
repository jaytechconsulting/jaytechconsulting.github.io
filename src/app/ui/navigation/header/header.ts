import { Component, DestroyRef, computed, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs';
import { Wordmark } from '../../brand/wordmark/wordmark';
import { Button } from '../../actions/button/button';
import { ThemeService } from '../../../core/theme.service';

export type HeaderLinkVariant = '' | 'primary' | 'outline';

export interface HeaderLink {
  label: string;
  href: string;
  variant?: HeaderLinkVariant;
}

const DEFAULT_LINKS: HeaderLink[] = [
  { label: 'Proyectos', href: '#proyectos', variant: '' },
  { label: 'Planes', href: '#planes', variant: '' },
  { label: 'Nosotros', href: '#nosotros', variant: '' },
];

export const HOME_HREF = '/';
export const CONOCENOS_HREF = '/conocenos';

export interface ServiceLink {
  label: string;
  href: string;
}

export const SERVICES_DROPDOWN: ServiceLink[] = [
  { label: 'Asesorías', href: '/asesorias' },
  { label: 'Capacitaciones', href: '/capacitaciones' },
];

/** Marketing site top navigation. Sticky, links + CTA. Glassy on light, solid on dark. Collapses to hamburger menu below 820px.
 * "Inicio" and the "Servicios" dropdown are fixed structural items — they aren't part of the
 * admin-editable `links` collection, since those are shortcuts to other sections/pages. */
@Component({
  selector: 'app-header',
  imports: [Wordmark, Button, RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  private readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);

  readonly homeHref = HOME_HREF;
  readonly conocenosHref = CONOCENOS_HREF;
  readonly servicesDropdown = SERVICES_DROPDOWN;
  readonly links = input<HeaderLink[]>(DEFAULT_LINKS);
  readonly cta = input('Solicitar propuesta');
  readonly inverse = input(false);
  readonly ctaClicked = output<void>();

  /** "Servicios" is a fixed structural dropdown (above) — admin-saved links with that same
   * label/href are legacy data from before the refactor and must never render a second time. */
  private static isReservedServicesLink(link: HeaderLink): boolean {
    return link.label.trim().toLowerCase() === 'servicios' || link.href === '#servicios';
  }

  readonly navLinks = computed(() => this.links().filter((link) => !link.variant && !Header.isReservedServicesLink(link)));
  readonly buttonLinks = computed(() => this.links().filter((link) => link.variant && !Header.isReservedServicesLink(link)));

  readonly menuOpen = signal(false);
  readonly theme = this.themeService.theme;
  readonly scrolled = signal(false);

  /** Anchor sections on the home page (e.g. "#planes") aren't real routes, so clicking one
   * marks the pill immediately; any real route change below overrides it. */
  private readonly clickedLink = signal<string | null>(null);
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly activeLink = computed(() => {
    const path = this.currentUrl().split('?')[0].split('#')[0] || '/';
    if (path === '/') return this.clickedLink() ?? HOME_HREF;
    if (path === '/asesorias' || path.startsWith('/asesorias/') || path === '/capacitaciones' || path.startsWith('/capacitaciones/')) return '#servicios';
    return path;
  });

  constructor() {
    const onScroll = () => this.scrolled.set(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    inject(DestroyRef).onDestroy(() => window.removeEventListener('scroll', onScroll));
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  selectLink(href: string): void {
    this.clickedLink.set(href);
  }

  linkClasses(href: string): string {
    const active = this.activeLink() === href;
    const base = 'rounded-pill px-3.5 py-1.5 font-body text-[15px] font-medium no-underline transition-colors duration-200 ease-out';
    if (active) {
      return `${base} bg-accent-primary text-text-on-brand`;
    }
    return [
      base,
      'hover:text-brand-orange',
      this.inverse() ? 'text-text-on-inverse' : 'text-text-body',
    ].join(' ');
  }

  extraButtonClasses(variant: HeaderLinkVariant, size: 'sm' | 'lg' = 'sm'): string {
    const base = 'inline-flex items-center justify-center rounded-pill font-body font-bold no-underline leading-none transition-[transform,filter] duration-200 ease-out hover:brightness-95 active:scale-[0.97]';
    const sizeClasses = size === 'lg' ? 'gap-2 px-[22px] py-3 text-[15px]' : 'gap-1.5 px-4 py-2 text-sm';
    const variantClasses = variant === 'outline' ? 'border-2 border-border-strong bg-transparent text-text-strong' : 'border-2 border-transparent bg-accent-primary text-text-on-brand shadow-brand';
    return `${base} ${sizeClasses} ${variantClasses}`;
  }

  readonly headerClasses = computed(() => {
    if (this.inverse()) return 'relative block bg-surface-inverse border-b border-border-inverse';
    const transition = 'relative block border-b transition-[background-color,backdrop-filter,border-color] duration-300 ease-out';
    if (this.scrolled()) return `${transition} bg-[var(--glass-header)] backdrop-blur-md backdrop-saturate-[1.8] border-border-subtle`;
    return `${transition} bg-transparent backdrop-blur-none border-transparent`;
  });

  readonly barClasses = computed(() => {
    const base = ['block h-0.5 w-6 rounded-sm transition-[transform,opacity] duration-200 ease-out', this.inverse() ? 'bg-text-on-inverse' : 'bg-text-strong'].join(' ');
    const open = this.menuOpen();
    return [
      `${base} ${open ? 'translate-y-[7px] rotate-45' : ''}`,
      `${base} ${open ? 'opacity-0' : ''}`,
      `${base} ${open ? '-translate-y-[7px] -rotate-45' : ''}`,
    ];
  });

  readonly mobileNavClasses = computed(() =>
    [
      'absolute inset-x-0 top-full z-[60] flex min-[821px]:hidden flex-col gap-1 px-[clamp(20px,5vw,32px)] pt-3 pb-5 shadow-lg border-b',
      this.inverse() ? 'bg-surface-inverse border-border-inverse' : 'bg-surface-card border-border-subtle',
    ].join(' '),
  );

  mobileLinkClasses(href: string): string {
    const active = this.activeLink() === href;
    if (active) {
      return 'rounded-sm px-2 py-3 font-body text-base font-medium no-underline bg-accent-primary text-text-on-brand';
    }
    return [
      'rounded-sm px-2 py-3 font-body text-base font-medium no-underline transition-colors duration-200 ease-out hover:text-brand-orange',
      this.inverse() ? 'text-text-on-inverse' : 'text-text-body',
    ].join(' ');
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  onMobileCta(): void {
    this.closeMenu();
    this.ctaClicked.emit();
  }
}
