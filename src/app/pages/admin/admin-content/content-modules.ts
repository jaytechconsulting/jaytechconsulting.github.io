/** Registry of implemented page views. Navigation labels, hierarchy and access come from the backend. */
export const CONTENT_MODULES = [
 { section:'secciones', label:'Secciones web', route:'/admin/secciones', path:'M3 3h18v18H3z M3 9h18 M9 9v12' },
 { section:'empresas', label:'Empresas', route:'/admin/empresas', path:'M4 21V3h12v18 M16 9h4v12 M8 7h4 M8 11h4 M8 15h4 M9 21v-3h2v3' },
 { section:'resenas', label:'Reseñas', route:'/admin/resenas', path:'m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z' },
 { section:'servicios', label:'Servicios', route:'/admin/servicios', path:'m12 3 9 5-9 5-9-5z M3 12l9 5 9-5 M3 16l9 5 9-5' },
 { section:'proyectos', label:'Portafolio web', route:'/admin/portafolio', path:'M3 6h18v15H3z M8 6V3h8v3 M3 12h18 M10 12v3h4v-3' },
 { section:'planes', label:'Planes', route:'/admin/planes', path:'M5 3h14v18H5z M8 7h8 M8 11h8 M8 15h4' },
 { section:'equipo', label:'Equipo', route:'/admin/equipo', path:'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M20 21v-2a7 7 0 0 0-7-7h-2a7 7 0 0 0-7 7v2' },
 { section:'anuncio', label:'Anuncios', route:'/admin/anuncios', path:'M3 10v4h5l12 5V5L8 10z M8 14l2 7h4l-2-5' },
 { section:'paginas', label:'Páginas', route:'/admin/paginas', path:'M7 3h10v18H7z M7 8h10 M9 12h6 M9 15h6' },
 { section:'programas', label:'Programas', route:'/admin/programas', path:'M4 5h16v10H4z M8 19h8 M10 15v4 M14 15v4' },
 { section:'carga', label:'Carga', route:'/admin/carga', path:'M12 3v4 M12 17v4 M5 5l3 3 M16 16l3 3 M3 12h4 M17 12h4 M5 19l3-3 M16 8l3-3' },
 { section:'animacion', label:'Animación de inicio', route:'/admin/animacion', path:'M5 4h14v16H5z M10 9l6 3-6 3z' },
 { section:'header', label:'Cabecera web', route:'/admin/cabecera', path:'M3 3h18v18H3z M3 9h18 M6 6h4 M16 6h2' },
 { section:'footer', label:'Pie de página', route:'/admin/pie-de-pagina', path:'M3 3h18v18H3z M3 15h18 M6 18h4 M16 18h2' },
] as const;
