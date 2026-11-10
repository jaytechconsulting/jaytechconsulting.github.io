import type { CmsContentState } from './cms.models';

export const DEFAULT_STATE: CmsContentState = {
  companies: [],
  reviews: [],
  services: [],
  projects: [],
  plans: [],
  teamMembers: [],
  sections: [
    {
      id: 'hero',
      name: 'Portada',
      eyebrow: 'Software a medida',
      title: 'Software que hace',
      highlight: 'crecer tu empresa',
      description: 'Del prototipo a producción, con comunicación cercana en cada paso.',
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
      description:
        'Empieza con lo justo y crece a tu ritmo. Cada plan incluye acompañamiento cercano.',
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
      description:
        'Respondemos en menos de 24 horas con una primera propuesta de alcance y presupuesto.',
      items:
        'Diagnóstico gratuito\nPresupuesto sin compromiso\nEquipo local, comunicación en español',
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
      description:
        'Cuéntanos qué necesitas. Te devolvemos una propuesta clara de alcance y presupuesto, sin compromiso.',
      backgroundColor: '',
      backgroundImage: '',
    },
    login: {
      heading: 'Tu trabajo, siempre a la vista',
      description:
        'Accede para gestionar proyectos, avances, tickets, facturas y archivos en un solo lugar.',
      backgroundColor: '',
      backgroundImage: '',
    },
    asesorias: {
      heading: 'Asesoría experta para tu próximo proyecto',
      description:
        'Sesiones y programas de acompañamiento técnico para que tu equipo tome mejores decisiones de software.',
      backgroundColor: '',
      backgroundImage: '',
    },
    capacitaciones: {
      heading: 'Capacitaciones para tu equipo',
      description:
        'Muy pronto: programas de formación práctica en desarrollo, automatización y datos.',
      backgroundColor: '',
      backgroundImage: '',
    },
    conocenos: {
      heading: 'El equipo detrás de cada proyecto',
      description:
        'Somos un equipo pequeño, directo y técnico — construimos software a medida sin intermediarios.',
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
    about:
      'Jaytech — software, páginas y automatizaciones a medida. Del prototipo a producción, con acompañamiento cercano en cada paso.',
    email: 'hola@dronlab.pe',
    phone: '+51 993 908 435',
    columns: [
      {
        title: 'Servicios',
        links: 'Aplicaciones web\nPáginas & landings\nAutomatizaciones\nIntegraciones / API',
      },
      { title: 'Empresa', links: 'Nosotros\nProyectos\nBlog\nContacto' },
      { title: 'Recursos', links: 'Soporte\nEstado\nTérminos\nPrivacidad' },
    ],
  },
};

export function cloneState(): CmsContentState {
  return structuredClone(DEFAULT_STATE);
}

/** Empty content while the CMS is loading; structural section IDs stay available. */
export function emptyState(): CmsContentState {
  const state = cloneState();
  state.companies = [];
  state.reviews = [];
  state.services = [];
  state.projects = [];
  state.plans = [];
  state.teamMembers = [];
  state.sections = state.sections.map((section) => ({
    ...section,
    eyebrow: '',
    title: '',
    highlight: '',
    description: '',
    items: '',
    image: '',
  }));
  for (const page of Object.values(state.pages)) {
    page.heading = '';
    page.description = '';
    page.backgroundColor = '';
    page.backgroundImage = '';
  }
  state.header = { links: [], cta: '' };
  state.footer = { about: '', email: '', phone: '', columns: [] };
  state.heroAnimation = { enabled: false, videoUrl: '' };
  return state;
}
