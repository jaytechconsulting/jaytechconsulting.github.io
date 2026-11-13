import { backgroundStyle } from '../../ui/styles/background-style';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Button } from '../../ui/actions/button/button';
import { Header } from '../../ui/navigation/header/header';
import { Footer } from '../../ui/navigation/footer/footer';
import { WhatsAppFab } from '../../ui/marketing/whatsapp-fab/whatsapp-fab';
import { FeatureCard } from '../../ui/marketing/feature-card/feature-card';
import { FaqAccordion } from '../../ui/marketing/faq-accordion/faq-accordion';
import { DetailModal } from '../../ui/feedback/detail-modal/detail-modal';
import { CmsContentService } from '../../core/cms/cms-content.service';
import { PAGE_FAQS } from '../../core/cms/page-faqs';
import { Reveal } from '../../ui/behaviors/reveal';
import { COURSES, type Course } from './courses-data';

/** Standalone service page (no primary nav, matches Proyectos/Login/Propuesta pattern): banner,
 * course cards and an FAQ accordion. Reached from the header's "Servicios" hover dropdown. */
@Component({
  selector: 'app-asesorias',
  imports: [Button, Header, Footer, WhatsAppFab, FeatureCard, DetailModal, FaqAccordion, Reveal],
  templateUrl: './asesorias.html',
})
export class Asesorias {
  private readonly router = inject(Router);
  private readonly cms = inject(CmsContentService);

  readonly header = this.cms.header;
  readonly courses = COURSES;
  /** Edited in the CMS (Páginas); the built-in list shows until it is saved there. */
  readonly faqs = computed(() => this.cms.pages().asesorias.faqs ?? PAGE_FAQS.asesorias);
  readonly selectedCourse = signal<Course | null>(null);

  readonly pageDesign = computed(() => this.cms.pages().asesorias);
  readonly headerStyle = computed(() => backgroundStyle(this.pageDesign()));

  openCourseDetails(course: Course): void {
    this.selectedCourse.set(course);
  }

  openCoursePage(course: Course): void {
    this.router.navigate(['/asesorias', course.slug]);
  }

  requestProposal(): void {
    this.router.navigate(['/solicitar-propuesta']);
  }
}
