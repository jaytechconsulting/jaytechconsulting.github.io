import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { CookieConsentService } from './cookie-consent.service';

type AnalyticsWindow = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private initialized = false;
  private readonly consent = inject(CookieConsentService);
  constructor(@Inject(DOCUMENT) private readonly document: Document) {}

  init(): void {
    const window = this.document.defaultView as AnalyticsWindow | null;
    if (!window || !this.consent.choice()?.analytics || this.initialized) return;
    const containerId = environment.tagManagerId;
    if (!containerId) return;
    window.dataLayer = window.dataLayer ?? [];
    window.gtag = (...args: unknown[]) => window.dataLayer?.push(args);
    window.gtag('consent', 'default', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
    window.gtag('js', new Date());
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    const script = this.document.createElement('script');
    script.id = 'google-tag-manager-script';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(containerId)}`;
    this.document.head.appendChild(script);
    // GA4 configuration and triggers are managed in this container.
    this.initialized = true;
    this.pageView(window.location.pathname + window.location.search);
  }

  pageView(path: string): void {
    const window = this.document.defaultView as AnalyticsWindow | null;
    if (!this.initialized || !this.consent.choice()?.analytics || !window?.gtag) return;
    window.dataLayer?.push({ event: 'app_page_view', page_path: path });
  }
}
