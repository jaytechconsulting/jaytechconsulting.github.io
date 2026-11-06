import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Button } from '../../ui/actions/button/button';
import { Header } from '../../ui/navigation/header/header';
import { Footer } from '../../ui/navigation/footer/footer';
import { WhatsAppFab } from '../../ui/marketing/whatsapp-fab/whatsapp-fab';
import { FeatureCard } from '../../ui/marketing/feature-card/feature-card';
import { DetailModal } from '../../ui/feedback/detail-modal/detail-modal';
import { CmsContentService } from '../../core/cms-content.service';
import { COURSES, type Course } from './courses-data';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: '¿Cómo funciona una sesión de asesoría?',
    answer: 'Partimos de tu caso real: revisamos lo que tienes, identificamos el cuello de botella y salimos con un plan de acción concreto, no solo teoría.',
  },
  {
    question: '¿Necesito conocimientos técnicos previos?',
    answer: 'No es obligatorio. Adaptamos el nivel de la sesión según quién participe — desde fundadores no técnicos hasta equipos de desarrollo.',
  },
  {
    question: '¿Las asesorías son presenciales o remotas?',
    answer: 'Son remotas por videollamada, lo que nos permite agendar rápido y grabar la sesión para que la revises cuando quieras.',
  },
  {
    question: '¿Puedo combinar la asesoría con un proyecto que ya tengo en desarrollo?',
    answer: 'Sí, de hecho es uno de los casos más comunes: revisamos arquitectura, decisiones técnicas o procesos de un proyecto ya iniciado.',
  },
  {
    question: '¿Qué pasa si necesito más de una sesión?',
    answer: 'Podemos armar un programa de acompañamiento con varias sesiones espaciadas en el tiempo, según el alcance que definamos juntos.',
  },
];

/** Standalone service page (no primary nav, matches Proyectos/Login/Propuesta pattern): banner,
 * course cards and an FAQ accordion. Reached from the header's "Servicios" hover dropdown. */
@Component({
  selector: 'app-asesorias',
  imports: [Button, Header, Footer, WhatsAppFab, FeatureCard, DetailModal],
  templateUrl: './asesorias.html',
})
export class Asesorias {
  private readonly router = inject(Router);
  private readonly cms = inject(CmsContentService);

  readonly header = this.cms.header;
  readonly courses = COURSES;
  readonly faqs = FAQS;
  readonly openFaq = signal<number | null>(0);
  readonly selectedCourse = signal<Course | null>(null);

  readonly pageDesign = computed(() => this.cms.pages().asesorias);
  readonly headerStyle = computed(() => {
    const d = this.pageDesign();
    if (d.backgroundImage) {
      return { 'background-image': `linear-gradient(rgba(11,15,26,0.72), rgba(11,15,26,0.72)), url(${d.backgroundImage})`, 'background-size': 'cover', 'background-position': 'center' };
    }
    if (d.backgroundColor) return { background: d.backgroundColor };
    return {};
  });

  toggleFaq(index: number): void {
    this.openFaq.update((current) => (current === index ? null : index));
  }

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
