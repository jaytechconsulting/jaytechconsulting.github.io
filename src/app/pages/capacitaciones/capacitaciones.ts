import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Button } from '../../ui/actions/button/button';
import { Header } from '../../ui/navigation/header/header';
import { Footer } from '../../ui/navigation/footer/footer';
import { WhatsAppFab } from '../../ui/marketing/whatsapp-fab/whatsapp-fab';
import { FeatureCard } from '../../ui/marketing/feature-card/feature-card';
import { DetailModal } from '../../ui/feedback/detail-modal/detail-modal';
import { Input } from '../../ui/forms/input/input';
import { Select } from '../../ui/forms/select/select';
import { CmsContentService } from '../../core/cms-content.service';
import { Reveal } from '../../core/directives/reveal';
import { ApiService } from '../../core/api.service';
import { CartService } from '../../core/cart.service';
import type { ApiCourse, ApiTrainingProgram } from '../../core/models/api.models';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: '¿Las capacitaciones son para todo mi equipo o solo para algunas personas?',
    answer: 'Se adaptan a lo que necesites: desde una sesión para un par de personas clave hasta un programa para toda el área.',
  },
  {
    question: '¿Puedo pedir un programa a medida para mi empresa?',
    answer: 'Sí, de hecho es lo más común. Partimos de tus procesos y herramientas reales, no de un temario genérico.',
  },
  {
    question: '¿Entregan algún material de referencia?',
    answer: 'Siempre dejamos una guía resumen y, cuando aplica, las plantillas o flujos que construimos durante la sesión.',
  },
  {
    question: '¿Cuántas personas pueden participar por sesión?',
    answer: 'Funciona bien con grupos de hasta 12 personas para mantener la sesión práctica. Si tu equipo es más grande, lo dividimos en cohortes.',
  },
  {
    question: '¿Las capacitaciones son remotas o presenciales?',
    answer: 'Ambas opciones existen según el programa — lo coordinamos contigo al momento de armar la propuesta.',
  },
];

const MODALITY_OPTIONS = ['Todas', 'In-company', 'Remoto'];
const SORT_OPTIONS = ['Orden sugerido', 'Título (A-Z)', 'Título (Z-A)', 'Duración'];
const PAGE_SIZE = 6;

/** Same page shell as the rest of the site (shared topbar): banner, training programs as
 * server-side filtered/sorted/paginated cards, and an FAQ accordion — same pattern as Asesorías. */
@Component({
  selector: 'app-capacitaciones',
  imports: [Button, Header, Footer, WhatsAppFab, Input, Select, FeatureCard, DetailModal, Reveal],
  templateUrl: './capacitaciones.html',
})
export class Capacitaciones {
  private readonly router = inject(Router);
  private readonly cms = inject(CmsContentService);
  private readonly api = inject(ApiService);
  private readonly cart = inject(CartService);

  readonly header = this.cms.header;
  readonly virtualCourses = signal<ApiCourse[]>([]);
  readonly faqs = FAQS;
  readonly openFaq = signal<number | null>(0);
  readonly selectedProgram = signal<ApiTrainingProgram | null>(null);

  readonly modalityOptions = MODALITY_OPTIONS;
  readonly sortOptions = SORT_OPTIONS;

  readonly search = signal('');
  readonly modality = signal('Todas');
  readonly sort = signal('Orden sugerido');
  readonly page = signal(1);

  readonly programs = signal<ApiTrainingProgram[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / PAGE_SIZE)));

  readonly pageDesign = computed(() => this.cms.pages().capacitaciones);
  readonly headerStyle = computed(() => {
    const d = this.pageDesign();
    if (d.backgroundImage) {
      return { 'background-image': `linear-gradient(rgba(11,15,26,0.72), rgba(11,15,26,0.72)), url(${d.backgroundImage})`, 'background-size': 'cover', 'background-position': 'center' };
    }
    if (d.backgroundColor) return { background: d.backgroundColor };
    return {};
  });

  constructor() {
    this.fetchPrograms();
    this.api.courses().subscribe((courses) => this.virtualCourses.set(courses));
  }

  formatPrice(price: number): string {
    return `S/ ${price.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }

  readonly selectedCourse = signal<ApiCourse | null>(null);

  openCourseDetails(course: ApiCourse): void {
    this.selectedCourse.set(course);
  }

  openCoursePage(course: ApiCourse): void {
    this.router.navigate(['/cursos', course.id]);
  }

  addCourseToCart(course: ApiCourse): void {
    this.cart.add(course);
    this.router.navigate(['/cursos']);
  }

  onSearch(value: string): void {
    this.search.set(value);
    this.page.set(1);
    this.fetchPrograms();
  }

  onModalityChange(value: string): void {
    this.modality.set(value);
    this.page.set(1);
    this.fetchPrograms();
  }

  onSortChange(value: string): void {
    this.sort.set(value);
    this.page.set(1);
    this.fetchPrograms();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.page()) return;
    this.page.set(page);
    this.fetchPrograms();
  }

  private fetchPrograms(): void {
    const [sortBy, sortDir] = this.sortParams();
    this.loading.set(true);
    this.api
      .trainingPrograms({
        search: this.search().trim() || undefined,
        modality: this.modality() === 'Todas' ? undefined : this.modality(),
        sortBy,
        sortDir,
        page: this.page(),
        pageSize: PAGE_SIZE,
      })
      .subscribe({
        next: (result) => {
          this.programs.set(result.items);
          this.total.set(result.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  private sortParams(): [string, string] {
    switch (this.sort()) {
      case 'Título (A-Z)': return ['title', 'asc'];
      case 'Título (Z-A)': return ['title', 'desc'];
      case 'Duración': return ['duration', 'asc'];
      default: return ['display', 'asc'];
    }
  }

  toggleFaq(index: number): void {
    this.openFaq.update((current) => (current === index ? null : index));
  }

  openProgramDetails(program: ApiTrainingProgram): void {
    this.selectedProgram.set(program);
  }

  openProgramPage(program: ApiTrainingProgram): void {
    this.router.navigate(['/capacitaciones', program.id]);
  }

  requestProposal(): void {
    this.router.navigate(['/solicitar-propuesta']);
  }
}
