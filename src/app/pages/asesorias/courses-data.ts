export interface Course {
  slug: string;
  title: string;
  level: string;
  duration: string;
  description: string;
  glyph: string;
  color: string;
}

export const COURSES: Course[] = [
  {
    slug: 'automatizacion-n8n',
    title: 'Automatización de procesos con n8n',
    level: 'Intermedio',
    duration: '4 semanas',
    description: 'Diseña flujos que conectan tus herramientas y eliminan tareas manuales repetitivas.',
    glyph: '⬡',
    color: '#FF6B35',
  },
  {
    slug: 'fundamentos-apis-rest',
    title: 'Fundamentos de APIs REST e integraciones',
    level: 'Básico',
    duration: '3 semanas',
    description: 'Aprende a diseñar, documentar y consumir APIs para conectar sistemas de forma confiable.',
    glyph: '⬢',
    color: '#22D3EE',
  },
  {
    slug: 'dashboards-datos-tiempo-real',
    title: 'Dashboards y datos en tiempo real',
    level: 'Intermedio',
    duration: '5 semanas',
    description: 'Construye paneles que muestren el estado de tu negocio al instante, sin hojas de cálculo.',
    glyph: '◆',
    color: '#F7C948',
  },
];
