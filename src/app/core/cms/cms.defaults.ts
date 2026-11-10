import type { CmsContentState } from './cms.models';

export const DEFAULT_STATE: CmsContentState = {
  socialLinks: [],
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
    'terminos-y-condiciones': {
      heading: 'Términos y condiciones',
      description: 'Condiciones de uso del sitio, contratación de servicios y compra de cursos.',
      content: `Este texto es referencial. Las condiciones de cada servicio se detallan en la propuesta aceptada o en la información de compra que se presenta antes de pagar.

## Servicios y cotizaciones
Jaytech ofrece desarrollo de software y aplicaciones web, diseño de sitios, automatizaciones, integraciones, asesorías y capacitaciones. Solicitar una propuesta permite evaluar tu necesidad. Antes de contratar, revisa el alcance, los entregables, el precio, los plazos y los costos de terceros que figuren en la propuesta.

## Ejecución de proyectos
Para iniciar el trabajo se acuerdan los accesos, materiales y aprobaciones que debe facilitar cada parte. Los cambios de alcance se cotizan y se acuerdan por escrito. Las condiciones de entrega, soporte, mantenimiento y uso del código se detallan en la propuesta o el contrato.

## Cursos y capacitaciones
Antes de inscribirte o pagar, revisa el temario, modalidad, precio, requisitos y condiciones de acceso indicados para cada actividad. Las solicitudes de reprogramación, cancelación o devolución se atienden según las condiciones informadas para la compra y la normativa aplicable.

## Cuenta y soporte
Mantén tus credenciales bajo resguardo y utiliza el portal solo para las operaciones autorizadas. Si tienes acceso al portal de clientes, puedes abrir un ticket para consultar sobre un proyecto o solicitar soporte.

## Consultas y reclamos
Usa los canales publicados en el pie de página para consultas comerciales o de soporte. Para reclamos, utiliza el Libro de Reclamaciones cuando corresponda. Se respetan los derechos reconocidos por la normativa peruana aplicable, incluido el Código de Protección y Defensa del Consumidor.`,
      backgroundColor: '',
      backgroundImage: '',
    },
    'avisos-legales': {
      heading: 'Avisos legales',
      description: 'Información sobre Jaytech, privacidad, cookies y atención de solicitudes.',
      content: `Este aviso es referencial. Jaytech presenta en este sitio sus servicios de desarrollo, automatización, asesoría y capacitación. Puedes contactar al equipo mediante los canales indicados en el pie de página.

## Contenido y propiedad intelectual
Los textos, diseños, marcas y materiales del sitio pertenecen a sus respectivos titulares. Para reproducirlos o redistribuirlos, verifica los permisos aplicables. Las condiciones de uso de los entregables de un proyecto y de los materiales de cursos se establecen en la propuesta o en las condiciones de compra.

## Portafolio y enlaces externos
Los proyectos publicados describen trabajos concretos. El alcance y los resultados dependen de las necesidades de cada cliente. Los enlaces a redes sociales, servicios de pago u otras plataformas llevan a sitios administrados por terceros, con sus propias condiciones.

## Formularios y portal de clientes
Al enviar un formulario puedes proporcionar tu nombre, correo, teléfono y detalles de tu proyecto. Usamos esa información para responder, preparar propuestas y dar seguimiento a tus solicitudes. El portal permite gestionar consultas y soporte. Evita incluir contraseñas o datos de tarjetas en formularios o tickets.

## Cookies y analítica
El sitio utiliza cookies necesarias para la sesión y la seguridad. Si aceptas la analítica, Google Tag Manager carga la configuración de Google Analytics para medir visitas. Puedes cambiar tu decisión desde el botón Cookies. El inicio de sesión funciona aunque rechaces la analítica.

## Contacto por WhatsApp
Si eliges escribirnos por WhatsApp, usamos tu número y los mensajes que compartas para atender tu consulta. WhatsApp aplica sus propias condiciones y política de privacidad.

## Proveedores y pagos
El sitio se apoya en servicios de alojamiento y, según la operación, en plataformas de mensajería, analítica o pago. Si una compra se procesa mediante una pasarela, esta puede solicitar los datos necesarios para autorizar la transacción. Consulta la información de privacidad del proveedor que se muestre durante la compra.

## Conservación de datos
El periodo de conservación depende de la finalidad de la información, del servicio contratado y de las obligaciones aplicables. Los datos de una consulta sirven para responderla y darle seguimiento. Los registros de una compra pueden estar sujetos a obligaciones adicionales.

## Derechos sobre tus datos
Conforme a la Ley N.º 29733 y su Reglamento, aprobado por el Decreto Supremo N.º 016-2024-JUS, puedes solicitar información sobre el tratamiento de tus datos y ejercer los derechos de acceso, rectificación, cancelación y oposición, según corresponda. También puedes retirar tu consentimiento cuando sea la base del tratamiento. Usa los canales del pie de página e indica qué solicitud deseas presentar.

## Cancelaciones y devoluciones
Si necesitas cancelar una compra o solicitar una devolución, contacta al equipo con la referencia de la operación y el motivo de tu solicitud. Se revisarán las condiciones informadas al contratar y los derechos que correspondan. Cuando proceda una devolución, se te informará el medio y el plazo estimado.

## Actualizaciones del aviso
Puedes consultar la versión vigente de este aviso en esta página.`,
      backgroundColor: '',
      backgroundImage: '',
    },
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
