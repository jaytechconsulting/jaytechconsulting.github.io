export const HOME_SECTIONS = [
  { id: 'services', label: 'Servicios' },
  { id: 'courses', label: 'Cursos destacados' },
  { id: 'clients', label: 'Clientes' },
  { id: 'reviews', label: 'Reseñas' },
  { id: 'faq', label: 'Preguntas frecuentes' },
] as const;
export type HomeSection = (typeof HOME_SECTIONS)[number];
