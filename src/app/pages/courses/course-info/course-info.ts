import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';
import { ApiService } from '../../../core/api.service';
import { CmsContentService } from '../../../core/cms/cms-content.service';
import { CartService } from '../../../core/commerce/cart.service';
import { formatSoles } from '../../../core/formatting/money';
import type { ApiCourse } from '../../../core/models/api.models';
import { SITE_URL, SeoService } from '../../../core/services/seo.service';
import { Button } from '../../../ui/actions/button/button';
import { Reveal } from '../../../ui/behaviors/reveal';
import { WhatsAppFab } from '../../../ui/marketing/whatsapp-fab/whatsapp-fab';
import { Breadcrumb } from '../../../ui/navigation/breadcrumb/breadcrumb';
import { Footer } from '../../../ui/navigation/footer/footer';
import { Header } from '../../../ui/navigation/header/header';

const STARS = [1, 2, 3, 4, 5];
/** Related courses shown at the end of the page. */
const MAX_RELATED = 3;

/** Page of one course (/cursos/{slug}). After the hero it reads top to bottom as: description,
 * content, requirements, instructor and reviews, with the price card alongside; related courses
 * close the page. Every block comes from the CMS and is left out while it has no content. */
@Component({
  selector: 'app-course-info',
  imports: [Header, Footer, Button, Breadcrumb, WhatsAppFab, RouterLink, Reveal],
  templateUrl: './course-info.html',
  styles: `
    :host {
      display: block;
    }
    .course-in {
      animation: course-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) backwards;
    }
    @keyframes course-in {
      from {
        opacity: 0;
        transform: translate3d(0, 18px, 0);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .course-in {
        animation: none;
      }
    }
  `,
})
export class CourseInfo implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cms = inject(CmsContentService);
  private readonly seo = inject(SeoService);
  private readonly api = inject(ApiService);
  readonly cart = inject(CartService);

  readonly header = this.cms.header;
  readonly course = signal<ApiCourse | null>(null);
  readonly notFound = signal(false);
  private readonly catalog = toSignal(this.api.courses().pipe(catchError(() => of([]))), {
    initialValue: [],
  });

  readonly stars = STARS;
  readonly formatPrice = formatSoles;
  /** Module open in the content accordion. */
  readonly openModule = signal<number | null>(0);

  readonly color = computed(() => this.course()?.accentColor || 'var(--brand-orange)');
  readonly overview = computed(() => paragraphs(this.course()?.overview || ''));
  readonly outcomes = computed(() => this.course()?.outcomes ?? []);
  readonly requirements = computed(() => this.course()?.requirements ?? []);
  readonly instructor = computed(() => {
    const course = this.course();
    if (!course?.instructorName) return null;
    return {
      name: course.instructorName,
      role: course.instructorRole ?? '',
      bio: paragraphs(course.instructorBio ?? ''),
      photo: course.instructorPhotoUrl ?? '',
      achievements: course.instructorAchievements ?? [],
      initials: initials(course.instructorName),
    };
  });

  readonly rating = computed(() => {
    const reviews = this.course()?.reviews ?? [];
    if (!reviews.length) return null;
    const average = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
    return {
      average: average.toFixed(1),
      full: Math.round(average),
      count: reviews.length,
      // Share of reviews per score, from 5 stars down to 1.
      bars: [5, 4, 3, 2, 1].map((score) => {
        const count = reviews.filter((review) => review.rating === score).length;
        return { score, count, percent: (count / reviews.length) * 100 };
      }),
    };
  });

  /** What the price includes, for the purchase card. */
  readonly includes = computed(() => {
    const course = this.course();
    if (!course) return [];
    const counts = course.materialCounts;
    return [
      plural(course.syllabus.length, 'módulo', 'módulos'),
      plural(counts.videos, 'video', 'videos'),
      plural(counts.pdfs, 'guía en PDF', 'guías en PDF'),
      plural(counts.files, 'archivo descargable', 'archivos descargables'),
      'Acceso desde tu panel de cliente',
    ].filter(Boolean);
  });

  /** Sections present on this course, in page order: they drive the in-page navigation. */
  readonly sections = computed(() => {
    const course = this.course();
    if (!course) return [];
    return [
      { id: 'descripcion', label: 'Descripción', show: true },
      { id: 'contenido', label: 'Contenido', show: course.syllabus.length > 0 },
      { id: 'requisitos', label: 'Requisitos', show: this.requirements().length > 0 },
      { id: 'docente', label: 'Docente', show: this.instructor() !== null },
      { id: 'resenas', label: 'Reseñas', show: course.reviews.length > 0 },
    ].filter((section) => section.show);
  });

  readonly related = computed(() => {
    const current = this.course();
    if (!current) return [];
    return this.catalog()
      .filter((item) => item.id !== current.id)
      .slice(0, MAX_RELATED);
  });

  readonly breadcrumb = computed(() => [
    { label: 'Inicio', href: '/' },
    { label: 'Cursos', href: '/capacitaciones#cursos-virtuales' },
    { label: this.course()?.title ?? '' },
  ]);

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          this.course.set(null);
          this.notFound.set(false);
          this.openModule.set(0);
          return this.api.course(params.get('id') ?? '').pipe(catchError(() => of(null)));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((course) => {
        this.course.set(course);
        this.notFound.set(!course);
        this.seo.update(
          course
            ? {
                title: `${course.title} | Jaytech`,
                description: course.description,
                path: `/cursos/${course.slug || course.id}`,
                structuredData: courseSchema(course),
              }
            : {
                title: 'Curso no encontrado | Jaytech',
                description: 'El curso solicitado no está disponible.',
                path: this.router.url,
                index: false,
              },
        );
      });
  }

  toggleModule(index: number): void {
    this.openModule.update((current) => (current === index ? null : index));
  }

  position(index: number): string {
    return String(index + 1).padStart(2, '0');
  }

  initialsOf(name: string): string {
    return initials(name);
  }

  facts(course: ApiCourse): string[] {
    return [plural(course.syllabus.length, 'módulo', 'módulos')].filter(Boolean);
  }

  /** In-page links: a plain "#id" href would resolve against the site root, not this page. */
  goTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ block: 'start' });
  }

  requestProposal(): void {
    this.router.navigate(['/solicitar-propuesta']);
  }

  back(): void {
    this.router.navigate(['/capacitaciones'], { fragment: 'cursos-virtuales' });
  }

  addToCart(course: ApiCourse): void {
    this.cart.add(course);
    this.router.navigate(['/cursos']);
  }
}

function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function initials(name: string): string {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?'
  );
}

function plural(count: number, one: string, many: string): string {
  return count > 0 ? `${count} ${count === 1 ? one : many}` : '';
}

/** schema.org Course node, so search engines can show price and rating. */
function courseSchema(course: ApiCourse): Record<string, unknown> {
  const reviews = course.reviews;
  return {
    '@type': 'Course',
    name: course.title,
    description: course.description,
    url: `${SITE_URL}/cursos/${course.slug || course.id}`,
    provider: { '@id': `${SITE_URL}/#organization` },
    offers: { '@type': 'Offer', price: course.price, priceCurrency: 'PEN', category: 'Paid' },
    ...(reviews.length
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1),
            reviewCount: reviews.length,
          },
        }
      : {}),
  };
}
