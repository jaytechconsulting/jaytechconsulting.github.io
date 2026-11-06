import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, forkJoin, map, switchMap, tap } from 'rxjs';
import { ApiService } from './api.service';
import type { ApiCms, ApiCompany, ApiPlan, ApiProject, ApiReview, ApiServiceItem, ApiSiteContent, ApiTeamMember } from './models/api.models';

export interface CmsCompany {
  id?: string;
  name: string;
  sector: string;
  result: string;
  logo: string;
  glyph: string;
  color: string;
  isPublished?: string;
  displayOrder?: string;
}

export interface CmsReview {
  id?: string;
  name: string;
  role: string;
  company: string;
  quote: string;
  rating: string;
  photo: string;
  color: string;
  status?: string;
  displayOrder?: string;
}

export interface CmsServiceItem {
  id?: string;
  title: string;
  body: string;
  image: string;
  glyph: string;
  color: string;
  isPublished?: string;
  displayOrder?: string;
}

export interface CmsProjectItem {
  id?: string;
  slug?: string;
  title: string;
  client: string;
  cat: string;
  year: string;
  metric: string;
  logo: string;
  summary: string;
  challenge: string;
  solution: string;
  color: string;
  progress?: string;
  status?: string;
  tags?: string;
  isPublished?: string;
  displayOrder?: string;
}

export interface CmsPlan {
  id?: string;
  name: string;
  price: string;
  description: string;
  features: string;
  featured: string;
  cta: string;
  image: string;
  isPublished?: string;
  displayOrder?: string;
}

export interface CmsTeamMember {
  id?: string;
  name: string;
  role: string;
  bio: string;
  photo: string;
  linkedin: string;
  color: string;
  isPublished?: string;
  displayOrder?: string;
}

export type CmsSectionId = 'hero' | 'clients' | 'services' | 'pricing' | 'reviews' | 'contact';

export interface CmsPageSection {
  id: CmsSectionId;
  name: string;
  eyebrow: string;
  title: string;
  highlight: string;
  description: string;
  items: string;
  image: string;
}

export type CmsHeaderLinkVariant = '' | 'primary' | 'outline';

export interface CmsHeaderLink {
  label: string;
  href: string;
  variant: CmsHeaderLinkVariant;
}

export interface CmsFooterColumn {
  title: string;
  links: string;
}

export interface CmsAnnouncement {
  message: string;
  linkLabel: string;
  linkHref: string;
  active: boolean;
  backgroundColor: string;
  backgroundImage: string;
}

export type CmsPageDesignId = 'proyectos' | 'propuesta' | 'login' | 'asesorias' | 'capacitaciones' | 'conocenos';

export interface CmsPageDesign {
  heading: string;
  description: string;
  backgroundColor: string;
  backgroundImage: string;
}

export interface CmsLoaderConfig {
  enabled: boolean;
  color: string;
}

export interface CmsHeroAnimation {
  enabled: boolean;
  videoUrl: string;
}

export interface CmsContentState {
  companies: CmsCompany[];
  reviews: CmsReview[];
  services: CmsServiceItem[];
  projects: CmsProjectItem[];
  plans: CmsPlan[];
  teamMembers: CmsTeamMember[];
  sections: CmsPageSection[];
  announcement: CmsAnnouncement;
  pages: Record<CmsPageDesignId, CmsPageDesign>;
  loader: CmsLoaderConfig;
  heroAnimation: CmsHeroAnimation;
  header: {
    links: CmsHeaderLink[];
    cta: string;
  };
  footer: {
    about: string;
    email: string;
    phone: string;
    columns: CmsFooterColumn[];
  };
}

const DEFAULT_STATE: CmsContentState = {
  companies: [
    { name: 'Comercial Andina', sector: 'Retail', result: '−40% tiempo de conteo', logo: '', glyph: '◧', color: '#FF6B35' },
    { name: 'Estudio Vega', sector: 'Legal', result: '8 h/sem ahorradas', logo: '', glyph: '⬡', color: '#22D3EE' },
    { name: 'Nova Fitness', sector: 'Fitness', result: '+3.2× conversión', logo: '', glyph: '▲', color: '#F7C948' },
    { name: 'MercadoSur', sector: 'E-commerce', result: '99.9% uptime', logo: '', glyph: '⬢', color: '#22D3EE' },
    { name: 'Grupo Delta', sector: 'Servicios', result: '1.2k usuarios activos', logo: '', glyph: '◨', color: '#FF6B35' },
    { name: 'Clínica Sur', sector: 'Salud', result: '+65% citas confirmadas', logo: '', glyph: '◇', color: '#7DE8F7' },
  ],
  reviews: [
    {
      name: 'María Fernández',
      role: 'Gerente de operaciones',
      company: 'Comercial Andina',
      quote:
        'El panel de inventario nos cambió la operación por completo. Redujimos el tiempo de conteo casi a la mitad y ahora tomamos decisiones con datos en tiempo real, no con corazonadas.',
      rating: '5',
      photo: '',
      color: '#FF6B35',
    },
    {
      name: 'Diego Vega',
      role: 'Fundador',
      company: 'Estudio Vega',
      quote: 'Automatizaron toda nuestra facturación conectándola con la SUNAT. Recuperamos 8 horas a la semana que antes eran puro trabajo manual y errores.',
      rating: '5',
      photo: '',
      color: '#22D3EE',
    },
    {
      name: 'Ana Rojas',
      role: 'Marketing lead',
      company: 'Nova Fitness',
      quote: 'La landing de campaña triplicó nuestras conversiones. Comunicación clara, entregas a tiempo y un equipo que de verdad entiende de negocio.',
      rating: '5',
      photo: '',
      color: '#F7C948',
    },
    {
      name: 'Luis Paredes',
      role: 'CTO',
      company: 'MercadoSur',
      quote: 'Integraron tres pasarelas de pago en un checkout único y estable. Cero caídas en campaña alta.',
      rating: '5',
      photo: '',
      color: '#7DE8F7',
    },
  ],
  services: [
    { title: 'Aplicaciones web', body: 'Plataformas y paneles a medida, del MVP a producción, con la escala que tu operación necesita.', image: '', glyph: '◆', color: '#FF6B35' },
    { title: 'Páginas & landings', body: 'Sitios rápidos y bien posicionados que convierten visitas en clientes.', image: '', glyph: '▲', color: '#22D3EE' },
    { title: 'Automatizaciones', body: 'Conectamos tus herramientas y eliminamos el trabajo manual repetitivo.', image: '', glyph: '⬡', color: '#F7C948' },
    { title: 'Integraciones / API', body: 'Unimos tus sistemas: pagos, CRMs, ERPs y servicios de terceros.', image: '', glyph: '⬢', color: '#7C6FF0' },
  ],
  projects: [
    {
      title: 'Panel de inventario',
      client: 'Comercial Andina',
      cat: 'Web',
      year: '2026',
      metric: '−40% tiempo de conteo',
      logo: '',
      summary: 'Control de stock en tiempo real con alertas y reportes.',
      challenge: 'El conteo mensual tomaba 3 días de trabajo manual.',
      solution: 'Panel en tiempo real con roles e integración con POS.',
      color: '#FF6B35',
    },
    {
      title: 'Automatización de facturas',
      client: 'Estudio Vega',
      cat: 'Automatización',
      year: '2026',
      metric: '8 h/sem ahorradas',
      logo: '',
      summary: 'Emisión y envío de comprobantes conectando ventas con la SUNAT.',
      challenge: 'Cada factura se emitía a mano.',
      solution: 'Un flujo n8n que valida, emite y envía.',
      color: '#22D3EE',
    },
  ],
  plans: [
    {
      name: 'Emprende',
      price: 'S/ 1,200',
      description: 'Para lanzar tu presencia digital.',
      features: 'Landing page a medida\nFormulario de contacto\nHosting 1 año incluido\n2 rondas de ajustes',
      featured: 'No',
      cta: 'Empezar',
      image: '',
    },
    {
      name: 'Crece',
      price: 'S/ 3,500',
      description: 'Aplicación web completa a medida.',
      features: 'App web a medida\nPanel de administración\nIntegraciones / API\nSoporte prioritario 6 meses',
      featured: 'Sí',
      cta: 'Agendar llamada',
      image: '',
    },
    {
      name: 'A medida',
      price: 'Custom',
      description: 'Proyectos complejos y automatización.',
      features: 'Alcance definido contigo\nAutomatizaciones de procesos\nEquipo dedicado\nSLA garantizado',
      featured: 'No',
      cta: 'Contáctanos',
      image: '',
    },
  ],
  teamMembers: [
    { name: 'Jayro Guerreros', role: 'Fundador · Ingeniería', bio: 'Lidera la arquitectura técnica y el desarrollo de cada proyecto, de principio a fin.', photo: '', linkedin: '', color: '#FF6B35' },
    { name: 'Valeria Soto', role: 'Diseño de producto', bio: 'Convierte requerimientos complejos en interfaces simples que los equipos realmente usan.', photo: '', linkedin: '', color: '#22D3EE' },
    { name: 'Marco Huamán', role: 'Automatización & datos', bio: 'Diseña los flujos e integraciones que eliminan el trabajo manual repetitivo.', photo: '', linkedin: '', color: '#F7C948' },
  ],
  sections: [
    {
      id: 'hero',
      name: 'Portada',
      eyebrow: 'Soluciones informáticas a medida',
      title: 'Software que hace',
      highlight: 'crecer tu empresa',
      description: 'Diseñamos y construimos aplicaciones web, páginas y automatizaciones. Del prototipo a producción, con comunicación cercana en cada paso.',
      items: 'React\nNode.js\nPython\nPostgreSQL\nn8n\nAWS',
      image: '',
    },
    {
      id: 'clients',
      name: 'Clientes',
      eyebrow: 'Confían en nosotros',
      title: 'Empresas que crecieron con nosotros',
      highlight: '',
      description: '',
      items: '+40 | proyectos\n12 | sectores\n98% | repiten',
      image: '',
    },
    {
      id: 'services',
      name: 'Qué hacemos',
      eyebrow: 'Qué hacemos',
      title: 'Un socio tecnológico, no solo un proveedor',
      highlight: '',
      description: '',
      items: '',
      image: '',
    },
    {
      id: 'pricing',
      name: 'Planes',
      eyebrow: 'Planes',
      title: 'Precios claros, sin sorpresas',
      highlight: '',
      description: 'Empieza con lo justo y crece a tu ritmo. Cada plan incluye acompañamiento cercano.',
      items: '',
      image: '',
    },
    {
      id: 'reviews',
      name: 'Reseñas',
      eyebrow: 'Reseñas',
      title: 'Clientes que recomiendan nuestro trabajo',
      highlight: '',
      description: '',
      items: '4.9 | basado en 40+ proyectos',
      image: '',
    },
    {
      id: 'contact',
      name: 'Contacto',
      eyebrow: 'Contacto',
      title: 'Cuéntanos tu idea. La convertimos en producto.',
      highlight: '',
      description: 'Respondemos en menos de 24 horas con una primera propuesta de alcance y presupuesto.',
      items: 'Diagnóstico gratuito\nPresupuesto sin compromiso\nEquipo local, comunicación en español',
      image: '',
    },
  ],
  announcement: {
    message: '',
    linkLabel: '',
    linkHref: '',
    active: false,
    backgroundColor: '',
    backgroundImage: '',
  },
  pages: {
    proyectos: {
      heading: 'Lo que hemos construido para empresas como la tuya',
      description: '',
      backgroundColor: '',
      backgroundImage: '',
    },
    propuesta: {
      heading: 'Tu idea, con precio y plazo en 24 horas',
      description: 'Cuéntanos qué necesitas. Te devolvemos una propuesta clara de alcance y presupuesto, sin compromiso.',
      backgroundColor: '',
      backgroundImage: '',
    },
    login: {
      heading: 'Tu trabajo, siempre a la vista',
      description: 'Accede para gestionar proyectos, avances, tickets, facturas y archivos en un solo lugar.',
      backgroundColor: '',
      backgroundImage: '',
    },
    asesorias: {
      heading: 'Asesoría experta para tu próximo proyecto',
      description: 'Sesiones y programas de acompañamiento técnico para que tu equipo tome mejores decisiones de software.',
      backgroundColor: '',
      backgroundImage: '',
    },
    capacitaciones: {
      heading: 'Capacitaciones para tu equipo',
      description: 'Muy pronto: programas de formación práctica en desarrollo, automatización y datos.',
      backgroundColor: '',
      backgroundImage: '',
    },
    conocenos: {
      heading: 'El equipo detrás de cada proyecto',
      description: 'Somos un equipo pequeño, directo y técnico — construimos software a medida sin intermediarios.',
      backgroundColor: '',
      backgroundImage: '',
    },
  },
  loader: {
    enabled: false,
    color: '',
  },
  heroAnimation: {
    enabled: true,
    videoUrl: '',
  },
  header: {
    links: [
      { label: 'Clientes', href: '#clientes', variant: '' },
      { label: 'Proyectos', href: '/proyectos', variant: '' },
      { label: 'Planes', href: '#planes', variant: '' },
    ],
    cta: 'Solicitar propuesta',
  },
  footer: {
    about: 'Jaytech — software, páginas y automatizaciones a medida. Del prototipo a producción, con acompañamiento cercano en cada paso.',
    email: 'hola@dronlab.pe',
    phone: '+51 993 908 435',
    columns: [
      { title: 'Servicios', links: 'Aplicaciones web\nPáginas & landings\nAutomatizaciones\nIntegraciones / API' },
      { title: 'Empresa', links: 'Nosotros\nProyectos\nBlog\nContacto' },
      { title: 'Recursos', links: 'Soporte\nEstado\nTérminos\nPrivacidad' },
    ],
  },
};

function cloneState(): CmsContentState {
  return structuredClone(DEFAULT_STATE);
}

export type CmsCollectionKey = 'companies' | 'reviews' | 'services' | 'projects' | 'plans' | 'sections' | 'teamMembers';
export type CmsEntityItem = Record<string, string>;

function text(value: string | null | undefined): string {
  return value ?? '';
}

function toHeaderLinkVariant(value: string | null | undefined): CmsHeaderLinkVariant {
  return value === 'primary' || value === 'outline' ? value : '';
}

function parseAnnouncementDetails(body: string): { linkLabel: string; linkHref: string; backgroundColor: string } {
  try {
    const parsed = JSON.parse(body || '{}') as Partial<{ linkLabel: string; linkHref: string; backgroundColor: string }>;
    return { linkLabel: parsed.linkLabel ?? '', linkHref: parsed.linkHref ?? '', backgroundColor: parsed.backgroundColor ?? '' };
  } catch {
    return { linkLabel: '', linkHref: '', backgroundColor: '' };
  }
}

function parsePageDesignDetails(body: string): { description: string; backgroundColor: string } {
  try {
    const parsed = JSON.parse(body || '{}') as Partial<{ description: string; backgroundColor: string }>;
    return { description: parsed.description ?? '', backgroundColor: parsed.backgroundColor ?? '' };
  } catch {
    return { description: '', backgroundColor: '' };
  }
}

function parseLoaderDetails(body: string): { color: string } {
  try {
    const parsed = JSON.parse(body || '{}') as Partial<{ color: string }>;
    return { color: parsed.color ?? '' };
  } catch {
    return { color: '' };
  }
}

function parseHeroAnimationDetails(body: string): { videoUrl: string } {
  try {
    const parsed = JSON.parse(body || '{}') as Partial<{ videoUrl: string }>;
    return { videoUrl: parsed.videoUrl ?? '' };
  } catch {
    return { videoUrl: '' };
  }
}

function slugify(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function toCompany(item: ApiCompany): CmsCompany {
  return { id: item.id, name: item.name, sector: text(item.sector), result: text(item.result), logo: text(item.logoUrl), glyph: text(item.glyph) || '◧', color: text(item.accentColor) || '#FF6B35', isPublished: String(item.isPublished), displayOrder: String(item.displayOrder) };
}

function toReview(item: ApiReview): CmsReview {
  return { id: item.id, name: item.authorName, role: text(item.role), company: text(item.companyName), quote: item.body, rating: String(item.rating), photo: text(item.photoUrl), color: text(item.accentColor) || '#FF6B35', status: String(item.status), displayOrder: String(item.displayOrder) };
}

function toService(item: ApiServiceItem): CmsServiceItem {
  return { id: item.id, title: item.title, body: item.body, image: '', glyph: text(item.glyph) || '◆', color: text(item.accentColor) || '#FF6B35', isPublished: String(item.isPublished), displayOrder: String(item.displayOrder) };
}

function toProject(item: ApiProject): CmsProjectItem {
  return { id: item.id, slug: item.slug, title: item.title, client: item.clientName, cat: item.category, year: String(item.year), metric: text(item.metric), logo: text(item.imageUrl), summary: item.description, challenge: text(item.challenge), solution: text(item.solution), color: text(item.accentColor) || '#FF6B35', progress: String(item.progress), status: item.status, tags: (item.tags ?? []).join('\n'), isPublished: String(item.isPublished ?? true), displayOrder: String(item.displayOrder ?? 0) };
}

function toPlan(item: ApiPlan): CmsPlan {
  return { id: item.id, name: item.name, price: item.price, description: item.description, features: (item.features ?? []).join('\n'), featured: item.isFeatured ? 'Sí' : 'No', cta: item.cta, image: '', isPublished: String(item.isPublished), displayOrder: String(item.displayOrder) };
}

function toTeamMember(item: ApiTeamMember): CmsTeamMember {
  return { id: item.id, name: item.name, role: item.role, bio: item.bio, photo: text(item.photoUrl), linkedin: text(item.linkedinUrl), color: text(item.accentColor) || '#FF6B35', isPublished: String(item.isPublished), displayOrder: String(item.displayOrder) };
}

function stateFromApi(cms: ApiCms, content: ApiSiteContent[]): CmsContentState {
  const defaults = cloneState();
  return {
    companies: (cms.companies ?? []).map(toCompany),
    reviews: (cms.reviews ?? []).map(toReview),
    services: (cms.services ?? []).map(toService),
    projects: (cms.projects ?? []).map(toProject),
    plans: (cms.plans ?? []).map(toPlan),
    teamMembers: (cms.teamMembers ?? []).map(toTeamMember),
    sections: defaults.sections.map((section) => {
      const stored = content.find((item) => item.key === `home.${section.id}`);
      return stored ? { ...section, title: stored.title || section.title, description: stored.body || section.description, image: text(stored.imageUrl) } : section;
    }),
    announcement: (() => {
      const stored = content.find((item) => item.key === 'site.announcement');
      if (!stored) return defaults.announcement;
      const details = parseAnnouncementDetails(stored.body);
      return {
        message: stored.title || '',
        linkLabel: details.linkLabel,
        linkHref: details.linkHref,
        backgroundColor: details.backgroundColor,
        backgroundImage: text(stored.imageUrl),
        active: stored.status === 1,
      };
    })(),
    pages: (() => {
      const ids: CmsPageDesignId[] = ['proyectos', 'propuesta', 'login', 'asesorias', 'capacitaciones', 'conocenos'];
      const result = {} as Record<CmsPageDesignId, CmsPageDesign>;
      for (const id of ids) {
        const stored = content.find((item) => item.key === `page.${id}`);
        if (!stored) {
          result[id] = defaults.pages[id];
          continue;
        }
        const details = parsePageDesignDetails(stored.body);
        result[id] = {
          heading: stored.title || defaults.pages[id].heading,
          description: details.description,
          backgroundColor: details.backgroundColor,
          backgroundImage: text(stored.imageUrl),
        };
      }
      return result;
    })(),
    loader: (() => {
      const stored = content.find((item) => item.key === 'site.loader');
      if (!stored) return defaults.loader;
      const details = parseLoaderDetails(stored.body);
      return { enabled: stored.status === 1, color: details.color };
    })(),
    heroAnimation: (() => {
      const stored = content.find((item) => item.key === 'home.heroAnimation');
      if (!stored) return defaults.heroAnimation;
      const details = parseHeroAnimationDetails(stored.body);
      return { enabled: stored.status === 1, videoUrl: details.videoUrl };
    })(),
    header: {
      cta: cms.header?.cta || defaults.header.cta,
      links: (cms.header?.links ?? defaults.header.links).map((link) => ({ label: link.label, href: link.href, variant: toHeaderLinkVariant(link.variant) })),
    },
    footer: {
      about: cms.footer?.about || defaults.footer.about,
      email: cms.footer?.email || defaults.footer.email,
      phone: cms.footer?.phone || defaults.footer.phone,
      columns: (cms.footer?.columns ?? []).map((column) => ({ title: column.title, links: (column.links ?? []).join('\n') })),
    },
  };
}

@Injectable({ providedIn: 'root' })
export class CmsContentService {
  private readonly api = inject(ApiService);
  private readonly state = signal<CmsContentState>({ ...cloneState(), companies: [], reviews: [], services: [], projects: [], plans: [], teamMembers: [] });

  readonly companies = computed(() => this.state().companies);
  readonly reviews = computed(() => this.state().reviews);
  readonly services = computed(() => this.state().services);
  readonly projects = computed(() => this.state().projects);
  readonly plans = computed(() => this.state().plans);
  readonly teamMembers = computed(() => this.state().teamMembers);
  readonly sections = computed(() => this.state().sections);
  readonly announcement = computed(() => this.state().announcement);
  readonly pages = computed(() => this.state().pages);
  readonly loader = computed(() => this.state().loader);
  readonly heroAnimation = computed(() => this.state().heroAnimation);
  readonly header = computed(() => this.state().header);
  readonly footer = computed(() => this.state().footer);

  constructor() {
    this.load(false).subscribe({ error: () => undefined });
  }

  load(includeUnpublished: boolean): Observable<CmsContentState> {
    return forkJoin({ cms: this.api.cms(includeUnpublished), content: this.api.siteContent(includeUnpublished) }).pipe(
      map(({ cms, content }) => stateFromApi(cms, content)),
      tap((state) => this.state.set(state)),
    );
  }

  section(id: CmsSectionId) {
    return computed(() => this.state().sections.find((section) => section.id === id) ?? DEFAULT_STATE.sections.find((section) => section.id === id)!);
  }

  saveCollection(key: CmsCollectionKey, item: CmsEntityItem, isNew: boolean, displayOrder: number): Observable<CmsContentState> {
    let request$: Observable<unknown>;
    const id = item['id'];
    switch (key) {
      case 'companies': {
        const input = { name: item['name'], sector: item['sector'], description: '', result: item['result'], logoUrl: item['logo'] || null, websiteUrl: null, glyph: item['glyph'], accentColor: item['color'], isPublished: item['isPublished'] !== 'false', displayOrder };
        request$ = isNew ? this.api.createCompany(input) : this.api.updateCompany(id, input);
        break;
      }
      case 'reviews': {
        const input = { authorName: item['name'], role: item['role'], companyName: item['company'], body: item['quote'], rating: Number(item['rating']) || 5, photoUrl: item['photo'] || null, accentColor: item['color'], status: Number(item['status'] ?? 1), displayOrder };
        request$ = isNew ? this.api.createReview(input) : this.api.updateReview(id, input);
        break;
      }
      case 'services': {
        const input = { title: item['title'], body: item['body'], glyph: item['glyph'], accentColor: item['color'], isPublished: item['isPublished'] !== 'false', displayOrder };
        request$ = isNew ? this.api.createService(input) : this.api.updateService(id, input);
        break;
      }
      case 'projects': {
        const input = { slug: item['slug'] || slugify(`${item['client']}-${item['title']}`), title: item['title'], clientName: item['client'], category: item['cat'], year: Number(item['year']) || new Date().getFullYear(), progress: Number(item['progress']) || 0, status: item['status'] || 'En desarrollo', description: item['summary'], metric: item['metric'], imageUrl: item['logo'] || null, challenge: item['challenge'], solution: item['solution'], accentColor: item['color'], tags: (item['tags'] || '').split('\n').map((tag) => tag.trim()).filter(Boolean), isPublished: item['isPublished'] !== 'false', displayOrder };
        request$ = isNew ? this.api.createProject(input) : this.api.updateProject(id, input);
        break;
      }
      case 'plans': {
        const input = { name: item['name'], price: item['price'], description: item['description'], features: (item['features'] || '').split('\n').map((feature) => feature.trim()).filter(Boolean), isFeatured: item['featured'] === 'Sí', cta: item['cta'], isPublished: item['isPublished'] !== 'false', displayOrder };
        request$ = isNew ? this.api.createPlan(input) : this.api.updatePlan(id, input);
        break;
      }
      case 'sections': {
        const contentKey = `home.${item['id']}`;
        request$ = this.api.updateSiteContent(contentKey, { key: contentKey, title: item['title'], body: item['description'], imageUrl: item['image'] || null, status: 1 });
        break;
      }
      case 'teamMembers': {
        const input = { name: item['name'], role: item['role'], bio: item['bio'], photoUrl: item['photo'] || null, linkedinUrl: item['linkedin'] || null, accentColor: item['color'], isPublished: item['isPublished'] !== 'false', displayOrder };
        request$ = isNew ? this.api.createTeamMember(input) : this.api.updateTeamMember(id, input);
        break;
      }
    }
    return request$.pipe(switchMap(() => this.load(true)));
  }

  deleteCollection(key: Exclude<CmsCollectionKey, 'sections'>, id: string): Observable<CmsContentState> {
    const requests: Record<Exclude<CmsCollectionKey, 'sections'>, () => Observable<unknown>> = {
      companies: () => this.api.deleteCompany(id),
      reviews: () => this.api.deleteReview(id),
      services: () => this.api.deleteService(id),
      projects: () => this.api.deleteProject(id),
      plans: () => this.api.deletePlan(id),
      teamMembers: () => this.api.deleteTeamMember(id),
    };
    return requests[key]().pipe(switchMap(() => this.load(true)));
  }

  saveHeader(value: CmsContentState['header']): Observable<CmsContentState> {
    return this.api.updateHeader(value).pipe(switchMap(() => this.load(true)));
  }

  saveFooter(value: CmsContentState['footer']): Observable<CmsContentState> {
    const input = { ...value, columns: value.columns.map((column) => ({ title: column.title, links: column.links.split('\n').map((link) => link.trim()).filter(Boolean) })) };
    return this.api.updateFooter(input).pipe(switchMap(() => this.load(true)));
  }

  saveAnnouncement(value: CmsAnnouncement): Observable<CmsContentState> {
    const details = JSON.stringify({ linkLabel: value.linkLabel, linkHref: value.linkHref, backgroundColor: value.backgroundColor });
    const input = { key: 'site.announcement', title: value.message, body: details, imageUrl: value.backgroundImage || null, status: value.active ? 1 : 0 };
    return this.api.updateSiteContent('site.announcement', input).pipe(switchMap(() => this.load(true)));
  }

  savePageDesign(id: CmsPageDesignId, value: CmsPageDesign): Observable<CmsContentState> {
    const key = `page.${id}`;
    const details = JSON.stringify({ description: value.description, backgroundColor: value.backgroundColor });
    const input = { key, title: value.heading, body: details, imageUrl: value.backgroundImage || null, status: 1 };
    return this.api.updateSiteContent(key, input).pipe(switchMap(() => this.load(true)));
  }

  saveLoaderConfig(value: CmsLoaderConfig): Observable<CmsContentState> {
    const details = JSON.stringify({ color: value.color });
    const input = { key: 'site.loader', title: '', body: details, imageUrl: null, status: value.enabled ? 1 : 0 };
    return this.api.updateSiteContent('site.loader', input).pipe(switchMap(() => this.load(true)));
  }

  saveHeroAnimation(value: CmsHeroAnimation): Observable<CmsContentState> {
    const details = JSON.stringify({ videoUrl: value.videoUrl });
    const input = { key: 'home.heroAnimation', title: '', body: details, imageUrl: null, status: value.enabled ? 1 : 0 };
    return this.api.updateSiteContent('home.heroAnimation', input).pipe(switchMap(() => this.load(true)));
  }

}
