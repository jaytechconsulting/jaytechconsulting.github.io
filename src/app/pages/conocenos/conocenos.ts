import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Button } from '../../ui/actions/button/button';
import { Header } from '../../ui/navigation/header/header';
import { Footer } from '../../ui/navigation/footer/footer';
import { WhatsAppFab } from '../../ui/marketing/whatsapp-fab/whatsapp-fab';
import { CmsContentService } from '../../core/cms-content.service';

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
    description: 'No improvisamos sobre la marcha: la arquitectura se piensa antes de escribir la primera línea de código.',
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

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: '¿Por qué elegir Jaytech en lugar de un freelancer o una agencia grande?',
    answer: 'Con un freelancer dependes de una sola persona; con una agencia grande hablas con gestores, no con quien programa. Con nosotros tienes la cercanía de un freelancer y la solidez de un equipo real.',
  },
  {
    question: '¿Cómo garantizan la calidad del código?',
    answer: 'Revisamos la arquitectura antes de construir, seguimos buenas prácticas del stack elegido y documentamos las decisiones clave, para que el proyecto sea mantenible por cualquier equipo, no solo por nosotros.',
  },
  {
    question: '¿Qué pasa si necesito cambios después de la entrega?',
    answer: 'Es parte del trabajo. Ofrecemos soporte y mejoras continuas después del lanzamiento — no desaparecemos cuando el proyecto sale a producción.',
  },
  {
    question: '¿Trabajan con empresas de cualquier tamaño?',
    answer: 'Sí. Hemos trabajado con negocios que recién digitalizan su operación y con empresas que ya tienen sistemas en producción y necesitan integrarlos o escalarlos.',
  },
  {
    question: '¿Cómo empiezo a trabajar con ustedes?',
    answer: 'Cuéntanos tu proyecto en el formulario de "Solicitar propuesta" — respondemos en menos de 24 horas con una primera idea de alcance y presupuesto.',
  },
];

/** "Conócenos" — company/about page. Reuses the same shared header/footer shell and dark
 * gradient-ink intro banner as Asesorías/Capacitaciones, plus a floating stats card, an
 * alternating feature-by-feature breakdown, a real CMS-backed team grid and an FAQ. */
@Component({
  selector: 'app-conocenos',
  imports: [Button, Header, Footer, WhatsAppFab],
  templateUrl: './conocenos.html',
})
export class Conocenos {
  private readonly router = inject(Router);
  private readonly cms = inject(CmsContentService);

  readonly header = this.cms.header;
  readonly team = this.cms.teamMembers;
  readonly features = FEATURES;
  readonly stats = STATS;
  readonly faqs = FAQS;
  readonly openFaq = signal<number | null>(0);

  readonly pageDesign = computed(() => this.cms.pages().conocenos);
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

  requestProposal(): void {
    this.router.navigate(['/solicitar-propuesta']);
  }
}
