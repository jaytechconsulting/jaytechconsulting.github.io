import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { routes } from '../../../app.routes';
import { authGuard } from '../../../core/auth.guard';
import { AuthService } from '../../../core/auth.service';
import { AdminContent } from './admin-content';
import { CONTENT_MODULES } from './content-modules';
describe('Independent content modules',()=>{
 it('gives each section a unique protected URL and the correct editor section',()=>{
  expect(CONTENT_MODULES.length).toBeGreaterThan(0);expect(new Set(CONTENT_MODULES.map(module=>module.route)).size).toBe(CONTENT_MODULES.length);
  for(const module of CONTENT_MODULES){
   const route=routes.find(route=>route.path===module.route.slice(1));
   expect(route?.component).toBe(AdminContent);expect(route?.data?.['contentSection']).toBe(module.section);
   expect(route?.data?.['role']).toBe('admin');expect(route?.canActivate).toContain(authGuard);
  }
 });
 it('keeps the previous content URL as an exact redirect',()=>{
  expect(routes.find(route=>route.path==='admin/contenido')).toMatchObject({redirectTo:'admin/empresas',pathMatch:'full'});
 });
 it('requires an authenticated administrator for the new menus',()=>{
  let authenticated=false;let role='client';
  TestBed.configureTestingModule({providers:[provideRouter([]),{provide:AuthService,useValue:{isAuthenticated:()=>authenticated,currentUser:()=>({role})}}]});
  const router=TestBed.inject(Router);const snapshot={data:{role:'admin'},url:[]} as unknown as ActivatedRouteSnapshot;
  const check=()=>TestBed.runInInjectionContext(()=>authGuard(snapshot,{} as RouterStateSnapshot));
  expect(router.serializeUrl(check() as UrlTree)).toContain('/login');authenticated=true;
  expect(router.serializeUrl(check() as UrlTree)).toBe('/error/403');role='admin';expect(check()).toBe(true);
 });
});
