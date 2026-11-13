import type { HeaderLink } from '../../../ui/navigation/header/header';
import type {
  CmsContentState,
  CmsEntityItem,
  CmsFooterColumn as FooterColumn,
  CmsPageDesignId,
} from '../../../core/cms/cms.models';

export type FieldType = 'text' | 'textarea' | 'select' | 'color' | 'glyph' | 'image';

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: string[];
  shape?: 'rect' | 'circle';
  hint?: string;
}

export type EntityItem = CmsEntityItem;

export interface EntityDef {
  collectionKey: keyof Pick<
    CmsContentState,
    'companies' | 'reviews' | 'services' | 'projects' | 'plans' | 'sections' | 'teamMembers'
  >;
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

export const PALETTE = ['#FF6B35', '#22D3EE', '#F7C948', '#7C6FF0', '#1F8A5B'];
export const GLYPHS = ['◧', '⬡', '▲', '⬢', '◨', '◇'];

export const ENTITIES: Record<string, EntityDef> = {
  secciones: {
    collectionKey: 'sections',
    label: 'Secciones',
    icon: '▥',
    title: 'Secciones de Inicio',
    addLabel: 'sección',
    imageKey: 'image',
    fixed: true,
    blank: {},
    fields: [
      { key: 'eyebrow', label: 'Etiqueta sobre el título', type: 'text' },
      { key: 'highlight', label: 'Texto destacado del título', type: 'text' },
      {
        key: 'image',
        label: 'Imagen de la sección',
        type: 'image',
        shape: 'rect',
        hint: 'JPG, PNG, WebP o SVG. Máximo 1 MB.',
      },
      {
        key: 'title',
        label: 'Título principal',
        type: 'textarea',
        placeholder: 'Un socio tecnológico',
      },
      {
        key: 'description',
        label: 'Descripción',
        type: 'textarea',
        placeholder: 'Texto de apoyo de la sección.',
      },
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
      {
        key: 'logo',
        label: 'Logo de la empresa',
        type: 'image',
        shape: 'rect',
        hint: 'WebP, PNG, JPG, SVG, GIF y AVIF. Máximo 1 MB.',
      },
      // Sector, result and accent colour are no longer shown on the site, so they are not asked
      // for; the values already stored are kept.
      { key: 'glyph', label: 'Ícono (si no hay logo)', type: 'glyph' },
      { key: 'name', label: 'Nombre', type: 'text', placeholder: 'Comercial Andina' },
    ],
    seed: [
      {
        name: 'Comercial Andina',
        sector: 'Retail',
        result: '−40% tiempo de conteo',
        logo: '',
        color: '#FF6B35',
      },
      {
        name: 'Estudio Vega',
        sector: 'Legal',
        result: '8 h/sem ahorradas',
        logo: '',
        color: '#22D3EE',
      },
      {
        name: 'Nova Fitness',
        sector: 'Fitness',
        result: '+3.2× conversión',
        logo: '',
        color: '#F7C948',
      },
    ],
    rowTitle: (item) => item['name'] || 'Sin nombre',
    rowSub: (item) => item['sector'] ?? '',
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
      {
        key: 'photo',
        label: 'Foto de la persona',
        type: 'image',
        shape: 'circle',
        hint: 'Retrato cuadrado, se recorta en círculo',
      },
      { key: 'name', label: 'Nombre', type: 'text', placeholder: 'María Fernández' },
      { key: 'role', label: 'Cargo', type: 'text', placeholder: 'Gerente de operaciones' },
      { key: 'company', label: 'Empresa', type: 'text', placeholder: 'Comercial Andina' },
      { key: 'rating', label: 'Calificación', type: 'select', options: ['5', '4', '3', '2', '1'] },
      { key: 'color', label: 'Color de acento', type: 'color' },
      {
        key: 'quote',
        label: 'Reseña',
        type: 'textarea',
        placeholder: 'El panel nos cambió la operación…',
      },
    ],
    seed: [
      {
        name: 'María Fernández',
        role: 'Gerente de operaciones',
        company: 'Comercial Andina',
        quote: 'El panel de inventario nos cambió la operación por completo.',
        rating: '5',
        photo: '',
      },
      {
        name: 'Diego Vega',
        role: 'Fundador',
        company: 'Estudio Vega',
        quote: 'Automatizaron toda nuestra facturación. Recuperamos 8 horas a la semana.',
        rating: '5',
        photo: '',
      },
    ],
    rowTitle: (item) => item['name'] || 'Sin nombre',
    rowSub: (item) => item['company'],
  },
  servicios: {
    collectionKey: 'services',
    label: 'Soluciones',
    icon: '◆',
    title: 'Soluciones (servicios)',
    addLabel: 'servicio',
    glyphKey: 'glyph',
    blank: { title: '', body: '', glyph: '◆', color: '#FF6B35' },
    fields: [
      { key: 'glyph', label: 'Ícono', type: 'glyph' },
      { key: 'title', label: 'Título', type: 'text', placeholder: 'Aplicaciones web' },
      { key: 'color', label: 'Color de acento', type: 'color' },
      {
        key: 'body',
        label: 'Descripción',
        type: 'textarea',
        placeholder: 'Plataformas y paneles a medida…',
      },
    ],
    seed: [
      {
        title: 'Aplicaciones web',
        body: 'Plataformas y paneles a medida, del MVP a producción.',
        glyph: '◆',
        color: '#FF6B35',
      },
      {
        title: 'Páginas & landings',
        body: 'Sitios rápidos y bien posicionados que convierten.',
        glyph: '▲',
        color: '#22D3EE',
      },
      {
        title: 'Automatizaciones',
        body: 'Conectamos tus herramientas y eliminamos el trabajo manual.',
        glyph: '⬡',
        color: '#F7C948',
      },
      {
        title: 'Integraciones / API',
        body: 'Unimos tus sistemas: pagos, CRMs, ERPs y terceros.',
        glyph: '⬢',
        color: '#7C6FF0',
      },
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
    blank: {
      title: '',
      client: '',
      cat: 'Web',
      year: '2026',
      metric: '',
      logo: '',
      summary: '',
      challenge: '',
      solution: '',
      color: '#FF6B35',
    },
    fields: [
      {
        key: 'logo',
        label: 'Logo / imagen del proyecto',
        type: 'image',
        shape: 'rect',
        hint: 'Logo del cliente o captura',
      },
      { key: 'title', label: 'Título', type: 'text', placeholder: 'Panel de inventario' },
      { key: 'client', label: 'Cliente', type: 'text', placeholder: 'Comercial Andina' },
      {
        key: 'cat',
        label: 'Categoría',
        type: 'select',
        options: ['Web', 'Landing', 'Automatización', 'Integración'],
      },
      { key: 'year', label: 'Año', type: 'text', placeholder: '2026' },
      {
        key: 'metric',
        label: 'Métrica principal',
        type: 'text',
        placeholder: '−40% tiempo de conteo',
      },
      { key: 'color', label: 'Color de acento', type: 'color' },
      {
        key: 'summary',
        label: 'Resumen',
        type: 'textarea',
        placeholder: 'Reemplazamos las hojas de cálculo por…',
      },
      {
        key: 'challenge',
        label: 'El reto (detalle)',
        type: 'textarea',
        placeholder: 'El conteo mensual tomaba 3 días…',
      },
      {
        key: 'solution',
        label: 'La solución (detalle)',
        type: 'textarea',
        placeholder: 'Un panel en tiempo real con roles…',
      },
    ],
    seed: [
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
    rowTitle: (item) => item['title'] || 'Sin título',
    rowSub: (item) => `${item['client']} · ${item['cat']}`,
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
      {
        key: 'photo',
        label: 'Foto',
        type: 'image',
        shape: 'circle',
        hint: 'Retrato cuadrado, se recorta en círculo',
      },
      { key: 'name', label: 'Nombre', type: 'text', placeholder: 'Jayro Guerreros' },
      { key: 'role', label: 'Cargo', type: 'text', placeholder: 'Fundador · Ingeniería' },
      {
        key: 'linkedin',
        label: 'LinkedIn (opcional)',
        type: 'text',
        placeholder: 'https://linkedin.com/in/...',
      },
      { key: 'color', label: 'Color de acento', type: 'color' },
      {
        key: 'bio',
        label: 'Biografía corta',
        type: 'textarea',
        placeholder: 'Lidera la arquitectura técnica de cada proyecto.',
      },
    ],
    seed: [
      {
        name: 'Jayro Guerreros',
        role: 'Fundador · Ingeniería',
        bio: 'Lidera la arquitectura técnica y el desarrollo de cada proyecto, de principio a fin.',
        photo: '',
        linkedin: '',
        color: '#FF6B35',
      },
      {
        name: 'Valeria Soto',
        role: 'Diseño de producto',
        bio: 'Convierte requerimientos complejos en interfaces simples que los equipos realmente usan.',
        photo: '',
        linkedin: '',
        color: '#22D3EE',
      },
      {
        name: 'Marco Huamán',
        role: 'Automatización & datos',
        bio: 'Diseña los flujos e integraciones que eliminan el trabajo manual repetitivo.',
        photo: '',
        linkedin: '',
        color: '#F7C948',
      },
    ],
    rowTitle: (item) => item['name'] || 'Sin nombre',
    rowSub: (item) => item['role'],
  },
};

export const INITIAL_HEADER_LINKS: HeaderLink[] = [
  { label: 'Proyectos', href: '#proyectos' },
  { label: 'Nosotros', href: '#nosotros' },
];
export const INITIAL_HEADER_CTA = 'Solicitar propuesta';

export const INITIAL_FOOTER_ABOUT =
  'Software a medida que hace crecer tu empresa. Del prototipo a producción.';
export const INITIAL_FOOTER_EMAIL = 'jayroguerreros@gmail.com';
export const INITIAL_FOOTER_PHONE = '+51 993 908 435';
export const INITIAL_FOOTER_COLUMNS: FooterColumn[] = [
  { title: 'Producto', links: 'Servicios\nProyectos' },
  { title: 'Empresa', links: 'Nosotros\nContacto\nBlog' },
  { title: 'Legal', links: 'Términos\nPrivacidad' },
];

export const PAGE_LIST: {
  id: CmsPageDesignId;
  label: string;
  route: string;
}[] = [
  {
    id: 'terminos-y-condiciones',
    label: 'Términos y condiciones',
    route: '/terminos-y-condiciones',
  },
  { id: 'avisos-legales', label: 'Avisos legales', route: '/avisos-legales' },
  { id: 'proyectos', label: 'Proyectos', route: '/proyectos' },
  { id: 'propuesta', label: 'Solicitar propuesta', route: '/solicitar-propuesta' },
  { id: 'login', label: 'Iniciar sesión', route: '/login' },
  { id: 'asesorias', label: 'Asesorías', route: '/asesorias' },
  { id: 'capacitaciones', label: 'Capacitaciones', route: '/capacitaciones' },
  { id: 'conocenos', label: 'Conócenos', route: '/conocenos' },
];

/** Sub-página del panel admin: gestión de contenido web (empresas, reseñas, servicios, proyectos, planes, header, footer). No es una entrada del switch interno del panel — se navega como ruta aparte. */
