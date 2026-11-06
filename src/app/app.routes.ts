import { AdminAccess } from './pages/admin/admin-access/admin-access';
import { AdminProfile } from './pages/admin/admin-profile/admin-profile';
import { CONTENT_MODULES } from './pages/admin/admin-content/content-modules';
import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Login } from './pages/auth/login/login';
import { ForgotPassword } from './pages/auth/forgot-password/forgot-password';
import { ResetPassword } from './pages/auth/reset-password/reset-password';
import { ProposalRequest } from './pages/proposal-request/proposal-request';
import { ProjectList } from './pages/projects/project-list/project-list';
import { Asesorias } from './pages/asesorias/asesorias';
import { CourseDetail } from './pages/asesorias/course-detail/course-detail';
import { Capacitaciones } from './pages/capacitaciones/capacitaciones';
import { ProgramDetail } from './pages/capacitaciones/program-detail/program-detail';
import { ProjectDetail } from './pages/projects/project-detail/project-detail';
import { Conocenos } from './pages/conocenos/conocenos';
import { ClientDashboard } from './pages/client/client-dashboard';
import { NewTicket } from './pages/client/new-ticket/new-ticket';
import { AdminPanel } from './pages/admin/admin-panel';
import { AdminContent } from './pages/admin/admin-content/admin-content';
import { AdminUsers } from './pages/admin/admin-users/admin-users';
import { Loader } from './ui/brand/loader/loader';
import { NotFound } from './pages/errors/not-found';
import { ServerError } from './pages/errors/server-error';
import { Forbidden } from './pages/errors/forbidden';
import { Maintenance } from './pages/errors/maintenance';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: Home,
    data: { seo: { title: 'Jaytech | Software y automatizaciones a medida', description: 'Diseñamos aplicaciones web, páginas, automatizaciones e integraciones para empresas en Perú. Del prototipo a producción, con acompañamiento cercano.' } },
  },
  {
    path: 'login',
    component: Login,
    data: { seo: { title: 'Acceso de clientes | Jaytech', description: 'Acceso privado al panel de clientes y administración de Jaytech.', index: false } },
  },
  {
    path: 'olvide-password',
    component: ForgotPassword,
    data: { seo: { title: 'Recuperar contraseña | Jaytech', description: 'Solicita un enlace seguro para recuperar el acceso a tu cuenta de Jaytech.', index: false } },
  },
  {
    path: 'restablecer-password',
    component: ResetPassword,
    data: { seo: { title: 'Restablecer contraseña | Jaytech', description: 'Crea una nueva contraseña para tu cuenta de Jaytech.', index: false } },
  },
  {
    path: 'restablecer-contrasena',
    component: ResetPassword,
    data: { seo: { title: 'Restablecer contraseña | Jaytech', description: 'Crea una nueva contraseña para tu cuenta de Jaytech.', index: false } },
  },
  {
    path: 'loader',
    component: Loader,
    data: { seo: { title: 'Cargando | Jaytech', description: 'Pantalla de carga de Jaytech.', index: false } },
  },
  {
    path: 'solicitar-propuesta',
    component: ProposalRequest,
    data: { seo: { title: 'Solicita una propuesta de software | Jaytech', description: 'Cuéntanos tu proyecto de software, página web, automatización o integración. Recibe una primera propuesta de alcance y presupuesto.' } },
  },
  {
    path: 'proyectos',
    component: ProjectList,
    data: { seo: { title: 'Proyectos de software y automatización | Jaytech', description: 'Conoce proyectos de aplicaciones web, landings, automatizaciones e integraciones desarrollados por Jaytech para empresas.' } },
  },
  {
    path: 'asesorias',
    component: Asesorias,
    data: { seo: { title: 'Asesorías de software a medida | Jaytech', description: 'Sesiones y programas de acompañamiento técnico: automatización, APIs, datos y más. Cursos prácticos para tu equipo.' } },
  },
  {
    path: 'asesorias/:slug',
    component: CourseDetail,
    data: { seo: { title: 'Curso de asesoría | Jaytech', description: 'Detalle de un curso de asesoría técnica de Jaytech.' } },
  },
  {
    path: 'capacitaciones',
    component: Capacitaciones,
    data: { seo: { title: 'Capacitaciones para equipos técnicos | Jaytech', description: 'Programas de formación en desarrollo, automatización y datos, a medida de tu equipo.' } },
  },
  {
    path: 'capacitaciones/:id',
    component: ProgramDetail,
    data: { seo: { title: 'Programa de capacitación | Jaytech', description: 'Detalle de un programa de capacitación de Jaytech.' } },
  },
  {
    path: 'conocenos',
    component: Conocenos,
    data: { seo: { title: 'Conócenos | Jaytech', description: 'El equipo, los valores y la forma de trabajo detrás de Jaytech.' } },
  },
  {
    path: 'proyectos/:slug',
    component: ProjectDetail,
    data: { seo: { title: 'Proyecto de software | Jaytech', description: 'Caso de éxito de software a medida desarrollado por Jaytech.', type: 'article' } },
  },
  {
    path: 'panel-cliente',
    component: ClientDashboard,
    canActivate: [authGuard],
    data: { role: 'client', seo: { title: 'Panel de cliente | Jaytech', description: 'Área privada de clientes de Jaytech.', index: false } },
  },
  {
    path: 'panel-cliente/proyectos/:slug',
    component: ProjectDetail,
    canActivate: [authGuard],
    data: { role: 'client', seo: { title: 'Detalle de proyecto | Jaytech', description: 'Información privada de un proyecto de Jaytech.', index: false } },
  },
  {
    path: 'panel-cliente/tickets/nuevo',
    component: NewTicket,
    canActivate: [authGuard],
    data: { role: 'client', seo: { title: 'Nuevo ticket | Jaytech', description: 'Formulario privado de soporte para clientes de Jaytech.', index: false } },
  },
  {
    path: 'admin',
    component: AdminPanel,
    canActivate: [authGuard],
    data: { role: 'admin', seo: { title: 'Administración | Jaytech', description: 'Área privada de administración de Jaytech.', index: false } },
  },
  {path:'admin/accesos/:view',component:AdminAccess,canActivate:[authGuard],data:{role:'admin',seo:{title:'Roles y accesos | Jaytech',index:false}}},
  { path: 'admin/perfil', component: AdminProfile, canActivate: [authGuard], data: { role: 'admin', seo: {title: 'Mi perfil | Jaytech', description: 'Perfil de la cuenta administrativa.', index: false} } },
  { path: 'admin/contenido', redirectTo: 'admin/empresas', pathMatch: 'full' },
  ...CONTENT_MODULES.map(module => ({
    path: module.route.slice(1),
    component: AdminContent,
    canActivate: [authGuard],
    data: { role: 'admin', contentSection: module.section, seo: { title: `${module.label} | Jaytech`, description: `Administración de ${module.label.toLowerCase()} de Jaytech.`, index: false } },
  })),
  {
    path: 'admin/usuarios',
    component: AdminUsers,
    canActivate: [authGuard],
    data: { role: 'admin', seo: { title: 'Usuarios y roles | Jaytech', description: 'Gestión privada de usuarios y roles de Jaytech.', index: false } },
  },
  {
    path: 'error/500',
    component: ServerError,
    data: { seo: { title: 'Error de servidor | Jaytech', description: 'Ocurrió un error inesperado en Jaytech.', index: false } },
  },
  {
    path: 'error/403',
    component: Forbidden,
    data: { seo: { title: 'Acceso restringido | Jaytech', description: 'No tienes permisos para ver esta sección de Jaytech.', index: false } },
  },
  {
    path: 'error/503',
    component: Maintenance,
    data: { seo: { title: 'En mantenimiento | Jaytech', description: 'Jaytech está en mantenimiento programado.', index: false } },
  },
  {
    path: '**',
    component: NotFound,
    data: { seo: { title: 'Página no encontrada | Jaytech', description: 'La página que buscas no existe en Jaytech.', index: false } },
  },
];
