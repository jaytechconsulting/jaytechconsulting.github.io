import { DestroyRef, Injectable, InjectionToken, inject } from '@angular/core';
import { CanActivateFn, NavigationEnd, NavigationStart, Router, UrlTree } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { loginRedirect } from '../auth/auth-navigation';

export const DOCUMENT_ENTRY_PATH = new InjectionToken<string>('DOCUMENT_ENTRY_PATH', {
  providedIn: 'root',
  factory: () => window.location.pathname,
});

export const DOCUMENT_NAVIGATION_TYPE = new InjectionToken<string>('DOCUMENT_NAVIGATION_TYPE', {
  providedIn: 'root',
  factory: () =>
    (performance.getEntriesByType?.('navigation')[0] as PerformanceNavigationTiming | undefined)
      ?.type ?? 'navigate',
});

/** Recovery destinations must stay inside the app and must never target another error page. */
export function recoveryDestination(value: string | null | undefined): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\s]/.test(value))
    return null;
  try {
    const path = decodeURIComponent(value.split(/[?#]/)[0]);
    if (/[\\\s]/.test(path) || path.includes('//')) return null;
    const url = new URL(path, 'https://recovery.invalid');
    if (/^\/error(?:[\/;]|$)/i.test(url.pathname)) return null;
    return value;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class ErrorRecovery {
  private readonly router = inject(Router);
  private readonly documentType = inject(DOCUMENT_NAVIGATION_TYPE);
  private readonly entryPath = inject(DOCUMENT_ENTRY_PATH);
  private automaticRetryUsed = false;
  private readonly destroy = inject(DestroyRef);
  private tracking = false;
  private readonly storageKey = 'jaytech_error_recovery';
  private context: { attempted?: string; valid?: string; target?: string } = {};

  constructor() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(this.storageKey) ?? '{}');
      this.context = {
        attempted: this.rememberable(saved.attempted),
        valid: this.rememberable(saved.valid),
        target: this.rememberable(saved.target),
      };
    } catch {}
  }
  private rememberable(value: string | undefined): string | undefined {
    const safe = recoveryDestination(value);
    if (
      !safe ||
      /^\/(login|olvide-password|restablecer-password|restablecer-contrasena)(?:[/?#;]|$)/.test(
        safe,
      )
    )
      return undefined;
    return safe;
  }
  private save(): void {
    try {
      sessionStorage.setItem(this.storageKey, JSON.stringify(this.context));
    } catch {}
  }
  startTracking(): void {
    if (this.tracking) return;
    this.tracking = true;
    this.router.events.pipe(takeUntilDestroyed(this.destroy)).subscribe((event) => {
      if (event instanceof NavigationStart) {
        const attempted = this.rememberable(event.url);
        if (attempted) {
          this.context.attempted = attempted;
          this.context.target = undefined;
          this.save();
        }
      }
      if (event instanceof NavigationEnd) {
        const valid = this.rememberable(event.urlAfterRedirects);
        if (valid) {
          this.context.valid = valid;
          this.save();
        }
      }
    });
  }
  private fallback(): string {
    return (
      this.context.target ??
      this.context.attempted ??
      this.context.valid ??
      recoveryDestination(this.router.lastSuccessfulNavigation()?.finalUrl?.toString()) ??
      '/'
    );
  }

  error(code: 403 | 404 | 500 | 503, destination: string): UrlTree {
    const target = recoveryDestination(destination) ?? this.fallback();
    this.context.target = this.rememberable(target);
    this.save();
    return this.router.createUrlTree(['/error', code], { queryParams: { returnTo: target } });
  }

  notFound(requested: string): UrlTree {
    const previous = this.router.lastSuccessfulNavigation()?.finalUrl?.toString();
    const inherited = previous ? this.router.parseUrl(previous).queryParams['returnTo'] : null;
    const target =
      recoveryDestination(previous) ?? this.context.valid ?? recoveryDestination(inherited) ?? '/';
    this.context.target = this.rememberable(target);
    this.save();
    return this.router.createUrlTree(['/error/404'], {
      queryParams: { returnTo: target, path: requested.split('?')[0] },
    });
  }

  onReload(destination: string | null): true | UrlTree {
    if (
      this.router.navigated ||
      this.documentType !== 'reload' ||
      !/^\/error(?:\/|$)/.test(this.entryPath) ||
      this.automaticRetryUsed
    )
      return true;
    // Consume before redirecting: a persistent failure must show the error instead of looping.
    this.automaticRetryUsed = true;
    return this.router.parseUrl(recoveryDestination(destination) ?? this.fallback());
  }

  target(): string {
    return (
      recoveryDestination(this.router.parseUrl(this.router.url).queryParams['returnTo']) ??
      this.fallback()
    );
  }
  retry(): Promise<boolean> {
    return this.router.navigateByUrl(this.target(), {
      replaceUrl: true,
      onSameUrlNavigation: 'reload',
    });
  }
  signIn(): Promise<boolean> {
    return this.router.navigateByUrl(loginRedirect(this.router, this.target()), {
      replaceUrl: true,
    });
  }
}

export const errorRecoveryGuard: CanActivateFn = (route) =>
  inject(ErrorRecovery).onReload(route.queryParamMap.get('returnTo'));
export const notFoundGuard: CanActivateFn = (_route, state) =>
  inject(ErrorRecovery).notFound(state.url);
