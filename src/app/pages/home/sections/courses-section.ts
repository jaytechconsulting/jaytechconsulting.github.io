import { CmsContentService } from '../../../core/cms/cms-content.service';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/api.service';
import { CartService } from '../../../core/commerce/cart.service';
import { formatSoles } from '../../../core/formatting/money';
import { createLatestRequest } from '../../../core/http/latest-request';
import type { ApiCourse } from '../../../core/models/api.models';
import { Button } from '../../../ui/actions/button/button';
import { Reveal } from '../../../ui/behaviors/reveal';

/** Two rows of four: more best sellers than that stay in the catalogue. */
const MAX_COURSES = 8;

/** Third screen of the home: the courses marked "Más vendido" in the admin, as cards on a dark
 * band so it reads as a different block from the light services screen above. Four per row and at
 * most two rows on wide screens; a swipeable row on phones. Hidden while no course is marked. */
@Component({
  selector: 'app-courses-section',
  imports: [Button, Reveal, RouterLink],
  templateUrl: './courses-section.html',
  styles: `
    .courses-track {
      --per-row: 1;
      --gap: 16px;
      gap: var(--gap);
    }
    .courses-slide {
      flex: 0 0 calc((100% - (var(--per-row) - 1) * var(--gap)) / var(--per-row));
    }
    /* From here the row wraps instead of scrolling, and a short last row stays centred. */
    @media (min-width: 680px) {
      .courses-track {
        --per-row: 2;
        --gap: 20px;
        flex-wrap: wrap;
        justify-content: center;
        overflow: visible;
      }
    }
    @media (min-width: 1100px) {
      .courses-track {
        --per-row: 4;
      }
    }
  `,
})
export class CoursesSection {
  readonly content = inject(CmsContentService).section('courses');
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly cart = inject(CartService);

  private readonly request = createLatestRequest<ApiCourse[]>([]);
  readonly courses = computed(() =>
    this.request
      .value()
      .filter((course) => course.isBestSeller)
      .slice(0, MAX_COURSES),
  );

  /** Card nearest to the left edge of the swipeable row (phones). */
  readonly active = signal(0);
  readonly formatPrice = formatSoles;

  constructor() {
    this.request.load(this.api.courses());
  }

  rank(index: number): string {
    return String(index + 1).padStart(2, '0');
  }

  rating(course: ApiCourse): { average: string; count: number } | null {
    if (!course.reviews.length) return null;
    const average =
      course.reviews.reduce((sum, review) => sum + review.rating, 0) / course.reviews.length;
    return { average: average.toFixed(1), count: course.reviews.length };
  }

  /** Short facts under the description: modules and downloadable material. */
  facts(course: ApiCourse): string[] {
    const counts = course.materialCounts;
    return [
      plural(course.syllabus.length, 'módulo', 'módulos'),
      plural(counts.videos, 'video', 'videos'),
      plural(counts.pdfs + counts.files, 'recurso', 'recursos'),
    ].filter(Boolean);
  }

  inCart(course: ApiCourse): boolean {
    return this.cart.has(course.id);
  }

  onScroll(track: HTMLElement): void {
    const card = track.firstElementChild as HTMLElement | null;
    if (!card) return;
    const stride = card.offsetWidth + (parseFloat(getComputedStyle(track).columnGap) || 0);
    this.active.set(Math.round(track.scrollLeft / stride));
  }

  goTo(track: HTMLElement, index: number): void {
    const card = track.children[index] as HTMLElement | undefined;
    const first = track.firstElementChild as HTMLElement | null;
    if (card && first) track.scrollTo({ left: card.offsetLeft - first.offsetLeft });
  }

  buy(course: ApiCourse): void {
    this.cart.add(course);
    this.router.navigate(['/cursos']);
  }

  seeAll(): void {
    this.router.navigate(['/capacitaciones'], { fragment: 'cursos-virtuales' });
  }
}

function plural(count: number, one: string, many: string): string {
  return count > 0 ? `${count} ${count === 1 ? one : many}` : '';
}
