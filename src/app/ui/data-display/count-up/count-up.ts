import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';

/** A number that counts up from zero the first time it scrolls into view. Prerendered HTML and
 * visitors who prefer reduced motion get the final value straight away. */
@Component({
  selector: 'app-count-up',
  template: `{{ text() }}`,
  host: { class: 'tabular-nums' },
})
export class CountUp {
  readonly value = input.required<number>();
  readonly decimals = input(0);
  /** Decimal mark to print, so "3,2" stays "3,2". */
  readonly separator = input('.');
  readonly duration = input(1600);

  /** Share of the value currently shown, from 0 to 1. */
  private readonly progress = signal(1);
  readonly text = computed(() =>
    (this.value() * this.progress()).toFixed(this.decimals()).replace('.', this.separator()),
  );

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      if (
        !('IntersectionObserver' in window) ||
        matchMedia('(prefers-reduced-motion: reduce)').matches
      )
        return;
      this.progress.set(0);
      let frame = 0;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          observer.disconnect();
          const start = performance.now();
          const tick = (now: number) => {
            const elapsed = Math.min((now - start) / this.duration(), 1);
            // Ease-out: fast at first, settling on the final figure.
            this.progress.set(1 - Math.pow(1 - elapsed, 3));
            if (elapsed < 1) frame = requestAnimationFrame(tick);
          };
          frame = requestAnimationFrame(tick);
        },
        { threshold: 0.6 },
      );
      observer.observe(host);
      destroyRef.onDestroy(() => {
        observer.disconnect();
        cancelAnimationFrame(frame);
      });
    });
  }
}
