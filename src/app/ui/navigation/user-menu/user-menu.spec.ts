import { AccessService } from '../../../core/access.service';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { AuthService } from '../../../core/auth.service';
import { UserMenu } from './user-menu';
describe('Topbar account menu',()=>{
 beforeEach(()=>TestBed.configureTestingModule({imports:[UserMenu],providers:[provideRouter([]),{provide:AccessService,useValue:{session:()=>({roles:[]})}},{provide:AuthService,useValue:{currentUser:signal({name:'Ana Pérez',email:'ana@example.test',role:'admin',initials:'AP'})}}]}));
 it('opens the profile and logout options from the avatar',()=>{
  const fixture=TestBed.createComponent(UserMenu);fixture.detectChanges();
  const trigger=fixture.nativeElement.querySelector('.account-trigger') as HTMLButtonElement;trigger.click();fixture.detectChanges();
  expect(trigger.getAttribute('aria-expanded')).toBe('true');expect(fixture.nativeElement.querySelector('[role=menuitem]').getAttribute('href')).toBe('/admin/perfil');
  expect(fixture.nativeElement.querySelector('.account-avatar').textContent).toContain('AP');expect(fixture.nativeElement.querySelector('.account-trigger > app-icon')).toBeNull();
  const logout=vi.fn();fixture.componentInstance.logout.subscribe(logout);fixture.nativeElement.querySelector('.sign-out').click();fixture.detectChanges();
  expect(logout).toHaveBeenCalledOnce();expect(fixture.componentInstance.open()).toBe(false);
 });
 it('supports keyboard navigation and Escape without logging out',()=>{
  const fixture=TestBed.createComponent(UserMenu);fixture.detectChanges();fixture.nativeElement.querySelector('.account-trigger').click();fixture.detectChanges();
  const logout=vi.fn();fixture.componentInstance.logout.subscribe(logout);
  fixture.componentInstance.menuKey(new KeyboardEvent('keydown',{key:'Home',cancelable:true}));
  expect(document.activeElement?.getAttribute('role')).toBe('menuitem');
  fixture.componentInstance.menuKey(new KeyboardEvent('keydown',{key:'Escape',cancelable:true}));
  expect(fixture.componentInstance.open()).toBe(false);expect(logout).not.toHaveBeenCalled();expect(document.activeElement).toBe(fixture.nativeElement.querySelector('.account-trigger'));
 });
 it('closes when clicking outside the account menu',()=>{
  const fixture=TestBed.createComponent(UserMenu);fixture.detectChanges();fixture.nativeElement.querySelector('.account-trigger').click();fixture.detectChanges();
  document.body.dispatchEvent(new Event('pointerdown',{bubbles:true}));expect(fixture.componentInstance.open()).toBe(false);
 });
});
