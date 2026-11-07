import { Directive, ElementRef, OnDestroy, OnInit, inject, input } from '@angular/core';

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
    const element = this.el.nativeElement;
    if (this.appRevealDelay()) element.style.transitionDelay = `${this.appRevealDelay()}ms`;

    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      element.classList.add('is-revealed');
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          element.classList.add('is-revealed');
          this.observer?.unobserve(element);
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );
    this.observer.observe(element);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
