import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { vi } from 'vitest';
import { App } from './app';
import { NavProgressBar } from './ui/feedback/nav-progress-bar/nav-progress-bar';
import { LoadingService } from './core/services/loading.service';
import { CmsContentService } from './core/cms-content.service';
import { AnalyticsService } from './core/services/analytics.service';
import { SeoService } from './core/services/seo.service';
import { ErrorRecovery } from './core/error-recovery';

@Component({template:'<header>Topbar</header><p>Module ready</p>'})class Module{}

describe('Global loading feedback',()=>{
 it('shows one global bar before guards finish and during HTTP calls, outside routed content',async()=>{
  const guard=new Subject<boolean>();
  TestBed.configureTestingModule({imports:[App],providers:[provideRouter([{path:'',component:Module},{path:'admin',component:Module,canActivate:[()=>guard]}]),
   {provide:CmsContentService,useValue:{loader:signal({enabled:false,color:''})}},
   {provide:AnalyticsService,useValue:{init:vi.fn(),pageView:vi.fn()}},{provide:SeoService,useValue:{init:vi.fn()}},
   {provide:ErrorRecovery,useValue:{startTracking:vi.fn()}}]});
  const fixture=TestBed.createComponent(App);fixture.detectChanges();
  const bar=()=>fixture.debugElement.query(By.directive(NavProgressBar)).componentInstance as NavProgressBar;
  expect(bar().visible()).toBe(true);
  expect(fixture.nativeElement.querySelector('.app-content app-nav-progress-bar')).toBeNull();
  expect(fixture.nativeElement.querySelectorAll('app-nav-progress-bar')).toHaveLength(1);
  const router=TestBed.inject(Router);await router.navigateByUrl('/');fixture.detectChanges();expect(bar().visible()).toBe(false);
  const navigation=router.navigateByUrl('/admin');await new Promise(resolve=>setTimeout(resolve,0));fixture.detectChanges();
  expect(bar().visible()).toBe(true);expect(fixture.nativeElement.textContent).toContain('Module ready');
  guard.next(true);guard.complete();await navigation;fixture.detectChanges();expect(bar().visible()).toBe(false);
  const loading=TestBed.inject(LoadingService);loading.start();loading.start();fixture.detectChanges();expect(bar().visible()).toBe(true);
  loading.stop();fixture.detectChanges();expect(bar().visible()).toBe(true);loading.stop();fixture.detectChanges();expect(bar().visible()).toBe(false);
 });
});
