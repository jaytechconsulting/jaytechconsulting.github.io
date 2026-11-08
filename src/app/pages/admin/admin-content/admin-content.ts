import { AccessAction } from '../../../core/access-action';
import { CONTENT_MODULES } from './content-modules';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminShell } from '../admin-shell/admin-shell';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Card } from '../../../ui/data-display/card/card';
import { Badge } from '../../../ui/data-display/badge/badge';
import { Button } from '../../../ui/actions/button/button';
import { Input } from '../../../ui/forms/input/input';
import { Textarea } from '../../../ui/forms/textarea/textarea';
import { Select } from '../../../ui/forms/select/select';
import { ToastService } from '../../../core/services/toast.service';
import { DialogService } from '../../../core/services/dialog.service';
import { CmsContentService, type CmsAnnouncement, type CmsContentState, type CmsHeroAnimation, type CmsLoaderConfig, type CmsPageDesign, type CmsPageDesignId } from '../../../core/cms-content.service';
import { ApiService } from '../../../core/api.service';
import type { ApiCourseAdmin, ApiCourseMaterial, ApiTrainingProgram } from '../../../core/models/api.models';

type FieldType = 'text' | 'textarea' | 'select' | 'color' | 'glyph' | 'image';

interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: string[];
  shape?: 'rect' | 'circle';
  hint?: string;
}

type EntityItem = Record<string, string>;

interface EntityDef {
  collectionKey: keyof Pick<CmsContentState, 'companies' | 'reviews' | 'services' | 'projects' | 'plans' | 'sections' | 'teamMembers'>;
  label: string;
  icon: string;
  title: string;
  addLabel: string;
  circleThumb?: boolean;
  imageKey?: string;
  glyphKey?: string;
  fixed?: boolean;
  fields: FieldDef[];
  blank: EntityItem;
  seed: EntityItem[];
  rowTitle: (item: EntityItem) => string;
  rowSub: (item: EntityItem) => string;
}

interface HeaderLink {
  label: string;
  href: string;
  variant?: '' | 'primary' | 'outline';
}

interface FooterColumn {
  title: string;
  links: string;
}

const PALETTE = ['#FF6B35', '#22D3EE', '#F7C948', '#7C6FF0', '#1F8A5B'];
const GLYPHS = ['◧', '⬡', '▲', '⬢', '◨', '◇'];

const ENTITIES: Record<string, EntityDef> = {
  secciones: {
    collectionKey: 'sections',
    label: 'Secciones',
    icon: '▥',
    title: 'Secciones de la página',
    addLabel: 'sección',
    imageKey: 'image',
    fixed: true,
    blank: {},
    fields: [
      { key: 'image', label: 'Imagen de la sección', type: 'image', shape: 'rect', hint: 'JPG, PNG, WebP o SVG. Máximo 1 MB.' },
      { key: 'title', label: 'Título principal', type: 'text', placeholder: 'Un socio tecnológico' },
      { key: 'description', label: 'Descripción', type: 'textarea', placeholder: 'Texto de apoyo de la sección.' },
    ],
    seed: [],
    rowTitle: (item) => item['name'] || 'Sección',
    rowSub: (item) => item['title'],
  },
  empresas: {
    collectionKey: 'companies',
    label: 'Empresas',
    icon: '◑',
    title: 'Empresas / clientes',
    addLabel: 'empresa',
    imageKey: 'logo',
    blank: { name: '', sector: '', result: '', logo: '', glyph: '◧', color: '#FF6B35' },
    fields: [
      { key: 'logo', label: 'Logo de la empresa', type: 'image', shape: 'rect', hint: 'PNG/SVG con fondo transparente' },
      { key: 'glyph', label: 'Ícono alternativo', type: 'glyph' },
      { key: 'name', label: 'Nombre', type: 'text', placeholder: 'Comercial Andina' },
      { key: 'sector', label: 'Sector', type: 'text', placeholder: 'Retail' },
      { key: 'result', label: 'Métrica de resultado', type: 'text', placeholder: '−40% tiempo de conteo' },
      { key: 'color', label: 'Color de acento', type: 'color' },
    ],
    seed: [
      { name: 'Comercial Andina', sector: 'Retail', result: '−40% tiempo de conteo', logo: '', color: '#FF6B35' },
      { name: 'Estudio Vega', sector: 'Legal', result: '8 h/sem ahorradas', logo: '', color: '#22D3EE' },
      { name: 'Nova Fitness', sector: 'Fitness', result: '+3.2× conversión', logo: '', color: '#F7C948' },
    ],
    rowTitle: (item) => item['name'] || 'Sin nombre',
    rowSub: (item) => item['sector'],
  },
  resenas: {
    collectionKey: 'reviews',
    label: 'Reseñas',
    icon: '★',
    title: 'Reseñas de clientes',
    addLabel: 'reseña',
    circleThumb: true,
    imageKey: 'photo',
    blank: { name: '', role: '', company: '', quote: '', rating: '5', photo: '', color: '#FF6B35' },
    fields: [
      { key: 'photo', label: 'Foto de la persona', type: 'image', shape: 'circle', hint: 'Retrato cuadrado, se recorta en círculo' },
      { key: 'name', label: 'Nombre', type: 'text', placeholder: 'María Fernández' },
      { key: 'role', label: 'Cargo', type: 'text', placeholder: 'Gerente de operaciones' },
      { key: 'company', label: 'Empresa', type: 'text', placeholder: 'Comercial Andina' },
      { key: 'rating', label: 'Calificación', type: 'select', options: ['5', '4', '3', '2', '1'] },
      { key: 'color', label: 'Color de acento', type: 'color' },
      { key: 'quote', label: 'Reseña', type: 'textarea', placeholder: 'El panel nos cambió la operación…' },
    ],
    seed: [
      { name: 'María Fernández', role: 'Gerente de operaciones', company: 'Comercial Andina', quote: 'El panel de inventario nos cambió la operación por completo.', rating: '5', photo: '' },
      { name: 'Diego Vega', role: 'Fundador', company: 'Estudio Vega', quote: 'Automatizaron toda nuestra facturación. Recuperamos 8 horas a la semana.', rating: '5', photo: '' },
    ],
    rowTitle: (item) => item['name'] || 'Sin nombre',
    rowSub: (item) => item['company'],
  },
  servicios: {
    collectionKey: 'services',
    label: 'Qué hacemos',
    icon: '◆',
    title: 'Servicios (Qué hacemos)',
    addLabel: 'servicio',
    glyphKey: 'glyph',
    blank: { title: '', body: '', glyph: '◆', color: '#FF6B35' },
    fields: [
      { key: 'glyph', label: 'Ícono', type: 'glyph' },
      { key: 'title', label: 'Título', type: 'text', placeholder: 'Aplicaciones web' },
      { key: 'color', label: 'Color de acento', type: 'color' },
      { key: 'body', label: 'Descripción', type: 'textarea', placeholder: 'Plataformas y paneles a medida…' },
    ],
    seed: [
      { title: 'Aplicaciones web', body: 'Plataformas y paneles a medida, del MVP a producción.', glyph: '◆', color: '#FF6B35' },
      { title: 'Páginas & landings', body: 'Sitios rápidos y bien posicionados que convierten.', glyph: '▲', color: '#22D3EE' },
      { title: 'Automatizaciones', body: 'Conectamos tus herramientas y eliminamos el trabajo manual.', glyph: '⬡', color: '#F7C948' },
      { title: 'Integraciones / API', body: 'Unimos tus sistemas: pagos, CRMs, ERPs y terceros.', glyph: '⬢', color: '#7C6FF0' },
    ],
    rowTitle: (item) => item['title'] || 'Sin título',
    rowSub: (item) => (item['body'] || '').slice(0, 40),
  },
  proyectos: {
    collectionKey: 'projects',
    label: 'Proyectos',
    icon: '▤',
    title: 'Proyectos del portafolio',
    addLabel: 'proyecto',
    imageKey: 'logo',
    blank: { title: '', client: '', cat: 'Web', year: '2026', metric: '', logo: '', summary: '', challenge: '', solution: '', color: '#FF6B35' },
    fields: [
      { key: 'logo', label: 'Logo / imagen del proyecto', type: 'image', shape: 'rect', hint: 'Logo del cliente o captura' },
      { key: 'title', label: 'Título', type: 'text', placeholder: 'Panel de inventario' },
      { key: 'client', label: 'Cliente', type: 'text', placeholder: 'Comercial Andina' },
      { key: 'cat', label: 'Categoría', type: 'select', options: ['Web', 'Landing', 'Automatización', 'Integración'] },
      { key: 'year', label: 'Año', type: 'text', placeholder: '2026' },
      { key: 'metric', label: 'Métrica principal', type: 'text', placeholder: '−40% tiempo de conteo' },
      { key: 'color', label: 'Color de acento', type: 'color' },
      { key: 'summary', label: 'Resumen', type: 'textarea', placeholder: 'Reemplazamos las hojas de cálculo por…' },
      { key: 'challenge', label: 'El reto (detalle)', type: 'textarea', placeholder: 'El conteo mensual tomaba 3 días…' },
      { key: 'solution', label: 'La solución (detalle)', type: 'textarea', placeholder: 'Un panel en tiempo real con roles…' },
    ],
    seed: [
      { title: 'Panel de inventario', client: 'Comercial Andina', cat: 'Web', year: '2026', metric: '−40% tiempo de conteo', logo: '', summary: 'Control de stock en tiempo real con alertas y reportes.', challenge: 'El conteo mensual tomaba 3 días de trabajo manual.', solution: 'Panel en tiempo real con roles e integración con POS.', color: '#FF6B35' },
      { title: 'Automatización de facturas', client: 'Estudio Vega', cat: 'Automatización', year: '2026', metric: '8 h/sem ahorradas', logo: '', summary: 'Emisión y envío de comprobantes conectando ventas con la SUNAT.', challenge: 'Cada factura se emitía a mano.', solution: 'Un flujo n8n que valida, emite y envía.', color: '#22D3EE' },
    ],
    rowTitle: (item) => item['title'] || 'Sin título',
    rowSub: (item) => `${item['client']} · ${item['cat']}`,
  },
  planes: {
    collectionKey: 'plans',
    label: 'Planes',
    icon: '▦',
    title: 'Planes de precios',
    addLabel: 'plan',
    blank: { name: '', price: '', description: '', features: '', featured: 'No', cta: 'Empezar' },
    fields: [
      { key: 'name', label: 'Nombre del plan', type: 'text', placeholder: 'Crece' },
      { key: 'price', label: 'Precio', type: 'text', placeholder: 'S/ 3,500' },
      { key: 'featured', label: 'Destacado', type: 'select', options: ['No', 'Sí'] },
      { key: 'cta', label: 'Texto del botón', type: 'text', placeholder: 'Agendar llamada' },
      { key: 'description', label: 'Descripción', type: 'textarea', placeholder: 'Aplicación web completa a medida.' },
      { key: 'features', label: 'Características (una por línea)', type: 'textarea', placeholder: 'App web a medida\nPanel de administración\nIntegraciones / API' },
    ],
    seed: [
      { name: 'Emprende', price: 'S/ 1,200', description: 'Para lanzar tu presencia digital.', features: 'Landing page a medida\nFormulario de contacto\nHosting 1 año incluido\n2 rondas de ajustes', featured: 'No', cta: 'Empezar' },
      { name: 'Crece', price: 'S/ 3,500', description: 'Aplicación web completa a medida.', features: 'App web a medida\nPanel de administración\nIntegraciones / API\nSoporte prioritario 6 meses', featured: 'Sí', cta: 'Agendar llamada' },
      { name: 'A medida', price: 'Custom', description: 'Proyectos complejos y automatización.', features: 'Alcance definido contigo\nAutomatizaciones\nEquipo dedicado\nSLA garantizado', featured: 'No', cta: 'Contáctanos' },
    ],
    rowTitle: (item) => item['name'] || 'Sin nombre',
    rowSub: (item) => item['price'],
  },
  equipo: {
    collectionKey: 'teamMembers',
    label: 'Equipo',
    icon: '◑',
    title: 'Equipo (Conócenos)',
    addLabel: 'integrante',
    circleThumb: true,
    imageKey: 'photo',
    blank: { name: '', role: '', bio: '', photo: '', linkedin: '', color: '#FF6B35' },
    fields: [
      { key: 'photo', label: 'Foto', type: 'image', shape: 'circle', hint: 'Retrato cuadrado, se recorta en círculo' },
      { key: 'name', label: 'Nombre', type: 'text', placeholder: 'Jayro Guerreros' },
      { key: 'role', label: 'Cargo', type: 'text', placeholder: 'Fundador · Ingeniería' },
      { key: 'linkedin', label: 'LinkedIn (opcional)', type: 'text', placeholder: 'https://linkedin.com/in/...' },
      { key: 'color', label: 'Color de acento', type: 'color' },
      { key: 'bio', label: 'Biografía corta', type: 'textarea', placeholder: 'Lidera la arquitectura técnica de cada proyecto.' },
    ],
    seed: [
      { name: 'Jayro Guerreros', role: 'Fundador · Ingeniería', bio: 'Lidera la arquitectura técnica y el desarrollo de cada proyecto, de principio a fin.', photo: '', linkedin: '', color: '#FF6B35' },
      { name: 'Valeria Soto', role: 'Diseño de producto', bio: 'Convierte requerimientos complejos en interfaces simples que los equipos realmente usan.', photo: '', linkedin: '', color: '#22D3EE' },
      { name: 'Marco Huamán', role: 'Automatización & datos', bio: 'Diseña los flujos e integraciones que eliminan el trabajo manual repetitivo.', photo: '', linkedin: '', color: '#F7C948' },
    ],
    rowTitle: (item) => item['name'] || 'Sin nombre',
    rowSub: (item) => item['role'],
  },
};



const INITIAL_HEADER_LINKS: HeaderLink[] = [
  { label: 'Proyectos', href: '#proyectos' },
  { label: 'Planes', href: '#planes' },
  { label: 'Nosotros', href: '#nosotros' },
];
const INITIAL_HEADER_CTA = 'Solicitar propuesta';

const INITIAL_FOOTER_ABOUT = 'Software a medida que hace crecer tu empresa. Del prototipo a producción.';
const INITIAL_FOOTER_EMAIL = 'hola@dronlab.pe';
const INITIAL_FOOTER_PHONE = '+51 993 908 435';
const INITIAL_FOOTER_COLUMNS: FooterColumn[] = [
  { title: 'Producto', links: 'Servicios\nPlanes\nProyectos' },
  { title: 'Empresa', links: 'Nosotros\nContacto\nBlog' },
  { title: 'Legal', links: 'Términos\nPrivacidad' },
];

const PAGE_LIST: { id: CmsPageDesignId | 'inicio'; label: string; route: string; editable: boolean }[] = [
  { id: 'inicio', label: 'Inicio', route: '/', editable: false },
  { id: 'proyectos', label: 'Proyectos', route: '/proyectos', editable: true },
  { id: 'propuesta', label: 'Solicitar propuesta', route: '/solicitar-propuesta', editable: true },
  { id: 'login', label: 'Iniciar sesión', route: '/login', editable: true },
  { id: 'asesorias', label: 'Asesorías', route: '/asesorias', editable: true },
  { id: 'capacitaciones', label: 'Capacitaciones', route: '/capacitaciones', editable: true },
  { id: 'conocenos', label: 'Conócenos', route: '/conocenos', editable: true },
];

/** Sub-página del panel admin: gestión de contenido web (empresas, reseñas, servicios, proyectos, planes, header, footer). No es una entrada del switch interno del panel — se navega como ruta aparte. */
@Component({
  selector: 'app-admin-content',
  imports: [AccessAction,AdminShell, Card, Badge, Button, Input, Textarea, Select],
  templateUrl: './admin-content.html',
})
export class AdminContent {
  private readonly toast = inject(ToastService);
  private readonly dialog = inject(DialogService);
  private readonly cms = inject(CmsContentService);
  private readonly api = inject(ApiService);

  readonly palette = PALETTE;
  readonly glyphs = GLYPHS;

  readonly tab = signal('empresas');
  readonly currentEntity = computed(() => ENTITIES[this.tab()]);
  readonly moduleTitle = computed(() => CONTENT_MODULES.find(module => module.section === this.tab())?.label ?? 'Empresas');

  readonly items = signal<EntityItem[]>([]);
  readonly sel = signal(0);
  readonly draft = signal<EntityItem>({});
  readonly isNew = computed(() => this.sel() === -1);
  readonly saving = signal(false);

  readonly headerLinks = signal<HeaderLink[]>([...INITIAL_HEADER_LINKS]);
  readonly headerCta = signal(INITIAL_HEADER_CTA);

  readonly footerAbout = signal(INITIAL_FOOTER_ABOUT);
  readonly footerEmail = signal(INITIAL_FOOTER_EMAIL);
  readonly footerPhone = signal(INITIAL_FOOTER_PHONE);
  readonly footerColumns = signal<FooterColumn[]>([...INITIAL_FOOTER_COLUMNS]);

  readonly announcementMessage = signal('');
  readonly announcementLinkLabel = signal('');
  readonly announcementLinkHref = signal('');
  readonly announcementActive = signal(false);
  readonly announcementBackgroundColor = signal('');
  readonly announcementBackgroundImage = signal('');

  readonly headerLinkVariantOptions = ['Enlace del menú', 'Botón relleno', 'Botón contorno'];

  readonly pageList = PAGE_LIST;
  readonly selectedPageId = signal<CmsPageDesignId | 'inicio'>('proyectos');
  readonly selectedPage = computed(() => this.pageList.find((p) => p.id === this.selectedPageId()) ?? this.pageList[0]);
  readonly pageHeading = signal('');
  readonly pageDescription = signal('');
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
  private static readonly BLANK_PROGRAM: Partial<ApiTrainingProgram> = { title: '', description: '', modality: 'In-company', duration: '', imageUrl: '', accentColor: '#FF6B35', isPublished: true, displayOrder: 1 };

  readonly courseItems = signal<ApiCourseAdmin[]>([]);
  readonly courseSel = signal(0);
  readonly courseDraft = signal<Partial<ApiCourseAdmin>>({});
  readonly courseIsNew = computed(() => this.courseSel() === -1);
  private static readonly BLANK_COURSE: Partial<ApiCourseAdmin> = { title: '', description: '', glyph: '◆', accentColor: '#FF6B35', imageUrl: '', price: 0, isPublished: true, displayOrder: 1, materials: [], syllabus: [], reviews: [] };

  constructor() {
    inject(ActivatedRoute).data.pipe(takeUntilDestroyed()).subscribe(data => {
      const section = data['contentSection'];
      this.tab.set(CONTENT_MODULES.some(module => module.section === section) ? section : 'empresas');
    });
    effect(() => {
      this.loadTab(this.tab());
    });
    this.cms.load(true).subscribe({
      error: () => this.toast.error('No pudimos cargar el CMS', 'Verifica tu sesión y la conexión con el backend.'),
    });
  }

  rowButtonClasses(i: number): string {
    const on = i === this.sel();
    return [
      'flex w-full cursor-pointer items-center gap-3 border-b border-l-[3px] px-[18px] py-3 text-left transition-colors duration-150 ease-out',
      on ? 'border-b-border-subtle border-l-brand-orange bg-surface-sunken' : 'border-b-border-subtle border-l-transparent bg-transparent',
    ].join(' ');
  }

  programRowButtonClasses(i: number): string {
    const on = i === this.programSel();
    return [
      'flex w-full cursor-pointer items-center gap-3 border-b border-l-[3px] px-[18px] py-3 text-left transition-colors duration-150 ease-out',
      on ? 'border-b-border-subtle border-l-brand-orange bg-surface-sunken' : 'border-b-border-subtle border-l-transparent bg-transparent',
    ].join(' ');
  }

  courseRowButtonClasses(i: number): string {
    const on = i === this.courseSel();
    return [
      'flex w-full cursor-pointer items-center gap-3 border-b border-l-[3px] px-[18px] py-3 text-left transition-colors duration-150 ease-out',
      on ? 'border-b-border-subtle border-l-brand-orange bg-surface-sunken' : 'border-b-border-subtle border-l-transparent bg-transparent',
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

  onImageChange(key: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.toast.error('Archivo no válido', 'Selecciona una imagen JPG, PNG, WebP o SVG.');
      input.value = '';
      return;
    }
    if (file.size > 1024 * 1024) {
      this.toast.error('Imagen demasiado grande', 'La imagen debe pesar como máximo 1 MB.');
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.setField(key, reader.result as string);
      input.value = '';
    };
    reader.readAsDataURL(file);
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
        this.toast.success('Cambios guardados', `"${def.rowTitle(value)}" se actualizó en el backend.`);
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('No pudimos guardar', 'El backend rechazó el cambio. Revisa los campos e inténtalo otra vez.');
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

  toggleAnnouncementActive(): void {
    this.announcementActive.update((active) => !active);
  }

  setAnnouncementBackgroundColor(color: string): void {
    this.announcementBackgroundColor.set(color);
  }

  onAnnouncementImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.toast.error('Archivo no válido', 'Selecciona una imagen JPG, PNG, WebP o SVG.');
      input.value = '';
      return;
    }
    if (file.size > 1024 * 1024) {
      this.toast.error('Imagen demasiado grande', 'La imagen debe pesar como máximo 1 MB.');
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.announcementBackgroundImage.set(reader.result as string);
      input.value = '';
    };
    reader.readAsDataURL(file);
  }

  saveAnnouncement(): void {
    if (this.saving()) return;
    const value: CmsAnnouncement = {
      ...this.cms.announcement(),
      message: this.announcementMessage(),
      linkLabel: this.announcementLinkLabel(),
      linkHref: this.announcementLinkHref(),
      active: this.announcementActive(),
      backgroundColor: this.announcementBackgroundColor(),
      backgroundImage: this.announcementBackgroundImage(),
    };
    this.saving.set(true);
    this.cms.saveAnnouncement(value).subscribe({
      next: () => { this.saving.set(false); this.toast.success('Cambios guardados', 'El anuncio se actualizó en el backend.'); },
      error: () => { this.saving.set(false); this.toast.error('No pudimos guardar el anuncio', 'Inténtalo nuevamente.'); },
    });
  }

  selectPage(id: CmsPageDesignId | 'inicio'): void {
    this.selectedPageId.set(id);
    if (id === 'inicio') return;
    const design = this.cms.pages()[id];
    this.pageHeading.set(design.heading);
    this.pageDescription.set(design.description);
    this.pageBackgroundColor.set(design.backgroundColor);
    this.pageBackgroundImage.set(design.backgroundImage);
  }

  setPageBackgroundColor(color: string): void {
    this.pageBackgroundColor.set(color);
  }

  onPageImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.toast.error('Archivo no válido', 'Selecciona una imagen JPG, PNG, WebP o SVG.');
      input.value = '';
      return;
    }
    if (file.size > 1024 * 1024) {
      this.toast.error('Imagen demasiado grande', 'La imagen debe pesar como máximo 1 MB.');
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.pageBackgroundImage.set(reader.result as string);
      input.value = '';
    };
    reader.readAsDataURL(file);
  }

  savePageDesign(): void {
    const id = this.selectedPageId();
    if (this.saving() || id === 'inicio') return;
    const value: CmsPageDesign = {
      heading: this.pageHeading(),
      description: this.pageDescription(),
      backgroundColor: this.pageBackgroundColor(),
      backgroundImage: this.pageBackgroundImage(),
    };
    this.saving.set(true);
    this.cms.savePageDesign(id, value).subscribe({
      next: () => { this.saving.set(false); this.toast.success('Cambios guardados', 'La página se actualizó en el backend.'); },
      error: () => { this.saving.set(false); this.toast.error('No pudimos guardar la página', 'Inténtalo nuevamente.'); },
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
      next: () => { this.saving.set(false); this.toast.success('Cambios guardados', 'La pantalla de carga se actualizó en el backend.'); },
      error: () => { this.saving.set(false); this.toast.error('No pudimos guardar', 'Inténtalo nuevamente.'); },
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
    const value: CmsHeroAnimation = { enabled: this.heroAnimationEnabled(), videoUrl: this.heroAnimationVideoUrl() };
    this.saving.set(true);
    this.cms.saveHeroAnimation(value).subscribe({
      next: () => { this.saving.set(false); this.toast.success('Cambios guardados', 'La animación de inicio se actualizó en el backend.'); },
      error: () => { this.saving.set(false); this.toast.error('No pudimos guardar', 'Inténtalo nuevamente.'); },
    });
  }

  pickProgram(i: number): void {
    this.programSel.set(i);
    this.programDraft.set({ ...this.programItems()[i] });
  }

  addNewProgram(): void {
    this.programSel.set(-1);
    this.programDraft.set({ ...AdminContent.BLANK_PROGRAM, displayOrder: this.programItems().length + 1 });
  }

  setProgramDraftField(key: 'title' | 'description' | 'modality' | 'duration', value: string): void {
    this.programDraft.update((d) => ({ ...d, [key]: value }));
  }

  setProgramDraftColor(color: string): void {
    this.programDraft.update((d) => ({ ...d, accentColor: color }));
  }

  onProgramDraftImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.toast.error('Archivo no válido', 'Selecciona una imagen JPG, PNG, WebP o SVG.');
      input.value = '';
      return;
    }
    if (file.size > 1024 * 1024) {
      this.toast.error('Imagen demasiado grande', 'La imagen debe pesar como máximo 1 MB.');
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.programDraft.update((d) => ({ ...d, imageUrl: reader.result as string }));
      input.value = '';
    };
    reader.readAsDataURL(file);
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
    const request = isNew ? this.api.createTrainingProgram(payload) : this.api.updateTrainingProgram(value.id!, payload);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success('Cambios guardados', `"${payload.title}" se actualizó en el backend.`);
        this.loadProgramsTab();
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('No pudimos guardar', 'El backend rechazó el cambio. Revisa los campos e inténtalo otra vez.');
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
    this.api.trainingProgramsAll().subscribe({
      next: (items) => {
        this.programItems.set(items);
        this.programSel.set(items.length ? 0 : -1);
        this.programDraft.set({ ...(items[0] ?? AdminContent.BLANK_PROGRAM) });
      },
      error: () => this.toast.error('No pudimos cargar los programas', 'Verifica tu sesión y la conexión con el backend.'),
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
    this.courseDraft.set({ ...AdminContent.BLANK_COURSE, displayOrder: this.courseItems().length + 1, materials: [], syllabus: [], reviews: [] });
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

  onCourseDraftImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.toast.error('Archivo no válido', 'Selecciona una imagen JPG, PNG, WebP o SVG.');
      input.value = '';
      return;
    }
    if (file.size > 1024 * 1024) {
      this.toast.error('Imagen demasiado grande', 'La imagen debe pesar como máximo 1 MB.');
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.courseDraft.update((d) => ({ ...d, imageUrl: reader.result as string }));
      input.value = '';
    };
    reader.readAsDataURL(file);
  }

  clearCourseDraftImage(): void {
    this.courseDraft.update((d) => ({ ...d, imageUrl: '' }));
  }

  addMaterialRow(): void {
    this.courseDraft.update((d) => ({
      ...d,
      materials: [...(d.materials ?? []), { title: '', type: 'archivo', url: '', displayOrder: d.materials?.length ?? 0 }],
    }));
  }

  removeMaterialRow(i: number): void {
    this.courseDraft.update((d) => ({ ...d, materials: (d.materials ?? []).filter((_, idx) => idx !== i) }));
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
      syllabus: [...(d.syllabus ?? []), { title: '', description: '', displayOrder: d.syllabus?.length ?? 0 }],
    }));
  }

  removeSyllabusRow(i: number): void {
    this.courseDraft.update((d) => ({ ...d, syllabus: (d.syllabus ?? []).filter((_, idx) => idx !== i) }));
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
      reviews: [...(d.reviews ?? []), { authorName: '', rating: 5, body: '', displayOrder: d.reviews?.length ?? 0 }],
    }));
  }

  removeReviewRow(i: number): void {
    this.courseDraft.update((d) => ({ ...d, reviews: (d.reviews ?? []).filter((_, idx) => idx !== i) }));
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
    const request = isNew ? this.api.createCourse(payload) : this.api.updateCourse(value.id!, payload);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success('Cambios guardados', `"${payload.title}" se actualizó en el backend.`);
        this.loadCoursesTab();
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('No pudimos guardar', 'El backend rechazó el cambio. Revisa los campos e inténtalo otra vez.');
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
    this.api.coursesAll().subscribe({
      next: (items) => {
        this.courseItems.set(items);
        this.courseSel.set(items.length ? 0 : -1);
        this.courseDraft.set({ ...(items[0] ?? AdminContent.BLANK_COURSE) });
      },
      error: () => this.toast.error('No pudimos cargar los cursos', 'Verifica tu sesión y la conexión con el backend.'),
    });
  }

  setHeaderLink(i: number, key: keyof HeaderLink, value: string): void {
    this.headerLinks.update((links) => links.map((l, idx) => (idx === i ? { ...l, [key]: value } : l)));
  }

  headerLinkVariantLabel(variant: HeaderLink['variant']): string {
    if (variant === 'primary') return 'Botón relleno';
    if (variant === 'outline') return 'Botón contorno';
    return 'Enlace del menú';
  }

  setHeaderLinkVariant(i: number, label: string): void {
    const variant = label === 'Botón relleno' ? 'primary' : label === 'Botón contorno' ? 'outline' : '';
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
    this.cms.saveHeader({
      links: this.headerLinks().map((link) => ({ ...link, variant: link.variant ?? '' })),
      cta: this.headerCta(),
    }).subscribe({
      next: () => { this.saving.set(false); this.toast.success('Cambios guardados', 'El header se actualizó en el backend.'); },
      error: () => { this.saving.set(false); this.toast.error('No pudimos guardar el header', 'Inténtalo nuevamente.'); },
    });
  }

  setFooterColumn(i: number, key: keyof FooterColumn, value: string): void {
    this.footerColumns.update((cols) => cols.map((c, idx) => (idx === i ? { ...c, [key]: value } : c)));
  }

  removeFooterColumn(i: number): void {
    this.footerColumns.update((cols) => cols.filter((_, idx) => idx !== i));
  }

  addFooterColumn(): void {
    this.footerColumns.update((cols) => [...cols, { title: 'Nueva columna', links: 'Enlace 1\nEnlace 2' }]);
  }

  saveFooter(): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.cms.saveFooter({
      about: this.footerAbout(),
      email: this.footerEmail(),
      phone: this.footerPhone(),
      columns: this.footerColumns().map((column) => ({ ...column })),
    }).subscribe({
      next: () => { this.saving.set(false); this.toast.success('Cambios guardados', 'El footer se actualizó en el backend.'); },
      error: () => { this.saving.set(false); this.toast.error('No pudimos guardar el footer', 'Inténtalo nuevamente.'); },
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

    if (tab === 'anuncio') {
      const announcement = this.cms.announcement();
      this.announcementMessage.set(announcement.message);
      this.announcementLinkLabel.set(announcement.linkLabel);
      this.announcementLinkHref.set(announcement.linkHref);
      this.announcementActive.set(announcement.active);
      this.announcementBackgroundColor.set(announcement.backgroundColor);
      this.announcementBackgroundImage.set(announcement.backgroundImage);
      return;
    }

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
      const isReservedServicesLink = (link: HeaderLink) => link.label.trim().toLowerCase() === 'servicios' || link.href === '#servicios';
      this.headerLinks.set(header.links.filter((link) => !isReservedServicesLink(link)).map((link) => ({ ...link })));
      this.headerCta.set(header.cta);
      return;
    }

    if (tab === 'footer') {
      const footer = this.cms.footer();
      this.footerAbout.set(footer.about);
      this.footerEmail.set(footer.email);
      this.footerPhone.set(footer.phone);
      this.footerColumns.set(footer.columns.map((column) => ({ ...column })));
    }
  }
}
