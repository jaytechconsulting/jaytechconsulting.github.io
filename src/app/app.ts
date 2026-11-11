import { CookieConsent } from './ui/feedback/cookie-consent/cookie-consent';
import { CookieConsentService } from './core/services/cookie-consent.service';
import { ErrorRecovery } from './core/errors/error-recovery';
import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { isBrowser } from './core/platform';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterOutlet,
} from '@angular/router';
import { filter } from 'rxjs';
import { Loader } from './ui/brand/loader/loader';
import { NavProgressBar } from './ui/feedback/nav-progress-bar/nav-progress-bar';
import { ToastStack } from './ui/feedback/toast/toast-stack';
import { DialogOutlet } from './ui/feedback/dialog/dialog-outlet';
import { DialogService } from './core/services/dialog.service';
import { LoadingService } from './core/services/loading.service';
import { AnalyticsService } from './core/services/analytics.service';
import { SeoService } from './core/services/seo.service';
import { CmsContentService } from './core/cms/cms-content.service';
import { CartFooter } from './ui/marketing/cart-footer/cart-footer';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    Loader,
    NavProgressBar,
    ToastStack,
    DialogOutlet,
    CartFooter,
    CookieConsent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  // DOCUMENT also carries the route being prerendered, where there is no window.
  private readonly adminEntry = inject(DOCUMENT).location.pathname.startsWith('/admin');
  private readonly cms = inject(CmsContentService);
  readonly loaderEnabled = computed(() => this.cms.loader().enabled);
  readonly loaderColor = computed(() => this.cms.loader().color);
  readonly showLoader = signal(!this.adminEntry && this.loaderEnabled());
  readonly browser = isBrowser;
  readonly showProgressBar = signal(false);
  readonly pageFade = signal(false);
  readonly inAdmin = signal(this.adminEntry);
  private lastRouteWasAdmin = this.adminEntry;
  private readonly booted = signal(this.adminEntry || !this.loaderEnabled());
  private readonly router = inject(Router);
  private readonly errorRecovery = inject(ErrorRecovery);
  readonly loading = inject(LoadingService);
  readonly dialogs = inject(DialogService);
  private readonly analytics = inject(AnalyticsService);
  private readonly seo = inject(SeoService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.errorRecovery.startTracking();
    const consent = inject(CookieConsentService);
    effect(() => {
      if (!this.inAdmin() && consent.choice()?.analytics) this.analytics.init();
    });
    this.seo.init();
    const subscription = this.router.events
      .pipe(
        filter(
          (event) =>
            event instanceof NavigationStart ||
            event instanceof NavigationEnd ||
            event instanceof NavigationCancel ||
            event instanceof NavigationError,
        ),
      )
      .subscribe((event) => {
        if (event instanceof NavigationStart) {
          this.inAdmin.set(event.url.startsWith('/admin'));
          if (this.isAnchorNavigation(event.url)) return;
          if (this.booted() || !this.loaderEnabled()) {
            this.showProgressBar.set(true);
          } else {
            this.navigationReady.set(false);
            this.loaderReady.set(false);
            this.showLoader.set(true);
          }
        }
        if (event instanceof NavigationEnd) {
          const admin = /^\/admin(?:[/?#;]|$)/.test(event.urlAfterRedirects);
          if (!admin && this.lastRouteWasAdmin) this.cms.retryPublic();
          this.lastRouteWasAdmin = admin;
          this.inAdmin.set(admin);
          if (!admin) this.analytics.pageView(event.urlAfterRedirects);
          this.navigationReady.set(true);
          this.showProgressBar.set(false);
          this.pageFade.set(false);
          if (isBrowser) requestAnimationFrame(() => this.pageFade.set(true));
        }
        if (event instanceof NavigationCancel || event instanceof NavigationError) {
          this.inAdmin.set(/^\/admin(?:[/?#;]|$)/.test(this.router.url));
          this.navigationReady.set(true);
          this.showProgressBar.set(false);
        }
      });
    effect(() => {
      this.loading.hasPendingRequests();
      this.tryHideLoader();
    });
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }

  readonly navigationReady = signal(false);
  private readonly loaderReady = signal(this.adminEntry || !this.loaderEnabled());

  finishLoader(): void {
    this.loaderReady.set(true);
    this.tryHideLoader();
  }

  private tryHideLoader(): void {
    if (this.navigationReady() && this.loaderReady() && !this.loading.hasPendingRequests()) {
      this.showLoader.set(false);
      this.booted.set(true);
    }
  }

  private isAnchorNavigation(url: string): boolean {
    const path = url.split('#', 1)[0] || '/';
    const currentPath = this.router.url.split('#', 1)[0] || '/';
    return url.includes('#') && url !== this.router.url && path === currentPath;
  }
}
