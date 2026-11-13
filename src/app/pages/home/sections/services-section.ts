import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  afterRenderEffect,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { Button } from '../../../ui/actions/button/button';
import { DetailModal } from '../../../ui/feedback/detail-modal/detail-modal';
import { CmsContentService } from '../../../core/cms/cms-content.service';
import type { CmsServiceItem } from '../../../core/cms/cms.models';
import { Reveal } from '../../../ui/behaviors/reveal';

/** Second screen of the home: the services as cards in a scroll-snap carousel that shows whole
 * cards only and advances by itself. The track scrolls natively (touch, trackpad, keyboard); the
 * arrows and dots mirror its position, and the active dot's fill animation is the autoplay clock,
 * so pausing the animation pauses the carousel. */
@Component({
  selector: 'app-services-section',
  imports: [Button, DetailModal, Reveal],
  templateUrl: './services-section.html',
  styles: `
    .services-track {
      --per-view: 1;
      --gap: 20px;
      gap: var(--gap);
    }
    .services-slide {
      flex-basis: calc((100% - (var(--per-view) - 1) * var(--gap)) / var(--per-view));
    }
    @media (min-width: 680px) {
      .services-track {
        --per-view: 2;
        --gap: 24px;
      }
    }
    @media (min-width: 1040px) {
      .services-track {
        --per-view: 3;
      }
    }
    .services-dot-fill {
      transform-origin: left;
      animation: services-dot-fill 4.5s linear forwards;
    }
    @keyframes services-dot-fill {
      from {
        transform: scaleX(0);
      }
      to {
        transform: scaleX(1);
      }
    }
    /* Without the animation there is no clock: the carousel stays manual. */
    @media (prefers-reduced-motion: reduce) {
      .services-dot-fill {
        animation: none;
      }
    }
  `,
})
export class ServicesSection {
  private readonly cms = inject(CmsContentService);
  private readonly router = inject(Router);
  private readonly track = viewChild<ElementRef<HTMLElement>>('track');

  readonly services = this.cms.services;
  readonly content = this.cms.section('services');
  readonly selected = signal<CmsServiceItem | null>(null);

  /** Scroll stops of the carousel: one per card that can sit at the left edge. */
  readonly positions = signal<number[]>([0]);
  readonly active = signal(0);

  readonly hovered = signal(false);
  readonly focused = signal(false);
  private readonly inView = signal(false);
  readonly playing = computed(
    () => this.inView() && !this.hovered() && !this.focused() && !this.selected(),
  );

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const track = this.track()?.nativeElement;
      if (!track) return;
      const resize = new ResizeObserver(() => this.sync());
      resize.observe(track);
      const visibility = new IntersectionObserver(
        ([entry]) => this.inView.set(entry.isIntersecting),
        { threshold: 0.5 },
      );
      visibility.observe(track);
      destroyRef.onDestroy(() => {
        resize.disconnect();
        visibility.disconnect();
      });
    });
    // A different number of cards changes the scrollable width without resizing the track.
    afterRenderEffect(() => {
      this.services();
      this.sync();
    });
  }

  position(index: number): string {
    return String(index + 1).padStart(2, '0');
  }

  sync(): void {
    const track = this.track()?.nativeElement;
    const stride = this.stride();
    if (!track || !stride) return;
    const max = Math.max(track.scrollWidth - track.clientWidth, 0);
    const count = Math.round(max / stride) + 1;
    if (count !== this.positions().length)
      this.positions.set(Array.from({ length: count }, (_, index) => index));
    this.active.set(Math.min(Math.round(track.scrollLeft / stride), count - 1));
  }

  /** Moves one card; past either end it wraps around, which is what keeps autoplay looping. */
  step(direction: 1 | -1): void {
    const count = this.positions().length;
    this.goTo((this.active() + direction + count) % count);
  }

  goTo(index: number): void {
    this.track()?.nativeElement.scrollTo({ left: index * this.stride() });
  }

  goToProposal(): void {
    this.router.navigateByUrl('/solicitar-propuesta');
  }

  goToProjects(): void {
    this.router.navigateByUrl('/proyectos');
  }

  /** Distance between the left edges of two neighbouring cards. */
  private stride(): number {
    const track = this.track()?.nativeElement;
    const card = track?.firstElementChild as HTMLElement | null;
    if (!track || !card) return 0;
    return card.offsetWidth + (parseFloat(getComputedStyle(track).columnGap) || 0);
  }
}
