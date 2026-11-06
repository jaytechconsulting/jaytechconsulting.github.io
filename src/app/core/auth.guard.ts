import { AccessService } from './access.service';
import { map } from 'rxjs';
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, UserRole } from './auth.service';

export const authGuard: CanActivateFn = (route,state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login'], { queryParams: { redirectTo: route.url.map((s) => s.path).join('/') } });
  }

  const requiredRole = route.data['role'] as UserRole | undefined;
  if(requiredRole==='admin'){
    const access=inject(AccessService);
    return access.load(true).pipe(map(session=>{
      if(state.url.split('?')[0]==='/admin/perfil')return true;
      if(access.menuFor(state.url))return true;
      if(state.url==='/admin'){const first=session.menus.find(m=>m.route);if(first)return router.parseUrl(access.link(first));return router.parseUrl('/admin/perfil');}
      return router.createUrlTree(['/error/403']);
    }));
  }
  if(requiredRole && auth.currentUser()?.role!==requiredRole)return router.createUrlTree(['/error/403']);
  return true;
};
