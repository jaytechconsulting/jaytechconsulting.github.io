import { Component, computed, input } from '@angular/core';

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: 'bg-ink-100 text-text-body',
  brand: 'bg-[rgba(255,107,53,0.14)] text-brand-orange-600',
  success: 'bg-success-tint text-success',
  warning: 'bg-warning-tint text-brand-yellow-600',
  danger: 'bg-danger-tint text-danger',
  info: 'bg-info-tint text-info',
};

/** Small status pill in a mono typeface. */
@Component({
  selector: 'app-badge',
  templateUrl: './badge.html',
})
export class Badge {
  readonly tone = input<BadgeTone>('neutral');
  readonly dot = input(false);

  readonly classes = computed(
    () =>
      `inline-flex shrink-0 items-center whitespace-nowrap gap-1.5 rounded-pill px-2.5 py-1 font-mono text-xs font-medium tracking-[0.02em] ${TONE_CLASSES[this.tone()]}`,
  );
}
