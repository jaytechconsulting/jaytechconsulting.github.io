import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'jaytech-cookie-consent';
const MAX_AGE = 180 * 24 * 60 * 60 * 1000;
interface Consent {
  version: 1;
  analytics: boolean;
  savedAt: number;
}

@Injectable({ providedIn: 'root' })
export class CookieConsentService {
  readonly choice = signal<Consent | null>(this.read());
  readonly preferencesOpen = signal(false);

  open(): void {
    this.preferencesOpen.set(true);
  }

  save(analytics: boolean): void {
    const previous = this.choice()?.analytics;
    const choice: Consent = { version: 1, analytics, savedAt: Date.now() };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(choice));
    } catch {
      /* Keep this visit's choice when storage is unavailable. */
    }
    if (!analytics) this.clearAnalyticsCookies();
    this.choice.set(choice);
    this.preferencesOpen.set(false);
    // Unload already executed third-party code after withdrawal.
    if (previous && !analytics) window.location.reload();
  }

  private clearAnalyticsCookies(): void {
    // GA can set host-only cookies or cookies on a parent domain.
    const domains = window.location.hostname.split('.');
    for (const entry of document.cookie.split(';')) {
      const name = entry.split('=')[0].trim();
      if (name !== '_ga' && !name.startsWith('_ga_')) continue;
      document.cookie = `${name}=; Max-Age=0; path=/`;
      for (let i = 0; i < domains.length - 1; i++) {
        document.cookie = `${name}=; Max-Age=0; path=/; domain=${domains.slice(i).join('.')}`;
      }
    }
  }

  private read(): Consent | null {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
      if (
        value?.version === 1 &&
        typeof value.analytics === 'boolean' &&
        typeof value.savedAt === 'number' &&
        value.savedAt <= Date.now() &&
        Date.now() - value.savedAt < MAX_AGE
      )
        return value;
    } catch {
      /* Invalid or blocked storage requires a fresh choice. */
    }
    return null;
  }
}
