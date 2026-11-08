import { errorRecoveryGuard, notFoundGuard } from './core/error-recovery';
import { CONTENT_MODULES } from './pages/admin/admin-content/content-modules';
import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: Home,
    data: { seo: { title: 'Jaytech | Software y automatizaciones a medida', description: 'Diseñamos aplicaciones web, páginas, automatizaciones e integraciones para empresas en Perú. Del prototipo a producción, con acompañamiento cercano.' } },
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/login/login').then((m) => m.Login),
    data: { seo: { title: 'Acceso de clientes | Jaytech', description: 'Acceso privado al panel de clientes y administración de Jaytech.', index: false } },
  },
  {
    path: 'olvide-password',
    loadComponent: () => import('./pages/auth/forgot-password/forgot-password').then((m) => m.ForgotPassword),
    data: { seo: { title: 'Recuperar contraseña | Jaytech', description: 'Solicita un enlace seguro para recuperar el acceso a tu cuenta de Jaytech.', index: false } },
  },
  {
    path: 'restablecer-password',
    loadComponent: () => import('./pages/auth/reset-password/reset-password').then((m) => m.ResetPassword),
    data: { seo: { title: 'Restablecer contraseña | Jaytech', description: 'Crea una nueva contraseña para tu cuenta de Jaytech.', index: false } },
  },
  {
    path: 'restablecer-contrasena',
    loadComponent: () => import('./pages/auth/reset-password/reset-password').then((m) => m.ResetPassword),
    data: { seo: { title: 'Restablecer contraseña | Jaytech', description: 'Crea una nueva contraseña para tu cuenta de Jaytech.', index: false } },
  },
  {
    path: 'loader',
    loadComponent: () => import('./ui/brand/loader/loader').then((m) => m.Loader),
    data: { seo: { title: 'Cargando | Jaytech', description: 'Pantalla de carga de Jaytech.', index: false } },
  },
  {
    path: 'solicitar-propuesta',
    loadComponent: () => import('./pages/proposal-request/proposal-request').then((m) => m.ProposalRequest),
    data: { seo: { title: 'Solicita una propuesta de software | Jaytech', description: 'Cuéntanos tu proyecto de software, página web, automatización o integración. Recibe una primera propuesta de alcance y presupuesto.' } },
  },
  {
    path: 'proyectos',
    loadComponent: () => import('./pages/projects/project-list/project-list').then((m) => m.ProjectList),
    data: { seo: { title: 'Proyectos de software y automatización | Jaytech', description: 'Conoce proyectos de aplicaciones web, landings, automatizaciones e integraciones desarrollados por Jaytech para empresas.' } },
  },
  {
    path: 'asesorias',
    loadComponent: () => import('./pages/asesorias/asesorias').then((m) => m.Asesorias),
    data: { seo: { title: 'Asesorías de software a medida | Jaytech', description: 'Sesiones y programas de acompañamiento técnico: automatización, APIs, datos y más. Cursos prácticos para tu equipo.' } },
  },
  {
    path: 'asesorias/:slug',
    loadComponent: () => import('./pages/asesorias/course-detail/course-detail').then((m) => m.CourseDetail),
    data: { seo: { title: 'Curso de asesoría | Jaytech', description: 'Detalle de un curso de asesoría técnica de Jaytech.' } },
  },
  {
    path: 'capacitaciones',
    loadComponent: () => import('./pages/capacitaciones/capacitaciones').then((m) => m.Capacitaciones),
    data: { seo: { title: 'Capacitaciones para equipos técnicos | Jaytech', description: 'Programas de formación en desarrollo, automatización y datos, a medida de tu equipo.' } },
  },
  {
    path: 'capacitaciones/:id',
    loadComponent: () => import('./pages/capacitaciones/program-detail/program-detail').then((m) => m.ProgramDetail),
    data: { seo: { title: 'Programa de capacitación | Jaytech', description: 'Detalle de un programa de capacitación de Jaytech.' } },
  },
  {
    path: 'cursos',
    loadComponent: () => import('./pages/courses/course-quote/course-quote').then((m) => m.CourseQuote),
    data: { seo: { title: 'Cursos | Jaytech', description: 'Arma tu selección de cursos de Jaytech con material práctico en video, PDF y archivos.' } },
  },
  {
    path: 'cursos/checkout',
    loadComponent: () => import('./pages/courses/course-checkout/course-checkout').then((m) => m.CourseCheckout),
    data: { seo: { title: 'Checkout de cursos | Jaytech', description: 'Finaliza la compra de tus cursos de Jaytech.', index: false } },
  },
  {
    path: 'cursos/:id',
    loadComponent: () => import('./pages/courses/course-info/course-info').then((m) => m.CourseInfo),
    data: { seo: { title: 'Curso | Jaytech', description: 'Detalle de un curso virtual de Jaytech: temario, material y reseñas.' } },
  },
  {
    path: 'conocenos',
    loadComponent: () => import('./pages/conocenos/conocenos').then((m) => m.Conocenos),
    data: { seo: { title: 'Conócenos | Jaytech', description: 'El equipo, los valores y la forma de trabajo detrás de Jaytech.' } },
  },
  {
    path: 'proyectos/:slug',
    loadComponent: () => import('./pages/projects/project-detail/project-detail').then((m) => m.ProjectDetail),
    data: { seo: { title: 'Proyecto de software | Jaytech', description: 'Caso de éxito de software a medida desarrollado por Jaytech.', type: 'article' } },
  },
  {
    path: 'panel-cliente',
    loadComponent: () => import('./pages/client/client-dashboard').then((m) => m.ClientDashboard),
    canActivate: [authGuard], runGuardsAndResolvers: 'always' as const,
    data: { role: 'client', seo: { title: 'Panel de cliente | Jaytech', description: 'Área privada de clientes de Jaytech.', index: false } },
  },
  {
    path: 'panel-cliente/proyectos/:slug',
    loadComponent: () => import('./pages/projects/project-detail/project-detail').then((m) => m.ProjectDetail),
    canActivate: [authGuard], runGuardsAndResolvers: 'always' as const,
    data: { role: 'client', seo: { title: 'Detalle de proyecto | Jaytech', description: 'Información privada de un proyecto de Jaytech.', index: false } },
  },
  {
    path: 'panel-cliente/tickets/nuevo',
    loadComponent: () => import('./pages/client/new-ticket/new-ticket').then((m) => m.NewTicket),
    canActivate: [authGuard], runGuardsAndResolvers: 'always' as const,
    data: { role: 'client', seo: { title: 'Nuevo ticket | Jaytech', description: 'Formulario privado de soporte para clientes de Jaytech.', index: false } },
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin-panel').then((m) => m.AdminPanel),
    canActivate: [authGuard], runGuardsAndResolvers: 'always' as const,
    data: { role: 'admin', seo: { title: 'Administración | Jaytech', description: 'Área privada de administración de Jaytech.', index: false } },
  },
  {
    path: 'admin/accesos/:view',
    loadComponent: () => import('./pages/admin/admin-access/admin-access').then((m) => m.AdminAccess),
    canActivate: [authGuard], runGuardsAndResolvers: 'always' as const,
    data: { role: 'admin', seo: { title: 'Roles y accesos | Jaytech', index: false } },
  },
  {
    path: 'admin/perfil',
    loadComponent: () => import('./pages/admin/admin-profile/admin-profile').then((m) => m.AdminProfile),
    canActivate: [authGuard], runGuardsAndResolvers: 'always' as const,
    data: { role: 'admin', seo: { title: 'Mi perfil | Jaytech', description: 'Perfil de la cuenta administrativa.', index: false } },
  },
  { path: 'admin/contenido', redirectTo: 'admin/empresas', pathMatch: 'full' },
  ...CONTENT_MODULES.map(module => ({
    path: module.route.slice(1),
    loadComponent: () => import('./pages/admin/admin-content/admin-content').then((m) => m.AdminContent),
    canActivate: [authGuard], runGuardsAndResolvers: 'always' as const,
    data: { role: 'admin', contentSection: module.section, seo: { title: `${module.label} | Jaytech`, description: `Administración de ${module.label.toLowerCase()} de Jaytech.`, index: false } },
  })),
  {
    path: 'admin/usuarios',
    loadComponent: () => import('./pages/admin/admin-users/admin-users').then((m) => m.AdminUsers),
    canActivate: [authGuard], runGuardsAndResolvers: 'always' as const,
    data: { role: 'admin', seo: { title: 'Usuarios y roles | Jaytech', description: 'Gestión privada de usuarios y roles de Jaytech.', index: false } },
  },
  {
    path: 'error/500',
    canActivate:[errorRecoveryGuard],
    loadComponent: () => import('./pages/errors/server-error').then((m) => m.ServerError),
    data: { seo: { title: 'Error de servidor | Jaytech', description: 'Ocurrió un error inesperado en Jaytech.', index: false } },
  },
  {
    path: 'error/403',
    canActivate:[errorRecoveryGuard],
    loadComponent: () => import('./pages/errors/forbidden').then((m) => m.Forbidden),
    data: { seo: { title: 'Acceso restringido | Jaytech', description: 'No tienes permisos para ver esta sección de Jaytech.', index: false } },
  },
  {
    path: 'error/503',
    canActivate:[errorRecoveryGuard],
    loadComponent: () => import('./pages/errors/maintenance').then((m) => m.Maintenance),
    data: { seo: { title: 'En mantenimiento | Jaytech', description: 'Jaytech está en mantenimiento programado.', index: false } },
  },
  {
    path:'error/404',canActivate:[errorRecoveryGuard],
    loadComponent:()=>import('./pages/errors/not-found').then(m=>m.NotFound),
    data:{seo:{title:'Página no encontrada | Jaytech',index:false}},
  },
  {
    path: '**',
    canActivate:[notFoundGuard],
    loadComponent: () => import('./pages/errors/not-found').then((m) => m.NotFound),
    data: { seo: { title: 'Página no encontrada | Jaytech', description: 'La página que buscas no existe en Jaytech.', index: false } },
  },
];
