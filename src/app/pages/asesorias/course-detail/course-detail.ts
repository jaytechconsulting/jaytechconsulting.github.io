import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Header } from '../../../ui/navigation/header/header';
import { Footer } from '../../../ui/navigation/footer/footer';
import { Button } from '../../../ui/actions/button/button';
import { Badge } from '../../../ui/data-display/badge/badge';
import { Breadcrumb } from '../../../ui/navigation/breadcrumb/breadcrumb';
import { WhatsAppFab } from '../../../ui/marketing/whatsapp-fab/whatsapp-fab';
import { CmsContentService } from '../../../core/cms-content.service';
import { SeoService } from '../../../core/services/seo.service';
import { COURSES, type Course } from '../courses-data';

/** Full detail page for one course — reached by clicking an Asesorías card's image or
 * "ver más detalles" button. Same shared header/footer shell as the listing page. */
@Component({
  selector: 'app-course-detail',
  imports: [Header, Footer, Button, Badge, Breadcrumb, WhatsAppFab],
  templateUrl: './course-detail.html',
  styleUrl: './course-detail.css',
})
export class CourseDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cms = inject(CmsContentService);
  private readonly seo = inject(SeoService);

  readonly header = this.cms.header;
  readonly course = signal<Course | null>(null);
  readonly notFound = signal(false);
  readonly breadcrumb = computed(() => [
    { label: 'Inicio', href: '/' },
    { label: 'Cursos', href: '/asesorias' },
    { label: this.course()?.title ?? '' },
  ]);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug') ?? '';
      const course = COURSES.find((c) => c.slug === slug) ?? null;
      this.course.set(course);
      this.notFound.set(!course);
      if (course) {
        this.seo.update({ title: `${course.title} | Jaytech`, description: course.description, path: `/asesorias/${course.slug}` });
      } else {
        this.seo.update({ title: 'Curso no encontrado | Jaytech', description: 'El curso solicitado no está disponible.', path: this.router.url, index: false });
      }
    });
  }

  back(): void {
    this.router.navigate(['/asesorias']);
  }

  requestProposal(): void {
    this.router.navigate(['/solicitar-propuesta']);
  }
}
