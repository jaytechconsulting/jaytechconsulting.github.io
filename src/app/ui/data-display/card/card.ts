import { Component, computed, input } from '@angular/core';

export type CardElevation = 'none' | 'sm' | 'md' | 'lg';

const ELEVATION_SHADOW: Record<CardElevation, string> = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
};

/**
 * Surface container. `elevation` controls shadow, `interactive` adds hover lift,
 * `accent` shows a top orange bar, `glass` renders a frosted panel for dark surfaces.
 */
@Component({
  selector: 'app-card',
  templateUrl: './card.html',
})
export class Card {
  readonly elevation = input<CardElevation>('sm');
  readonly interactive = input(false);
  readonly accent = input(false);
  readonly glass = input(false);
  readonly padding = input('24px');

  readonly classes = computed(() => {
    const base = 'relative overflow-hidden rounded-lg transition-[transform,box-shadow,border-color] duration-300 ease-[cubic-bezier(.16,1,.3,1)]';
    if (this.glass()) {
      const hover = this.interactive() ? 'motion-card hover:-translate-y-1 focus-within:-translate-y-1 hover:shadow-glow-cyan' : '';
      return `${base} border border-[var(--glass-border)] bg-[var(--glass-dark)] text-text-on-inverse backdrop-blur-md shadow-glow-soft-cyan ${hover}`;
    }
    const hover = this.interactive() ? `motion-card hover:-translate-y-1 focus-within:-translate-y-1 hover:shadow-lg` : '';
    return `${base} border border-border-subtle bg-surface-card ${ELEVATION_SHADOW[this.elevation()]} ${hover}`;
  });
}
