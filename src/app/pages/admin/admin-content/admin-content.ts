import { readHomeFaqs, type HomeFaq } from '../../../core/cms/home-faqs';
import { PAGE_FAQS, isFaqPage } from '../../../core/cms/page-faqs';
import { HERO_TECHNOLOGIES, heroTechnologyLogo } from '../../../core/cms/hero-technologies';
import { OverlayScroll } from '../../../ui/behaviors/overlay-scroll';
import { ImageUpload } from '../../../ui/forms/image-upload/image-upload';
import { HOME_SECTIONS, type HomeSection } from '../../../core/cms/home-sections';
import { StickySidebarLayout } from '../../../ui/layout/sticky-sidebar-layout/sticky-sidebar-layout';
import { AccessService } from '../../../core/access/access.service';
import { Icon } from '../../../ui/data-display/icon/icon';
import { Wordmark } from '../../../ui/brand/wordmark/wordmark';
import { ThemeService } from '../../../core/services/theme.service';
import { Checkbox } from '../../../ui/forms/checkbox/checkbox';
import { SOCIAL_NETWORKS, socialUrlValid, type SocialLink } from '../../../core/cms/social-links';
import { ImageFile } from '../../../ui/behaviors/image-file';
import type { HeaderLink } from '../../../ui/navigation/header/header';
import { AnnouncementEditor } from './announcement-editor/announcement-editor';
import { AccessAction } from '../../../ui/behaviors/access-action';
import { CONTENT_MODULES, SITE_EDITOR_TABS } from './content-modules';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminShell } from '../admin-shell/admin-shell';
import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Card } from '../../../ui/data-display/card/card';
import { Badge } from '../../../ui/data-display/badge/badge';
import { Button } from '../../../ui/actions/button/button';
import { Input } from '../../../ui/forms/input/input';
import { Textarea } from '../../../ui/forms/textarea/textarea';
import { Select } from '../../../ui/forms/select/select';
import { ToastService } from '../../../core/services/toast.service';
import { DialogService } from '../../../core/services/dialog.service';
import {
  CmsContentService,
  type CmsAnnouncement,
  type CmsLoaderConfig,
  type CmsPageDesign,
  type CmsPageDesignId,
} from '../../../core/cms/cms-content.service';
import { ApiService } from '../../../core/api.service';
import type {
  ApiCourseAdmin,
  ApiInstructor,
  ApiTrainingProgram,
} from '../../../core/models/api.models';

import {
  PALETTE,
  GLYPHS,
  ENTITIES,
  INITIAL_HEADER_LINKS,
  INITIAL_HEADER_CTA,
  INITIAL_FOOTER_ABOUT,
  INITIAL_FOOTER_EMAIL,
  INITIAL_FOOTER_PHONE,
  INITIAL_FOOTER_COLUMNS,
  PAGE_LIST,
  type EntityItem,
  type EntityDef,
  type FieldDef,
} from './content-editor.config';
import type { CmsFooterColumn as FooterColumn } from '../../../core/cms/cms.models';

@Component({
  selector: 'app-admin-content',
  imports: [
    StickySidebarLayout,
    Checkbox,
    Icon,
    Wordmark,
    RouterLink,
    ImageFile,
    ImageUpload,
    OverlayScroll,
    AnnouncementEditor,
    AccessAction,
    AdminShell,
    Card,
    Badge,
    Button,
    Input,
    Textarea,
    Select,
  ],
  templateUrl: './admin-content.html',
  styleUrl: './admin-content.css',
})
export class AdminContent {
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(DialogService);
  private readonly cms = inject(CmsContentService);
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);
  readonly theme = inject(ThemeService).theme;

  readonly palette = PALETTE;
  readonly glyphs = GLYPHS;

  readonly tab = signal('empresas');
  private readonly access = inject(AccessService);
  readonly isSiteEditor = computed(() =>
    SITE_EDITOR_TABS.some((item) => item.section === this.tab()),
  );
  private readonly allowedSiteTabs = computed(() =>
    SITE_EDITOR_TABS.flatMap((tab) => {
      const menu = this.access.menuFor(tab.route);
      return menu ? [{ ...tab, href: this.access.link(menu) }] : [];
    }),
  );
  readonly homeTabs = computed(() =>
    this.allowedSiteTabs().filter(
      (item) => item.section === 'secciones' || item.section === 'animacion',
    ),
  );
  readonly orderDraft = signal<HomeSection['id'][]>([]);
  readonly homeSectionLabels = Object.fromEntries(
    HOME_SECTIONS.map(({ id, label }) => [id, label]),
  );
  moveHomeSection(index: number, step: number): void {
    const order = [...this.orderDraft()];
    const next = index + step;
    if (next < 0 || next >= order.length) return;
    [order[index], order[next]] = [order[next], order[index]];
    this.orderDraft.set(order);
  }
  saveHomeOrder(): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.cms.saveHomeSectionOrder(this.orderDraft()).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success('Orden de Inicio guardado');
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('No se pudo guardar el orden');
      },
    });
  }
  readonly isHomeEditor = computed(() => this.tab() === 'secciones' || this.tab() === 'animacion');
  readonly siteTabs = computed(() => {
    const home = this.homeTabs()[0];
    return this.allowedSiteTabs()
      .filter(
        (item) => (item.section !== 'secciones' && item.section !== 'animacion') || item === home,
      )
      .map((item) =>
        item === home
          ? { ...item, label: 'Inicio', hint: 'Portada, secciones y orden', active: this.isHomeEditor() }
          : { ...item, active: this.tab() === item.section },
      );
  });
  readonly currentEntity = computed(() => ENTITIES[this.isHomeEditor() ? 'secciones' : this.tab()]);
  readonly moduleTitle = computed(
    () => CONTENT_MODULES.find((module) => module.section === this.tab())?.label ?? 'Empresas',
  );

  readonly items = signal<EntityItem[]>([]);
  readonly sel = signal(0);
  readonly draft = signal<EntityItem>({});
  readonly isNew = computed(() => this.sel() === -1);
  readonly saving = signal(false);

  readonly headerLinks = signal<HeaderLink[]>([...INITIAL_HEADER_LINKS]);
  readonly headerCta = signal(INITIAL_HEADER_CTA);

  readonly socialNetworks = [...SOCIAL_NETWORKS];
  readonly socialLinks = signal<SocialLink[]>([]);
  setSocialLink(index: number, field: string, value: string | boolean): void {
    this.socialLinks.update((links) =>
      links.map((link, i) => (i === index ? { ...link, [field]: value } : link)),
    );
  }
  addSocialLink(): void {
    const network = SOCIAL_NETWORKS.find(
      (item) => !this.socialLinks().some((link) => link.network === item.value),
    );
    if (network)
      this.socialLinks.update((links) => [
        ...links,
        { network: network.value, url: '', enabled: true },
      ]);
  }
  removeSocialLink(index: number): void {
    this.socialLinks.update((links) => links.filter((_, i) => i !== index));
  }
  saveSocialLinks(): void {
    if (this.saving()) return;
    const links = this.socialLinks().map((link) => ({ ...link, url: link.url.trim() }));
    if (links.some((link) => !socialUrlValid(link.url))) {
      this.toast.error(
        'Revisa los enlaces',
        'Cada red debe tener una URL HTTPS válida, incluso si está oculta.',
      );
      return;
    }
    if (new Set(links.map((link) => link.network)).size !== links.length) {
      this.toast.error('Red repetida', 'Configura un solo enlace por red social.');
      return;
    }
    this.saving.set(true);
    this.cms.saveSocialLinks(links).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success('Redes sociales guardadas', 'Los enlaces se actualizaron en el footer.');
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('No pudimos guardar las redes', 'Inténtalo nuevamente.');
      },
    });
  }

  readonly footerAbout = signal(INITIAL_FOOTER_ABOUT);
  readonly footerEmail = signal(INITIAL_FOOTER_EMAIL);
  readonly footerPhone = signal(INITIAL_FOOTER_PHONE);
  readonly footerColumns = signal<FooterColumn[]>([...INITIAL_FOOTER_COLUMNS]);

  readonly announcementValue = this.cms.announcement;

  readonly headerLinkVariantOptions = ['Enlace del menú', 'Botón relleno', 'Botón contorno'];

  readonly pageList = PAGE_LIST;
  readonly fixedHeaderEntries = [
    { label: 'Inicio', destination: '/' },
    { label: 'Servicios', destination: 'Menú con Asesorías y Capacitaciones' },
    { label: 'Conócenos', destination: '/conocenos' },
  ];
  readonly linkedPages = computed(() => [
    { label: 'Inicio', route: '/admin/secciones', hint: 'Portada, secciones y orden' },
    { label: 'Cursos', route: '/admin/cursos', hint: 'Catálogo y fichas de cursos' },
    { label: 'Libro de Reclamaciones', route: '/admin/reclamaciones/configuracion', hint: 'Configuración del formulario público' },
  ].filter(page => this.canOpenEditor(page.route)));
  readonly sectionSources: Record<string, { label: string; route: string; hint: string }> = {
    services: { label: 'servicios', route: '/admin/servicios', hint: 'Edita aquí el encabezado. Las fichas vienen de la lista de Servicios.' },
    clients: { label: 'empresas', route: '/admin/empresas', hint: 'Edita aquí el encabezado. Los logos vienen de la lista de Empresas.' },
    reviews: { label: 'reseñas', route: '/admin/resenas', hint: 'Edita aquí el encabezado. Los testimonios vienen de la lista de Reseñas.' },
    courses: { label: 'cursos', route: '/admin/cursos', hint: 'Aquí se edita el encabezado. Las fichas vienen de los cursos marcados como Más vendido.' },
  };
  readonly faqEntries = computed(() => readHomeFaqs(this.draft()['items'] ?? ''));
  setFaq(index: number, field: keyof HomeFaq, value: string): void {
    this.setField('items', JSON.stringify(this.faqEntries().map((item, i) => i === index ? { ...item, [field]: value } : item)));
  }
  addFaq(): void {
    this.setField('items', JSON.stringify([...this.faqEntries(), { question: '', answer: '' }]));
  }
  removeFaq(index: number): void {
    this.setField('items', JSON.stringify(this.faqEntries().filter((_, i) => i !== index)));
  }
  readonly sectionSource = computed(() => this.isHomeEditor() ? this.sectionSources[this.draft()['id']] : undefined);
  canOpenEditor(route: string): boolean { return !!this.access.menuFor(route); }
  readonly technologyCatalog = HERO_TECHNOLOGIES;
  readonly technologyLogo = heroTechnologyLogo;
  addTechnology(name: string): void {
    const items = (this.draft()['items'] ?? '').split('\n').map((item) => item.trim()).filter(Boolean);
    if (!items.some((item) => item.toLowerCase() === name.toLowerCase())) {
      this.setField('items', [...items, name].join('\n'));
    }
  }
  readonly heroMediaOptions = [
    { value: 'video', label: 'Video' },
    { value: 'image', label: 'Imagen' },
    { value: 'none', label: 'Sin imagen ni video' },
  ];
  readonly selectedPageId = signal<CmsPageDesignId>('proyectos');
  readonly selectedPage = computed(
    () => this.pageList.find((p) => p.id === this.selectedPageId()) ?? this.pageList[0],
  );
  readonly pageHeading = signal('');
  readonly pageDescription = signal('');
  readonly pageContent = signal('');
  /** Questions of the selected page; null on pages that have no FAQ block. */
  readonly pageFaqs = signal<HomeFaq[] | null>(null);
  readonly isLegalPage = computed(() =>
    ['terminos-y-condiciones', 'avisos-legales'].includes(this.selectedPageId()),
  );
  readonly pageBackgroundColor = signal('');
  readonly pageBackgroundImage = signal('');

  readonly loaderEnabled = signal(false);
  readonly loaderColor = signal('');

  readonly programItems = signal<ApiTrainingProgram[]>([]);
  readonly programSel = signal(0);
  readonly programDraft = signal<Partial<ApiTrainingProgram>>({});
  readonly programIsNew = computed(() => this.programSel() === -1);
  private static readonly BLANK_PROGRAM: Partial<ApiTrainingProgram> = {
    title: '',
    description: '',
    modality: 'In-company',
    duration: '',
    imageUrl: '',
    accentColor: '#FF6B35',
    isPublished: true,
    displayOrder: 1,
  };

  readonly courseItems = signal<ApiCourseAdmin[]>([]);
  readonly courseSel = signal(0);
  readonly courseDraft = signal<Partial<ApiCourseAdmin>>({});
  readonly courseIsNew = computed(() => this.courseSel() === -1);
  private static readonly BLANK_COURSE: Partial<ApiCourseAdmin> = {
    title: '',
    description: '',
    glyph: '◆',
    accentColor: '#FF6B35',
    imageUrl: '',
    price: 0,
    isPublished: true,
    displayOrder: 1,
    materials: [],
    syllabus: [],
    reviews: [],
  };

  constructor() {
    inject(ActivatedRoute)
      .data.pipe(takeUntilDestroyed())
      .subscribe((data) => {
        const section = data['contentSection'];
        this.tab.set(
          CONTENT_MODULES.some((module) => module.section === section) ? section : 'empresas',
        );
      });
    effect(() => {
      this.loadTab(this.tab());
    });
    effect(() => {
      if (this.tab() === 'secciones') this.orderDraft.set([...this.cms.homeSectionOrder()]);
    });
    if (['cursos', 'programas', 'docentes'].includes(this.tab())) return;
    this.cms
      .load(true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: () =>
          this.toast.error(
            'No pudimos cargar el CMS',
            'Verifica tu sesión y la conexión con el backend.',
          ),
      });
  }

  rowThumbShapeClass(def: EntityDef): string {
    return def.circleThumb ? 'rounded-full' : 'rounded-sm';
  }

  rowImage(def: EntityDef, item: EntityItem): string {
    return def.imageKey ? item[def.imageKey] || '' : '';
  }

  rowGlyph(def: EntityDef, item: EntityItem): string {
    return (def.glyphKey && item[def.glyphKey]) || def.icon;
  }

  rowColor(item: EntityItem): string {
    return item['color'] || 'var(--brand-cyan)';
  }

  fieldColSpanClass(f: FieldDef): string {
    return f.type === 'textarea' || f.type === 'image' ? 'col-span-full' : '';
  }

  pick(i: number): void {
    this.sel.set(i);
    this.draft.set({ ...this.items()[i] });
  }

  setField(key: string, value: string): void {
    this.draft.update((d) => ({ ...d, [key]: value }));
  }

  onImageChange(key: string, image: string): void {
    this.setField(key, image);
  }
  imageUploadError(message: string): void {
    this.toast.error('Imagen no válida', message);
  }

  addNew(): void {
    const def = this.currentEntity();
    if (!def || def.fixed) return;
    this.sel.set(-1);
    this.draft.set({ ...def.blank });
  }

  save(): void {
    const def = this.currentEntity();
    if (!def || this.saving()) return;
    const value = this.draft();
    if (this.isHomeEditor() && value['id'] === 'faq' && this.faqEntries().some(item => !item.question.trim() || !item.answer.trim())) {
      this.toast.error('Completa la pregunta y la respuesta de cada entrada.');
      return;
    }
    const isNew = this.isNew();
    const displayOrder = isNew ? this.items().length + 1 : this.sel() + 1;
    this.saving.set(true);
    this.cms.saveCollection(def.collectionKey, value, isNew, displayOrder).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(
          'Cambios guardados',
          `"${def.rowTitle(value)}" se actualizó en el backend.`,
        );
      },
      error: () => {
        this.saving.set(false);
        this.toast.error(
          'No pudimos guardar',
          'El backend rechazó el cambio. Revisa los campos e inténtalo otra vez.',
        );
      },
    });
  }

  async deleteItem(): Promise<void> {
    const def = this.currentEntity();
    if (!def || def.fixed || this.saving() || this.dialog.dialog()) return;
    const i = this.sel();
    const item = this.items()[i];
    if (!item) return;
    const name = def.rowTitle(item);
    const confirmed = await this.dialog.confirm({
      tone: 'danger',
      title: '¿Eliminar registro?',
      message: `Se eliminará "${name}" de la web. Esta acción no se puede deshacer.`,
      confirmLabel: 'Sí, eliminar',
      cancelLabel: 'Cancelar',
    });
    if (!confirmed) return;
    const id = item['id'];
    if (!id || def.collectionKey === 'sections') return;
    this.saving.set(true);
    this.cms.deleteCollection(def.collectionKey, id).subscribe({
      next: () => {
        this.saving.set(false);
        this.sel.set(0);
        this.toast.success('Registro eliminado', `"${name}" se quitó del backend.`);
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('No pudimos eliminar', 'El backend no pudo completar la operación.');
      },
    });
  }

  saveAnnouncement(value: CmsAnnouncement): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.cms.saveAnnouncement(value).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success('Cambios guardados', 'El anuncio se actualizó en el backend.');
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('No pudimos guardar el anuncio', 'Inténtalo nuevamente.');
      },
    });
  }

  selectPage(id: CmsPageDesignId): void {
    this.selectedPageId.set(id);
    const design = this.cms.pages()[id];
    this.pageHeading.set(design.heading);
    this.pageDescription.set(design.description);
    this.pageContent.set(design.content ?? '');
    this.pageFaqs.set(isFaqPage(id) ? (design.faqs ?? PAGE_FAQS[id]) : null);
    this.pageBackgroundColor.set(design.backgroundColor);
    this.pageBackgroundImage.set(design.backgroundImage);
  }

  setPageFaq(index: number, field: keyof HomeFaq, value: string): void {
    this.pageFaqs.update(
      (faqs) => faqs?.map((faq, i) => (i === index ? { ...faq, [field]: value } : faq)) ?? null,
    );
  }

  addPageFaq(): void {
    this.pageFaqs.update((faqs) => [...(faqs ?? []), { question: '', answer: '' }]);
  }

  removePageFaq(index: number): void {
    this.pageFaqs.update((faqs) => faqs?.filter((_, i) => i !== index) ?? null);
  }

  movePageFaq(index: number, step: 1 | -1): void {
    this.pageFaqs.update((faqs) => {
      const target = index + step;
      if (!faqs || target < 0 || target >= faqs.length) return faqs;
      const next = [...faqs];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  setPageBackgroundColor(color: string): void {
    this.pageBackgroundColor.set(color);
  }

  onPageImageChange(image: string): void {
    this.pageBackgroundImage.set(image);
  }

  savePageDesign(): void {
    const id = this.selectedPageId();
    if (this.saving()) return;
    const faqs = this.pageFaqs()?.map((faq) => ({
      question: faq.question.trim(),
      answer: faq.answer.trim(),
    }));
    if (faqs?.some((faq) => !faq.question || !faq.answer)) {
      this.toast.error('Preguntas incompletas', 'Completa o quita las preguntas sin texto.');
      return;
    }
    const value: CmsPageDesign = {
      heading: this.pageHeading(),
      description: this.pageDescription(),
      ...(this.isLegalPage() ? { content: this.pageContent() } : {}),
      ...(faqs ? { faqs } : {}),
      backgroundColor: this.pageBackgroundColor(),
      backgroundImage: this.pageBackgroundImage(),
    };
    this.saving.set(true);
    this.cms.savePageDesign(id, value).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success('Cambios guardados', 'La página se actualizó en el backend.');
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('No pudimos guardar la página', 'Inténtalo nuevamente.');
      },
    });
  }

  toggleLoaderEnabled(): void {
    this.loaderEnabled.update((enabled) => !enabled);
  }

  setLoaderColor(color: string): void {
    this.loaderColor.set(color);
  }

  saveLoaderConfig(): void {
    if (this.saving()) return;
    const value: CmsLoaderConfig = { enabled: this.loaderEnabled(), color: this.loaderColor() };
    this.saving.set(true);
    this.cms.saveLoaderConfig(value).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success('Cambios guardados', 'La pantalla de carga se actualizó en el backend.');
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('No pudimos guardar', 'Inténtalo nuevamente.');
      },
    });
  }

  pickProgram(i: number): void {
    this.programSel.set(i);
    this.programDraft.set({ ...this.programItems()[i] });
  }

  addNewProgram(): void {
    this.programSel.set(-1);
    this.programDraft.set({
      ...AdminContent.BLANK_PROGRAM,
      displayOrder: this.programItems().length + 1,
    });
  }

  setProgramDraftField(
    key: 'title' | 'description' | 'modality' | 'duration',
    value: string,
  ): void {
    this.programDraft.update((d) => ({ ...d, [key]: value }));
  }

  setProgramDraftColor(color: string): void {
    this.programDraft.update((d) => ({ ...d, accentColor: color }));
  }

  onProgramDraftImageChange(image: string): void {
    this.programDraft.update((d) => ({ ...d, imageUrl: image }));
  }

  clearProgramDraftImage(): void {
    this.programDraft.update((d) => ({ ...d, imageUrl: '' }));
  }

  saveProgramDraft(): void {
    if (this.saving()) return;
    const value = this.programDraft();
    const isNew = this.programIsNew();
    const payload = {
      title: value.title ?? '',
      description: value.description ?? '',
      modality: value.modality ?? '',
      duration: value.duration ?? '',
      imageUrl: value.imageUrl || null,
      accentColor: value.accentColor || '#FF6B35',
      isPublished: value.isPublished ?? true,
      displayOrder: value.displayOrder ?? this.programItems().length + 1,
    };
    this.saving.set(true);
    const request = isNew
      ? this.api.createTrainingProgram(payload)
      : this.api.updateTrainingProgram(value.id!, payload);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success('Cambios guardados', `"${payload.title}" se actualizó en el backend.`);
        this.loadProgramsTab();
      },
      error: () => {
        this.saving.set(false);
        this.toast.error(
          'No pudimos guardar',
          'El backend rechazó el cambio. Revisa los campos e inténtalo otra vez.',
        );
      },
    });
  }

  async deleteProgramDraft(): Promise<void> {
    if (this.programIsNew() || this.saving() || this.dialog.dialog()) return;
    const item = this.programItems()[this.programSel()];
    if (!item) return;
    const confirmed = await this.dialog.confirm({
      tone: 'danger',
      title: '¿Eliminar programa?',
      message: `Se eliminará "${item.title}" de la web. Esta acción no se puede deshacer.`,
      confirmLabel: 'Sí, eliminar',
      cancelLabel: 'Cancelar',
    });
    if (!confirmed) return;
    this.saving.set(true);
    this.api.deleteTrainingProgram(item.id).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success('Programa eliminado', `"${item.title}" se quitó del backend.`);
        this.loadProgramsTab();
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('No pudimos eliminar', 'El backend no pudo completar la operación.');
      },
    });
  }

  private loadProgramsTab(): void {
    if (this.destroyRef.destroyed) return;
    this.api
      .trainingProgramsAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          this.programItems.set(items);
          this.programSel.set(items.length ? 0 : -1);
          this.programDraft.set({ ...(items[0] ?? AdminContent.BLANK_PROGRAM) });
        },
        error: () =>
          this.toast.error(
            'No pudimos cargar los programas',
            'Verifica tu sesión y la conexión con el backend.',
          ),
      });
  }

  pickCourse(i: number): void {
    this.courseSel.set(i);
    const item = this.courseItems()[i];
    this.courseDraft.set({
      ...item,
      materials: item.materials.map((m) => ({ ...m })),
      syllabus: item.syllabus.map((s) => ({ ...s })),
      reviews: item.reviews.map((r) => ({ ...r })),
    });
  }

  addNewCourse(): void {
    this.courseSel.set(-1);
    this.courseDraft.set({
      ...AdminContent.BLANK_COURSE,
      displayOrder: this.courseItems().length + 1,
      materials: [],
      syllabus: [],
      reviews: [],
    });
  }

  setCourseDraftField(
    key:
      | 'title'
      | 'description'
      | 'overview'
      | 'level'
      | 'duration'
      | 'instructorId',
    value: string,
  ): void {
    this.courseDraft.update((d) => ({ ...d, [key]: value }));
  }

  /** One item per line. Empty lines are kept while typing and dropped when saving. */
  courseDraftLines(key: 'outcomes' | 'requirements'): string {
    return (this.courseDraft()[key] ?? []).join('\n');
  }

  setCourseDraftLines(key: 'outcomes' | 'requirements', value: string): void {
    this.courseDraft.update((d) => ({ ...d, [key]: value.split('\n') }));
  }

  setCourseDraftBestSeller(isBestSeller: boolean): void {
    this.courseDraft.update((d) => ({ ...d, isBestSeller }));
  }

  setCourseDraftPrice(value: string): void {
    this.courseDraft.update((d) => ({ ...d, price: Number(value) || 0 }));
  }

  setCourseDraftColor(color: string): void {
    this.courseDraft.update((d) => ({ ...d, accentColor: color }));
  }

  setCourseDraftGlyph(glyph: string): void {
    this.courseDraft.update((d) => ({ ...d, glyph }));
  }

  onCourseDraftImageChange(image: string): void {
    this.courseDraft.update((d) => ({ ...d, imageUrl: image }));
  }

  clearCourseDraftImage(): void {
    this.courseDraft.update((d) => ({ ...d, imageUrl: '' }));
  }

  addMaterialRow(): void {
    this.courseDraft.update((d) => ({
      ...d,
      materials: [
        ...(d.materials ?? []),
        { title: '', type: 'archivo', url: '', displayOrder: d.materials?.length ?? 0 },
      ],
    }));
  }

  removeMaterialRow(i: number): void {
    this.courseDraft.update((d) => ({
      ...d,
      materials: (d.materials ?? []).filter((_, idx) => idx !== i),
    }));
  }

  setMaterialField(i: number, key: 'title' | 'type' | 'url', value: string): void {
    this.courseDraft.update((d) => ({
      ...d,
      materials: (d.materials ?? []).map((m, idx) => (idx === i ? { ...m, [key]: value } : m)),
    }));
  }

  addSyllabusRow(): void {
    this.courseDraft.update((d) => ({
      ...d,
      syllabus: [
        ...(d.syllabus ?? []),
        { title: '', description: '', displayOrder: d.syllabus?.length ?? 0 },
      ],
    }));
  }

  removeSyllabusRow(i: number): void {
    this.courseDraft.update((d) => ({
      ...d,
      syllabus: (d.syllabus ?? []).filter((_, idx) => idx !== i),
    }));
  }

  setSyllabusField(i: number, key: 'title' | 'description', value: string): void {
    this.courseDraft.update((d) => ({
      ...d,
      syllabus: (d.syllabus ?? []).map((s, idx) => (idx === i ? { ...s, [key]: value } : s)),
    }));
  }

  addReviewRow(): void {
    this.courseDraft.update((d) => ({
      ...d,
      reviews: [
        ...(d.reviews ?? []),
        { authorName: '', rating: 5, body: '', displayOrder: d.reviews?.length ?? 0 },
      ],
    }));
  }

  removeReviewRow(i: number): void {
    this.courseDraft.update((d) => ({
      ...d,
      reviews: (d.reviews ?? []).filter((_, idx) => idx !== i),
    }));
  }

  setReviewField(i: number, key: 'authorName' | 'body', value: string): void {
    this.courseDraft.update((d) => ({
      ...d,
      reviews: (d.reviews ?? []).map((r, idx) => (idx === i ? { ...r, [key]: value } : r)),
    }));
  }

  setReviewRating(i: number, rating: number): void {
    this.courseDraft.update((d) => ({
      ...d,
      reviews: (d.reviews ?? []).map((r, idx) => (idx === i ? { ...r, rating } : r)),
    }));
  }

  saveCourseDraft(): void {
    if (this.saving()) return;
    const value = this.courseDraft();
    const isNew = this.courseIsNew();
    const payload = {
      title: value.title ?? '',
      description: value.description ?? '',
      glyph: value.glyph || '◆',
      accentColor: value.accentColor || '#FF6B35',
      imageUrl: value.imageUrl || null,
      price: value.price ?? 0,
      isPublished: value.isPublished ?? true,
      isBestSeller: value.isBestSeller ?? false,
      overview: value.overview?.trim() || null,
      level: value.level?.trim() || null,
      duration: value.duration?.trim() || null,
      outcomes: (value.outcomes ?? []).map((line) => line.trim()).filter(Boolean),
      requirements: (value.requirements ?? []).map((line) => line.trim()).filter(Boolean),
      instructorId: value.instructorId || null,
      displayOrder: value.displayOrder ?? this.courseItems().length + 1,
      materials: (value.materials ?? []).filter((m) => m.title.trim() && m.url.trim()),
      syllabus: (value.syllabus ?? []).filter((s) => s.title.trim()),
      reviews: (value.reviews ?? []).filter((r) => r.authorName.trim() && r.body.trim()),
    };
    this.saving.set(true);
    const request = isNew
      ? this.api.createCourse(payload)
      : this.api.updateCourse(value.id!, payload);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success('Cambios guardados', `"${payload.title}" se actualizó en el backend.`);
        this.loadCoursesTab();
      },
      error: () => {
        this.saving.set(false);
        this.toast.error(
          'No pudimos guardar',
          'El backend rechazó el cambio. Revisa los campos e inténtalo otra vez.',
        );
      },
    });
  }

  async deleteCourseDraft(): Promise<void> {
    if (this.courseIsNew() || this.saving() || this.dialog.dialog()) return;
    const item = this.courseItems()[this.courseSel()];
    if (!item) return;
    const confirmed = await this.dialog.confirm({
      tone: 'danger',
      title: '¿Eliminar curso?',
      message: `Se eliminará "${item.title}" de la web. Esta acción no se puede deshacer.`,
      confirmLabel: 'Sí, eliminar',
      cancelLabel: 'Cancelar',
    });
    if (!confirmed) return;
    this.saving.set(true);
    this.api.deleteCourse(item.id).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success('Curso eliminado', `"${item.title}" se quitó del backend.`);
        this.loadCoursesTab();
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('No pudimos eliminar', 'El backend no pudo completar la operación.');
      },
    });
  }

  // ---- Instructors: their own records, assigned to courses from the course form ----
  readonly instructorItems = signal<ApiInstructor[]>([]);
  readonly instructorSel = signal(0);
  readonly instructorDraft = signal<Partial<ApiInstructor>>({});
  readonly instructorIsNew = computed(() => this.instructorSel() === -1);
  /** Options of the instructor picker in the course form. */
  readonly instructorOptions = computed(() => [
    { value: '', label: 'Sin docente' },
    ...this.instructorItems().map((item) => ({ value: item.id, label: item.name })),
  ]);
  readonly courseInstructor = computed(
    () => this.instructorItems().find((item) => item.id === this.courseDraft().instructorId) ?? null,
  );

  pickInstructor(i: number): void {
    this.instructorSel.set(i);
    this.instructorDraft.set({ ...this.instructorItems()[i] });
  }

  addNewInstructor(): void {
    this.instructorSel.set(-1);
    this.instructorDraft.set({ name: '', title: '', bio: '', photoUrl: '', achievements: [] });
  }

  setInstructorField(key: 'name' | 'title' | 'bio' | 'photoUrl', value: string): void {
    this.instructorDraft.update((d) => ({ ...d, [key]: value }));
  }

  instructorAchievementLines(): string {
    return (this.instructorDraft().achievements ?? []).join('\n');
  }

  setInstructorAchievements(value: string): void {
    this.instructorDraft.update((d) => ({ ...d, achievements: value.split('\n') }));
  }

  saveInstructorDraft(): void {
    if (this.saving()) return;
    const value = this.instructorDraft();
    const name = value.name?.trim() ?? '';
    if (!name) {
      this.toast.error('Falta el nombre', 'Escribe el nombre del docente.');
      return;
    }
    const payload = {
      name,
      title: value.title?.trim() || null,
      bio: value.bio?.trim() || null,
      photoUrl: value.photoUrl || null,
      achievements: (value.achievements ?? []).map((line) => line.trim()).filter(Boolean),
    };
    this.saving.set(true);
    const request = this.instructorIsNew()
      ? this.api.createInstructor(payload)
      : this.api.updateInstructor(value.id!, payload);
    request.subscribe({
      next: (saved) => {
        this.saving.set(false);
        this.toast.success('Cambios guardados', `"${name}" se guardó en el backend.`);
        this.loadInstructors(saved.id);
      },
      error: () => {
        this.saving.set(false);
        this.toast.error(
          'No pudimos guardar',
          'El backend rechazó el cambio. Revisa los campos e inténtalo otra vez.',
        );
      },
    });
  }

  async deleteInstructorDraft(): Promise<void> {
    if (this.instructorIsNew() || this.saving() || this.dialog.dialog()) return;
    const item = this.instructorItems()[this.instructorSel()];
    if (!item) return;
    const confirmed = await this.dialog.confirm({
      tone: 'danger',
      title: '¿Eliminar docente?',
      message: `Se eliminará a "${item.name}". Los cursos que lo tenían asignado quedarán sin docente.`,
      confirmLabel: 'Sí, eliminar',
      cancelLabel: 'Cancelar',
    });
    if (!confirmed) return;
    this.saving.set(true);
    this.api.deleteInstructor(item.id).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success('Docente eliminado', `"${item.name}" se quitó del backend.`);
        this.loadInstructors();
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('No pudimos eliminar', 'El backend no pudo completar la operación.');
      },
    });
  }

  /** Loads the instructors; `selectId` keeps that record open in the editor. */
  private loadInstructors(selectId?: string): void {
    if (this.destroyRef.destroyed) return;
    this.api
      .instructorsAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          this.instructorItems.set(items);
          const index = Math.max(
            0,
            items.findIndex((item) => item.id === selectId),
          );
          if (items.length) this.pickInstructor(index);
          else this.addNewInstructor();
        },
        error: () =>
          this.toast.error(
            'No pudimos cargar los docentes',
            'Verifica tu sesión y la conexión con el backend.',
          ),
      });
  }

  private loadCoursesTab(): void {
    if (this.destroyRef.destroyed) return;
    this.api
      .coursesAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          this.courseItems.set(items);
          this.courseSel.set(items.length ? 0 : -1);
          this.courseDraft.set({ ...(items[0] ?? AdminContent.BLANK_COURSE) });
        },
        error: () =>
          this.toast.error(
            'No pudimos cargar los cursos',
            'Verifica tu sesión y la conexión con el backend.',
          ),
      });
  }

  setHeaderLink(i: number, key: keyof HeaderLink, value: string): void {
    this.headerLinks.update((links) =>
      links.map((l, idx) => (idx === i ? { ...l, [key]: value } : l)),
    );
  }

  headerLinkVariantLabel(variant: HeaderLink['variant']): string {
    if (variant === 'primary') return 'Botón relleno';
    if (variant === 'outline') return 'Botón contorno';
    return 'Enlace del menú';
  }

  setHeaderLinkVariant(i: number, label: string): void {
    const variant =
      label === 'Botón relleno' ? 'primary' : label === 'Botón contorno' ? 'outline' : '';
    this.headerLinks.update((links) => links.map((l, idx) => (idx === i ? { ...l, variant } : l)));
  }

  removeHeaderLink(i: number): void {
    this.headerLinks.update((links) => links.filter((_, idx) => idx !== i));
  }

  addHeaderLink(): void {
    this.headerLinks.update((links) => [...links, { label: 'Nuevo', href: '#', variant: '' }]);
  }

  saveHeader(): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.cms
      .saveHeader({
        links: this.headerLinks().map((link) => ({ ...link, variant: link.variant ?? '' })),
        cta: this.headerCta(),
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success('Cambios guardados', 'El header se actualizó en el backend.');
        },
        error: () => {
          this.saving.set(false);
          this.toast.error('No pudimos guardar el header', 'Inténtalo nuevamente.');
        },
      });
  }

  setFooterColumn(i: number, key: keyof FooterColumn, value: string): void {
    this.footerColumns.update((cols) =>
      cols.map((c, idx) => (idx === i ? { ...c, [key]: value } : c)),
    );
  }

  removeFooterColumn(i: number): void {
    this.footerColumns.update((cols) => cols.filter((_, idx) => idx !== i));
  }

  addFooterColumn(): void {
    this.footerColumns.update((cols) => [
      ...cols,
      { title: 'Nueva columna', links: 'Enlace 1\nEnlace 2' },
    ]);
  }

  saveFooter(): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.cms
      .saveFooter({
        about: this.footerAbout(),
        email: this.footerEmail(),
        phone: this.footerPhone(),
        columns: this.footerColumns().map((column) => ({ ...column })),
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success('Cambios guardados', 'El footer se actualizó en el backend.');
        },
        error: () => {
          this.saving.set(false);
          this.toast.error('No pudimos guardar el footer', 'Inténtalo nuevamente.');
        },
      });
  }

  private loadTab(tab: string): void {
    const def = ENTITIES[tab === 'animacion' ? 'secciones' : tab];
    if (def) {
      const media = def.collectionKey === 'sections' ? this.cms.heroAnimation() : undefined;
      const collection = (
        this.cms[def.collectionKey]().map((item) => ({ ...item })) as EntityItem[]
      )
        .filter((item) => tab !== 'animacion' || item['id'] === 'hero')
        .map((item) =>
          item['id'] === 'hero' && media
            ? {
                ...item,
                mediaMode: media.mode ?? (media.enabled ? 'video' : 'none'),
                videoUrl: media.videoUrl,
              }
            : { ...item },
        );
      this.items.set(collection);
      this.sel.set(collection.length ? 0 : -1);
      this.draft.set({ ...(collection[0] ?? def.blank) });
      return;
    }

    if (tab === 'anuncio') return;

    if (tab === 'paginas') {
      this.selectPage(this.selectedPageId());
      return;
    }

    if (tab === 'carga') {
      const loader = this.cms.loader();
      this.loaderEnabled.set(loader.enabled);
      this.loaderColor.set(loader.color);
      return;
    }

    if (tab === 'programas') {
      this.loadProgramsTab();
      return;
    }

    if (tab === 'cursos') {
      this.loadCoursesTab();
      this.loadInstructors();
      return;
    }

    if (tab === 'docentes') {
      this.loadInstructors();
      return;
    }

    if (tab === 'header') {
      const header = this.cms.header();
      const isReservedServicesLink = (link: HeaderLink) =>
        link.label.trim().toLowerCase() === 'servicios' || link.href === '#servicios';
      this.headerLinks.set(
        header.links.filter((link) => !isReservedServicesLink(link)).map((link) => ({ ...link })),
      );
      this.headerCta.set(header.cta);
      return;
    }

    if (tab === 'footer') {
      const footer = this.cms.footer();
      this.socialLinks.set(this.cms.socialLinks().map((link) => ({ ...link })));
      this.footerAbout.set(footer.about);
      this.footerEmail.set(footer.email);
      this.footerPhone.set(footer.phone);
      this.footerColumns.set(footer.columns.map((column) => ({ ...column })));
    }
  }
}
