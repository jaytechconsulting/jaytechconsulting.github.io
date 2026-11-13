import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { CmsContentService } from '../../../core/cms/cms-content.service';
import { Reveal } from '../../../ui/behaviors/reveal';
import { CountUp } from '../../../ui/data-display/count-up/count-up';

interface Review {
  quote: string;
  name: string;
  role: string;
  company: string;
  initials: string;
  photo: string;
  rating: number;
  color: string;
}

const STARS = [1, 2, 3, 4, 5];

/** Reviews screen of the home, on a dark band after the light companies block. One review is on
 * stage at a time, as a large quote; the people below work as tabs. It advances by itself: the
 * fill of the active tab is the clock, so pausing that animation (pointer over the block, keyboard
 * focus, off screen) pauses the rotation. Hidden while there are no published reviews. */
@Component({
  selector: 'app-reviews-section',
  imports: [Reveal, CountUp],
  templateUrl: './reviews-section.html',
  styles: `
    .review-quote {
      animation: review-in 0.55s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .review-author {
      animation: review-in 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.12s backwards;
    }
    .review-star {
      animation: review-star 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
    }
    @keyframes review-in {
      from {
        opacity: 0;
        transform: translate3d(0, 18px, 0);
      }
    }
    @keyframes review-star {
      from {
        opacity: 0;
        transform: scale(0.3) rotate(-30deg);
      }
    }
    .review-clock {
      transform-origin: left;
      animation: review-clock 7s linear forwards;
    }
    @keyframes review-clock {
      from {
        transform: scaleX(0);
      }
    }
    /* Without the animation there is no clock: reviews change only by hand. */
    @media (prefers-reduced-motion: reduce) {
      .review-quote,
      .review-author,
      .review-star,
      .review-clock {
        animation: none;
      }
    }
  `,
})
export class ReviewsSection {
  private readonly cms = inject(CmsContentService);
  private readonly stage = viewChild<ElementRef<HTMLElement>>('stage');

  readonly reviews = computed<Review[]>(() =>
    this.cms.reviews().map((item) => ({
      quote: item.quote,
      name: item.name,
      role: item.role,
      company: item.company,
      initials: initials(item.name),
      photo: item.photo,
      rating: Number(item.rating) || 5,
      color: item.color || '#22D3EE',
    })),
  );
  readonly stars = STARS;

  private readonly stored = this.cms.section('reviews');
  /** The CMS section can be empty; the block still needs a heading. */
  readonly content = computed(() => {
    const stored = this.stored();
    return {
      ...stored,
      eyebrow: stored.eyebrow || 'Reseñas',
      title: stored.title || 'Lo que dicen',
      highlight: stored.title ? stored.highlight : 'nuestros clientes',
    };
  });
  readonly summary = computed(() => {
    const [score, caption] = this.stored()
      .items.split('|')
      .map((part) => part.trim());
    const value = Number((score || '4.9').replace(',', '.'));
    return {
      score: Number.isFinite(value) ? value : 4.9,
      caption: caption || 'valoración promedio de nuestros clientes',
    };
  });

  private readonly index = signal(0);
  /** Clamped, so removing a review in the CMS never leaves the stage empty. */
  readonly active = computed(() => Math.min(this.index(), Math.max(this.reviews().length - 1, 0)));
  readonly activeReview = computed(() => this.reviews()[this.active()]);

  readonly hovered = signal(false);
  readonly focused = signal(false);
  private readonly inView = signal(false);
  readonly playing = computed(() => this.inView() && !this.hovered() && !this.focused());

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const stage = this.stage()?.nativeElement;
      if (!stage) return;
      const observer = new IntersectionObserver(
        ([entry]) => this.inView.set(entry.isIntersecting),
        { threshold: 0.4 },
      );
      observer.observe(stage);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  byline(review: Review): string {
    return [review.role, review.company].filter(Boolean).join(' · ');
  }

  select(index: number): void {
    this.index.set(index);
  }

  next(): void {
    this.index.set((this.active() + 1) % this.reviews().length);
  }

  /** Arrow keys move between people, as the tabs pattern expects. */
  onTabKeydown(event: KeyboardEvent): void {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const count = this.reviews().length;
    const target = (this.active() + step + count) % count;
    this.select(target);
    const tabs = (event.currentTarget as HTMLElement).parentElement?.children;
    (tabs?.[target] as HTMLElement | undefined)?.focus();
  }
}

function initials(name: string): string {
  return (
    name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?'
  );
}
