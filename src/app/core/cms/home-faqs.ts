export interface HomeFaq {
  question: string;
  answer: string;
}

/** Questions shown in the FAQ block of the home and published as FAQPage structured data. */
export const HOME_FAQS: HomeFaq[] = [
  {
    question: '¿Qué tipo de proyectos desarrollan?',
    answer:
      'Aplicaciones web y paneles a medida, páginas y landings, automatizaciones de procesos e integraciones entre sistemas (pagos, CRM, ERP y APIs de terceros).',
  },
  {
    question: '¿Cómo empiezo un proyecto con ustedes?',
    answer:
      'Completa el formulario de Solicitar propuesta contando qué necesitas. Evaluamos tu caso y te enviamos una propuesta con el alcance, los entregables, el precio y los plazos.',
  },
  {
    question: '¿Cuánto cuesta un proyecto?',
    answer:
      'Depende del alcance. Cada proyecto se cotiza a medida y el precio queda detallado en la propuesta antes de empezar, junto con los costos de terceros si los hubiera.',
  },
  {
    question: '¿Cuánto tiempo toma el desarrollo?',
    answer:
      'Varía según la complejidad. Los plazos de cada etapa se definen en la propuesta, y cualquier cambio de alcance se cotiza y se acuerda por escrito.',
  },
  {
    question: '¿Dan soporte después de la entrega?',
    answer:
      'Sí. Las condiciones de soporte y mantenimiento se detallan en la propuesta o el contrato, y los clientes con acceso al portal pueden abrir tickets para consultas y soporte.',
  },
  {
    question: '¿Cómo funcionan los cursos virtuales?',
    answer:
      'Son paquetes con videos, guías y archivos descargables. Se compran con un pago único y accedes al material desde tu cuenta para avanzar a tu ritmo.',
  },
  {
    question: '¿Ofrecen capacitaciones para equipos?',
    answer:
      'Sí. Armamos programas a medida, remotos o in-company, partiendo de los procesos y herramientas reales de tu empresa.',
  },
];

export function readHomeFaqs(raw: string): HomeFaq[] {
  try {
    const entries: unknown = JSON.parse(raw);
    if (!Array.isArray(entries)) return HOME_FAQS;
    return entries.filter((entry): entry is HomeFaq =>
      typeof entry?.question === 'string' && typeof entry?.answer === 'string');
  } catch {
    return HOME_FAQS;
  }
}
