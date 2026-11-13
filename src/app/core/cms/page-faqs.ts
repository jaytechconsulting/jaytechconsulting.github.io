import type { HomeFaq } from './home-faqs';
import type { CmsPageDesignId } from './cms.models';

/** Pages that end with a list of frequent questions. */
export type FaqPageId = 'asesorias' | 'capacitaciones' | 'conocenos';

export function isFaqPage(id: CmsPageDesignId): id is FaqPageId {
  return id === 'asesorias' || id === 'capacitaciones' || id === 'conocenos';
}

/** Built-in questions of each page, shown until the page's own list is saved in the CMS. */
export const PAGE_FAQS: Record<FaqPageId, HomeFaq[]> = {
  asesorias: [
    {
      question: '¿Cómo funciona una sesión de asesoría?',
      answer:
        'Partimos de tu caso real: revisamos lo que tienes, identificamos el cuello de botella y salimos con un plan de acción concreto, no solo teoría.',
    },
    {
      question: '¿Necesito conocimientos técnicos previos?',
      answer:
        'No es obligatorio. Adaptamos el nivel de la sesión según quién participe — desde fundadores no técnicos hasta equipos de desarrollo.',
    },
    {
      question: '¿Las asesorías son presenciales o remotas?',
      answer:
        'Son remotas por videollamada, lo que nos permite agendar rápido y grabar la sesión para que la revises cuando quieras.',
    },
    {
      question: '¿Puedo combinar la asesoría con un proyecto que ya tengo en desarrollo?',
      answer:
        'Sí, de hecho es uno de los casos más comunes: revisamos arquitectura, decisiones técnicas o procesos de un proyecto ya iniciado.',
    },
    {
      question: '¿Qué pasa si necesito más de una sesión?',
      answer:
        'Podemos armar un programa de acompañamiento con varias sesiones espaciadas en el tiempo, según el alcance que definamos juntos.',
    },
  ],
  capacitaciones: [
    {
      question: '¿Las capacitaciones son para todo mi equipo o solo para algunas personas?',
      answer:
        'Se adaptan a lo que necesites: desde una sesión para un par de personas clave hasta un programa para toda el área.',
    },
    {
      question: '¿Puedo pedir un programa a medida para mi empresa?',
      answer:
        'Sí, de hecho es lo más común. Partimos de tus procesos y herramientas reales, no de un temario genérico.',
    },
    {
      question: '¿Entregan algún material de referencia?',
      answer:
        'Siempre dejamos una guía resumen y, cuando aplica, las plantillas o flujos que construimos durante la sesión.',
    },
    {
      question: '¿Cuántas personas pueden participar por sesión?',
      answer:
        'Funciona bien con grupos de hasta 12 personas para mantener la sesión práctica. Si tu equipo es más grande, lo dividimos en cohortes.',
    },
    {
      question: '¿Las capacitaciones son remotas o presenciales?',
      answer:
        'Ambas opciones existen según el programa — lo coordinamos contigo al momento de armar la propuesta.',
    },
  ],
  conocenos: [
    {
      question: '¿Por qué elegir Jaytech en lugar de un freelancer o una agencia grande?',
      answer:
        'Con un freelancer dependes de una sola persona; con una agencia grande hablas con gestores, no con quien programa. Con nosotros tienes la cercanía de un freelancer y la solidez de un equipo real.',
    },
    {
      question: '¿Cómo garantizan la calidad del código?',
      answer:
        'Revisamos la arquitectura antes de construir, seguimos buenas prácticas del stack elegido y documentamos las decisiones clave, para que el proyecto sea mantenible por cualquier equipo, no solo por nosotros.',
    },
    {
      question: '¿Qué pasa si necesito cambios después de la entrega?',
      answer:
        'Es parte del trabajo. Ofrecemos soporte y mejoras continuas después del lanzamiento — no desaparecemos cuando el proyecto sale a producción.',
    },
    {
      question: '¿Trabajan con empresas de cualquier tamaño?',
      answer:
        'Sí. Hemos trabajado con negocios que recién digitalizan su operación y con empresas que ya tienen sistemas en producción y necesitan integrarlos o escalarlos.',
    },
    {
      question: '¿Cómo empiezo a trabajar con ustedes?',
      answer:
        'Cuéntanos tu proyecto en el formulario de "Solicitar propuesta" — respondemos en menos de 24 horas con una primera idea de alcance y presupuesto.',
    },
  ],
};

/** Reads the list stored with a page. Undefined means "never saved": the built-in list applies. */
export function readPageFaqs(value: unknown): HomeFaq[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter(
    (entry): entry is HomeFaq =>
      typeof entry?.question === 'string' && typeof entry?.answer === 'string',
  );
}
