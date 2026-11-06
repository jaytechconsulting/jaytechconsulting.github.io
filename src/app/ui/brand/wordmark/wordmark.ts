import { Component, computed, input } from '@angular/core';

export type WordmarkSize = 'sm' | 'md' | 'lg';
export type WordmarkTone = 'dark' | 'light';

const SIZE_PX: Record<WordmarkSize, string> = {
  sm: '20px',
  md: '32px',
  lg: '38px',
};

/** Jaytech logo lockup. `tone="dark"` renders the full-color mark for light
 * backgrounds; `tone="light"` renders the on-dark mark for inverse surfaces.
 * `animated` inlines the draw-in lockup (mark stroke + staggered text reveal)
 * instead of the static image — intended for a logo that mounts once, not
 * one that remounts on every route change. */
@Component({
  selector: 'app-wordmark',
  templateUrl: './wordmark.html',
})
export class Wordmark {
  readonly size = input<WordmarkSize>('md');
  readonly tone = input<WordmarkTone>('dark');
  readonly animated = input(false);

  readonly height = computed(() => SIZE_PX[this.size()]);
  readonly isOnDark = computed(() => this.tone() === 'light');
  readonly logoSrc = computed(() => (this.isOnDark() ? 'brand/logo-horizontal-on-dark.svg' : 'brand/logo-horizontal.svg'));
}
