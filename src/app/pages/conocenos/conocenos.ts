import { backgroundStyle } from '../../ui/styles/background-style';
import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Button } from '../../ui/actions/button/button';
import { Header } from '../../ui/navigation/header/header';
import { Footer } from '../../ui/navigation/footer/footer';
import { WhatsAppFab } from '../../ui/marketing/whatsapp-fab/whatsapp-fab';
import { FaqAccordion } from '../../ui/marketing/faq-accordion/faq-accordion';
import { CmsContentService } from '../../core/cms/cms-content.service';
import { PAGE_FAQS } from '../../core/cms/page-faqs';
import { Reveal } from '../../ui/behaviors/reveal';

interface FeatureSection {
  number: string;
  label: string;
  glyph: string;
  color: string;
  title: string;
  description: string;
  bullets: string[];
}

const FEATURES: FeatureSection[] = [
  {
    number: '01',
    label: 'Ingeniería senior',
    glyph: '◆',
    color: '#FF6B35',
    title: 'Cada proyecto pasa por manos con experiencia real',
    description:
      'No improvisamos sobre la marcha: la arquitectura se piensa antes de escribir la primera línea de código.',
    bullets: [
      'Revisión de arquitectura y alcance antes de empezar a construir.',
      'Código mantenible pensado para crecer, no soluciones desechables.',
      'Decisiones técnicas explicadas en términos simples, sin tecnicismos.',
    ],
  },
  {
    number: '02',
    label: 'Tecnología actual',
    glyph: '⬡',
    color: '#22D3EE',
    title: 'Herramientas modernas, no la pila de hace diez años',
    description: 'Elegimos cada tecnología según el problema que resuelve, no porque esté de moda.',
    bullets: [
      'Stack moderno (Angular, .NET, PostgreSQL) mantenido y documentado.',
      'Integraciones probadas: pagos, CRMs, ERPs y APIs de terceros.',
      'Automatizaciones que eliminan trabajo manual real, no solo demos.',
    ],
  },
  {
    number: '03',
    label: 'Comunicación directa',
    glyph: '▲',
    color: '#F7C948',
    title: 'Hablas con quien construye, no con un intermediario',
    description: 'Sin capas de gestión entre tú y el equipo que escribe el código de tu proyecto.',
    bullets: [
      'Avances visibles durante todo el proyecto, no solo al final.',
      'Presupuestos claros desde el primer día, sin letra pequeña.',
      'Dudas resueltas en horas, no en días de ida y vuelta.',
    ],
  },
  {
    number: '04',
    label: 'Compromiso post-entrega',
    glyph: '⬢',
    color: '#7C6FF0',
    title: 'El trabajo no termina cuando el proyecto sale a producción',
    description: 'Seguimos cerca después de la entrega: soporte, mejoras y acompañamiento real.',
    bullets: [
      'Soporte directo después del lanzamiento, no un ticket perdido.',
      'Mejoras continuas basadas en el uso real de tu equipo.',
      'Acompañamiento a largo plazo, no solo hasta que termina el contrato.',
    ],
  },
];

interface StatItem {
  value: string;
  label: string;
}

const STATS: StatItem[] = [
  { value: '+40', label: 'proyectos entregados' },
  { value: '5', label: 'años de experiencia' },
  { value: '99.9%', label: 'uptime promedio' },
  { value: '24h', label: 'primera respuesta' },
];

/** "Conócenos" — company/about page. Reuses the same shared header/footer shell and dark
 * gradient-ink intro banner as Asesorías/Capacitaciones, plus a floating stats card, an
 * alternating feature-by-feature breakdown, a real CMS-backed team grid and an FAQ. */
@Component({
  selector: 'app-conocenos',
  imports: [Button, Header, Footer, WhatsAppFab, FaqAccordion, Reveal],
  templateUrl: './conocenos.html',
})
export class Conocenos {
  private readonly router = inject(Router);
  private readonly cms = inject(CmsContentService);

  readonly header = this.cms.header;
  readonly team = this.cms.teamMembers;
  readonly features = FEATURES;
  readonly stats = STATS;
  /** Edited in the CMS (Páginas); the built-in list shows until it is saved there. */
  readonly faqs = computed(() => this.cms.pages().conocenos.faqs ?? PAGE_FAQS.conocenos);

  readonly pageDesign = computed(() => this.cms.pages().conocenos);
  readonly headerStyle = computed(() => backgroundStyle(this.pageDesign()));

  requestProposal(): void {
    this.router.navigate(['/solicitar-propuesta']);
  }
}
