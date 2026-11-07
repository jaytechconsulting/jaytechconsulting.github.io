import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { AccessService, AccessSession } from './access.service';
import { AuthService, AuthUser, UserRole } from './auth.service';
import { ErrorRecovery } from './error-recovery';
import { loginRedirect } from './auth-navigation';

export const authGuard: CanActivateFn = (route, state) => {
 const auth=inject(AuthService),router=inject(Router),access=inject(AccessService),recovery=inject(ErrorRecovery);
 const requiredRole=route.data['role'] as UserRole|undefined;
 const login=()=>loginRedirect(router,state.url);
 const authorizeAdmin=(session:AccessSession)=>{
  if(!auth.isAuthenticated())return login();
  if(!access.loaded())return recovery.error(503,state.url);
  if(!session.canAdmin)return recovery.error(403,state.url);
  if(state.url.split(/[?#]/)[0]==='/admin/perfil')return true;
  const menu=access.menuFor(state.url);
  if(menu?.permissionId && session.permissions.some(p=>p.id===menu.permissionId))return true;
  if(state.url==='/admin'){
   const first=session.menus.find(m=>m.route);
   return router.parseUrl(first?access.link(first):'/admin/perfil');
  }
  return recovery.error(403,state.url);
 };
 const authorizeUser=(user:AuthUser)=>!requiredRole || user.role===requiredRole?true:recovery.error(403,state.url);

 // Only server-verified in-memory state may activate a module immediately.
 // Reloads and account changes clear it and must verify the cookie first.
 if(auth.isAuthenticated() && (requiredRole!=='admin' || access.loaded())){
  const result=requiredRole==='admin'?authorizeAdmin(access.session()):authorizeUser(auth.currentUser()!);
  if(result===true && requiredRole==='admin')access.revalidateAfterNavigation();
  return result;
 }
 return auth.loadProfile().pipe(switchMap(user=>{
  if(!auth.isAuthenticated())return of(login());
  return requiredRole==='admin'?access.load(true).pipe(map(authorizeAdmin)):of(authorizeUser(user));
 }),catchError(error=>{
  if(error.status===401 || (error.status===undefined && !auth.isAuthenticated())){auth.clearSession();return of(login());}
  return of(recovery.error(error.status===403?403:503,state.url));
 }));
};
