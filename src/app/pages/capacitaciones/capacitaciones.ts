import { createLatestRequest } from '../../core/http/latest-request';
import { formatSoles } from '../../core/formatting/money';
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
import { Input } from '../../ui/forms/input/input';
import { Select } from '../../ui/forms/select/select';
import { CmsContentService } from '../../core/cms/cms-content.service';
import { PAGE_FAQS } from '../../core/cms/page-faqs';
import { Reveal } from '../../ui/behaviors/reveal';
import { ApiService } from '../../core/api.service';
import { CartService } from '../../core/commerce/cart.service';
import type { ApiCourse, ApiTrainingProgram, ApiPagedResult } from '../../core/models/api.models';

const MODALITY_OPTIONS = ['Todas', 'In-company', 'Remoto'];
const SORT_OPTIONS = ['Orden sugerido', 'Título (A-Z)', 'Título (Z-A)', 'Duración'];
const PAGE_SIZE = 6;

/** Same page shell as the rest of the site (shared topbar): banner, training programs as
 * server-side filtered/sorted/paginated cards, and an FAQ accordion — same pattern as Asesorías. */
@Component({
  selector: 'app-capacitaciones',
  imports: [
    Button,
    Header,
    Footer,
    WhatsAppFab,
    Input,
    Select,
    FeatureCard,
    DetailModal,
    FaqAccordion,
    Reveal,
  ],
  templateUrl: './capacitaciones.html',
})
export class Capacitaciones {
  private readonly router = inject(Router);
  private readonly cms = inject(CmsContentService);
  private readonly api = inject(ApiService);
  private readonly cart = inject(CartService);

  readonly header = this.cms.header;
  private readonly coursesRequest = createLatestRequest<ApiCourse[]>([]);
  readonly virtualCourses = this.coursesRequest.value;
  /** Edited in the CMS (Páginas); the built-in list shows until it is saved there. */
  readonly faqs = computed(() => this.cms.pages().capacitaciones.faqs ?? PAGE_FAQS.capacitaciones);
  readonly selectedProgram = signal<ApiTrainingProgram | null>(null);

  readonly modalityOptions = MODALITY_OPTIONS;
  readonly sortOptions = SORT_OPTIONS;

  readonly search = signal('');
  readonly modality = signal('Todas');
  readonly sort = signal('Orden sugerido');
  readonly page = signal(1);

  private readonly programsRequest = createLatestRequest<ApiPagedResult<ApiTrainingProgram>>({
    items: [],
    total: 0,
    page: 1,
    pageSize: PAGE_SIZE,
  });
  readonly programs = computed(() => this.programsRequest.value().items);
  readonly total = computed(() => this.programsRequest.value().total);
  readonly loading = this.programsRequest.loading;
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / PAGE_SIZE)));

  readonly pageDesign = computed(() => this.cms.pages().capacitaciones);
  readonly headerStyle = computed(() => backgroundStyle(this.pageDesign()));

  constructor() {
    this.fetchPrograms();
    this.coursesRequest.load(this.api.courses());
  }

  readonly formatPrice = formatSoles;

  readonly selectedCourse = signal<ApiCourse | null>(null);

  openCourseDetails(course: ApiCourse): void {
    this.selectedCourse.set(course);
  }

  openCoursePage(course: ApiCourse): void {
    this.router.navigate(['/cursos', course.slug || course.id]);
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
    this.programsRequest.load(
      this.api.trainingPrograms({
        search: this.search().trim() || undefined,
        modality: this.modality() === 'Todas' ? undefined : this.modality(),
        sortBy,
        sortDir,
        page: this.page(),
        pageSize: PAGE_SIZE,
      }),
    );
  }

  private sortParams(): [string, string] {
    switch (this.sort()) {
      case 'Título (A-Z)':
        return ['title', 'asc'];
      case 'Título (Z-A)':
        return ['title', 'desc'];
      case 'Duración':
        return ['duration', 'asc'];
      default:
        return ['display', 'asc'];
    }
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
