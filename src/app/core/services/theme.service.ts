import { Injectable, effect, signal } from '@angular/core';
import { isBrowser } from '../platform';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'jaytech-theme';

function initialTheme(): Theme {
  // Prerendered HTML carries no theme; index.html applies the visitor's theme before first paint.
  if (!isBrowser) return 'light';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(initialTheme());

  constructor() {
    effect(() => {
      const value = this.theme();
      if (!isBrowser) return;
      document.documentElement.setAttribute('data-theme', value);
      localStorage.setItem(STORAGE_KEY, value);
    });
  }

  toggle(): void {
    this.theme.update((current) => (current === 'dark' ? 'light' : 'dark'));
  }
}
