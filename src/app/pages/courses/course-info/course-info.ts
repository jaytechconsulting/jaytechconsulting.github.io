import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Header } from '../../../ui/navigation/header/header';
import { Footer } from '../../../ui/navigation/footer/footer';
import { Button } from '../../../ui/actions/button/button';
import { Icon } from '../../../ui/data-display/icon/icon';
import { Breadcrumb } from '../../../ui/navigation/breadcrumb/breadcrumb';
import { WhatsAppFab } from '../../../ui/marketing/whatsapp-fab/whatsapp-fab';
import { Reveal } from '../../../core/directives/reveal';
import { CmsContentService } from '../../../core/cms-content.service';
import { SeoService } from '../../../core/services/seo.service';
import { ApiService } from '../../../core/api.service';
import { CartService } from '../../../core/cart.service';
import type { ApiCourse } from '../../../core/models/api.models';

@Component({
  selector: 'app-course-info',
  imports: [Header, Footer, Button, Icon, Breadcrumb, WhatsAppFab, Reveal],
  templateUrl: './course-info.html',
})
export class CourseInfo implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cms = inject(CmsContentService);
  private readonly seo = inject(SeoService);
  private readonly api = inject(ApiService);
  readonly cart = inject(CartService);

  readonly header = this.cms.header;
  readonly course = signal<ApiCourse | null>(null);
  readonly notFound = signal(false);
  readonly stars = [1, 2, 3, 4, 5];

  readonly averageRating = computed(() => {
    const reviews = this.course()?.reviews ?? [];
    if (reviews.length === 0) return 0;
    return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  });

  readonly breadcrumb = computed(() => [
    { label: 'Inicio', href: '/' },
    { label: 'Capacitaciones', href: '/capacitaciones#cursos-virtuales' },
    { label: this.course()?.title ?? '' },
  ]);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id') ?? '';
      this.api.course(id).subscribe({
        next: (course) => {
          this.course.set(course);
          this.seo.update({ title: `${course.title} | Jaytech`, description: course.description, path: `/cursos/${course.id}` });
        },
        error: () => {
          this.notFound.set(true);
          this.seo.update({ title: 'Curso no encontrado | Jaytech', description: 'El curso solicitado no está disponible.', path: this.router.url, index: false });
        },
      });
    });
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

  formatPrice(price: number): string {
    return `S/ ${price.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }
}
