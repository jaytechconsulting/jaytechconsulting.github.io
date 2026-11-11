import { Directive, ElementRef, OnDestroy, OnInit, inject, input } from '@angular/core';
import { isBrowser } from '../../core/platform';

/**
 * Scroll-reveal: fades/slides an element in the first time it enters the viewport.
 * CSS lives in styles.css under `[appreveal]` — this directive only toggles `.is-revealed`.
 * `appRevealDelay` (ms) staggers siblings in a grid without needing separate classes per index.
 */
@Directive({ selector: '[appReveal]' })
export class Reveal implements OnInit, OnDestroy {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private observer?: IntersectionObserver;

  readonly appRevealDelay = input(0);

  ngOnInit(): void {
    // Prerendered HTML stays fully visible; the animation is armed in the browser.
    if (!isBrowser) return;
    const element = this.el.nativeElement;
    const delay = Number.isFinite(this.appRevealDelay())
      ? Math.min(240, Math.max(0, this.appRevealDelay()))
      : 0;
    element.style.setProperty('--reveal-delay', `${delay}ms`);

    if (
      !('IntersectionObserver' in window) ||
      matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      element.classList.add('is-revealed');
      return;
    }

    element.classList.add('reveal-pending');
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          element.classList.remove('reveal-pending');
          element.classList.add('is-revealed');
          this.observer?.unobserve(element);
        }
      },
      { threshold: 0, rootMargin: '0px 0px -24px 0px' },
    );
    this.observer.observe(element);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
