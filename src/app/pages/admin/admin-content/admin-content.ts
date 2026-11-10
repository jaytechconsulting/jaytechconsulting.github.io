import { Checkbox } from '../../../ui/forms/checkbox/checkbox';
import { SOCIAL_NETWORKS, socialUrlValid, type SocialLink } from '../../../core/cms/social-links';
import { ImageFile } from '../../../ui/behaviors/image-file';
import type { HeaderLink } from '../../../ui/navigation/header/header';
import { AnnouncementEditor } from './announcement-editor/announcement-editor';
import { AccessAction } from '../../../ui/behaviors/access-action';
import { CONTENT_MODULES } from './content-modules';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminShell } from '../admin-shell/admin-shell';
import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
  type CmsHeroAnimation,
  type CmsLoaderConfig,
  type CmsPageDesign,
  type CmsPageDesignId,
} from '../../../core/cms/cms-content.service';
import { ApiService } from '../../../core/api.service';
import type { ApiCourseAdmin, ApiTrainingProgram } from '../../../core/models/api.models';

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
    Checkbox,
    ImageFile,
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
})
export class AdminContent {
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(DialogService);
  private readonly cms = inject(CmsContentService);
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly palette = PALETTE;
  readonly glyphs = GLYPHS;

  readonly tab = signal('empresas');
  readonly currentEntity = computed(() => ENTITIES[this.tab()]);
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
  readonly selectedPageId = signal<CmsPageDesignId | 'inicio'>('proyectos');
  readonly selectedPage = computed(
    () => this.pageList.find((p) => p.id === this.selectedPageId()) ?? this.pageList[0],
  );
  readonly pageHeading = signal('');
  readonly pageDescription = signal('');
  readonly pageContent = signal('');
  readonly isLegalPage = computed(() =>
    ['terminos-y-condiciones', 'avisos-legales'].includes(this.selectedPageId()),
  );
  readonly pageBackgroundColor = signal('');
  readonly pageBackgroundImage = signal('');

  readonly loaderEnabled = signal(false);
  readonly loaderColor = signal('');

  readonly heroAnimationEnabled = signal(true);
  readonly heroAnimationVideoUrl = signal('');

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
    if (this.tab() === 'cursos' || this.tab() === 'programas') return;
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

  rowButtonClasses(i: number): string {
    const on = i === this.sel();
    return [
      'flex w-full cursor-pointer items-center gap-3 border-b border-l-[3px] px-[18px] py-3 text-left transition-colors duration-150 ease-out',
      on
        ? 'border-b-border-subtle border-l-brand-orange bg-surface-sunken'
        : 'border-b-border-subtle border-l-transparent bg-transparent',
    ].join(' ');
  }

  programRowButtonClasses(i: number): string {
    const on = i === this.programSel();
    return [
      'flex w-full cursor-pointer items-center gap-3 border-b border-l-[3px] px-[18px] py-3 text-left transition-colors duration-150 ease-out',
      on
        ? 'border-b-border-subtle border-l-brand-orange bg-surface-sunken'
        : 'border-b-border-subtle border-l-transparent bg-transparent',
    ].join(' ');
  }

  courseRowButtonClasses(i: number): string {
    const on = i === this.courseSel();
    return [
      'flex w-full cursor-pointer items-center gap-3 border-b border-l-[3px] px-[18px] py-3 text-left transition-colors duration-150 ease-out',
      on
        ? 'border-b-border-subtle border-l-brand-orange bg-surface-sunken'
        : 'border-b-border-subtle border-l-transparent bg-transparent',
    ].join(' ');
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

  selectPage(id: CmsPageDesignId | 'inicio'): void {
    this.selectedPageId.set(id);
    if (id === 'inicio') return;
    const design = this.cms.pages()[id];
    this.pageHeading.set(design.heading);
    this.pageDescription.set(design.description);
    this.pageContent.set(design.content ?? '');
    this.pageBackgroundColor.set(design.backgroundColor);
    this.pageBackgroundImage.set(design.backgroundImage);
  }

  setPageBackgroundColor(color: string): void {
    this.pageBackgroundColor.set(color);
  }

  onPageImageChange(image: string): void {
    this.pageBackgroundImage.set(image);
  }

  savePageDesign(): void {
    const id = this.selectedPageId();
    if (this.saving() || id === 'inicio') return;
    const value: CmsPageDesign = {
      heading: this.pageHeading(),
      description: this.pageDescription(),
      ...(this.isLegalPage() ? { content: this.pageContent() } : {}),
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

  toggleHeroAnimationEnabled(): void {
    this.heroAnimationEnabled.update((enabled) => !enabled);
  }

  setHeroAnimationVideoUrl(value: string): void {
    this.heroAnimationVideoUrl.set(value);
  }

  saveHeroAnimation(): void {
    if (this.saving()) return;
    const value: CmsHeroAnimation = {
      enabled: this.heroAnimationEnabled(),
      videoUrl: this.heroAnimationVideoUrl(),
    };
    this.saving.set(true);
    this.cms.saveHeroAnimation(value).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success(
          'Cambios guardados',
          'La animación de inicio se actualizó en el backend.',
        );
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

  setCourseDraftField(key: 'title' | 'description', value: string): void {
    this.courseDraft.update((d) => ({ ...d, [key]: value }));
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
    const def = ENTITIES[tab];
    if (def) {
      const collection = this.cms[def.collectionKey]().map((item) => ({ ...item })) as EntityItem[];
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

    if (tab === 'animacion') {
      const heroAnimation = this.cms.heroAnimation();
      this.heroAnimationEnabled.set(heroAnimation.enabled);
      this.heroAnimationVideoUrl.set(heroAnimation.videoUrl);
      return;
    }

    if (tab === 'programas') {
      this.loadProgramsTab();
      return;
    }

    if (tab === 'cursos') {
      this.loadCoursesTab();
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
