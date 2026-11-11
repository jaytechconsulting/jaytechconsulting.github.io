import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AppVersionService {
  readonly updateAvailable = signal(false);

  constructor() {
    const document = inject(DOCUMENT);
    const destroy = inject(DestroyRef);
    const browser = document.defaultView;
    const current = document.querySelector<HTMLMetaElement>('meta[name="build-id"]')?.content;
    if (!environment.production || !browser || !current) return;

    const controller = new AbortController();
    let checking = false;
    const check = async () => {
      if (checking || document.hidden || this.updateAvailable()) return;
      checking = true;
      try {
        const response = await browser.fetch(new URL('version.json', document.baseURI), {
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok) return;
        const published = Date.parse((await response.json()).buildId);
        if (published > Date.parse(current)) this.updateAvailable.set(true);
      } catch {
        // A failed check can be retried when the tab gains focus or the timer fires.
      } finally {
        checking = false;
      }
    };
    const timer = browser.setInterval(check, 60_000);
    browser.addEventListener('focus', check);
    document.addEventListener('visibilitychange', check);
    destroy.onDestroy(() => {
      browser.clearInterval(timer);
      browser.removeEventListener('focus', check);
      document.removeEventListener('visibilitychange', check);
      controller.abort();
    });
    void check();
  }

  reload(): void {
    globalThis.location.reload();
  }
}
