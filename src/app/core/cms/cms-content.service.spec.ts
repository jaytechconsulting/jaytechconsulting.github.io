import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ApiService } from '../api.service';
import { CmsContentService } from './cms-content.service';
import type { ApiCms, ApiSiteContent } from '../models/api.models';

describe('Announcement loading', () => {
  it('loads first-screen settings separately, deduplicates requests and ignores late collection header data', () => {
    const content = new Subject<ApiSiteContent[]>(),
      collections = new Subject<ApiCms>(),
      layout = new Subject<Pick<ApiCms, 'header' | 'footer'>>();
    const api = {
      siteContent: vi.fn(() => content),
      cms: vi.fn(() => collections),
      siteSettings: vi.fn(() => layout),
    };
    TestBed.configureTestingModule({ providers: [{ provide: ApiService, useValue: api }] });
    const cms = TestBed.inject(CmsContentService);
    cms.load(false).subscribe();
    layout.next({
      header: { cta: 'Acción definitiva', links: [] },
      footer: { about: '', email: '', phone: '', columns: [] },
    });
    layout.complete();
    content.next([
      { key: 'home.hero', title: 'Portada real', body: '', status: 1 } as ApiSiteContent,
    ]);
    content.complete();
    expect(cms.headerStatus()).toBe('ready');
    expect(cms.contentStatus()).toBe('ready');
    expect(cms.collectionsStatus()).toBe('loading');
    collections.next({ header: { cta: 'Versión anterior', links: [] } } as unknown as ApiCms);
    collections.complete();
    expect(cms.header().cta).toBe('Acción definitiva');
    expect(api.siteContent).toHaveBeenCalledOnce();
    expect(api.siteSettings).toHaveBeenCalledOnce();
    expect(api.cms).toHaveBeenCalledOnce();
  });
  it('keeps critical responses alive if the secondary collections request fails', () => {
    const content = new Subject<ApiSiteContent[]>(),
      layout = new Subject<Pick<ApiCms, 'header' | 'footer'>>();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ApiService,
          useValue: {
            siteContent: () => content,
            cms: () => throwError(() => ({ status: 503 })),
            siteSettings: () => layout,
          },
        },
      ],
    });
    const cms = TestBed.inject(CmsContentService);
    content.next([
      { key: 'home.hero', title: 'Portada real', body: '', status: 1 } as ApiSiteContent,
    ]);
    content.complete();
    layout.next({
      header: { cta: 'Real', links: [] },
      footer: { about: '', email: '', phone: '', columns: [] },
    });
    layout.complete();
    expect(cms.contentStatus()).toBe('ready');
    expect(cms.headerStatus()).toBe('ready');
    expect(cms.collectionsStatus()).toBe('error');
  });
  it('starts with empty CMS fields instead of example copy', () => {
    const content = new Subject<ApiSiteContent[]>(),
      collections = new Subject<ApiCms>();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ApiService,
          useValue: {
            siteSettings: () => of({}),
            siteContent: () => content,
            cms: () => collections,
          },
        },
      ],
    });
    const cms = TestBed.inject(CmsContentService);
    expect(cms.section('hero')().title).toBe('');
    expect(cms.section('hero')().highlight).toBe('');
    expect(cms.pages().login.heading).toBe('');
    expect(cms.header().links).toEqual([]);
    expect(cms.footer().email).toBe('');
    expect(cms.heroAnimation().enabled).toBe(false);
    expect(cms.contentStatus()).toBe('loading');
  });
  it('publishes real page copy before collections finish and respects deliberately empty fields', () => {
    const content = new Subject<ApiSiteContent[]>(),
      collections = new Subject<ApiCms>();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ApiService,
          useValue: {
            siteSettings: () => of({}),
            siteContent: () => content,
            cms: () => collections,
          },
        },
      ],
    });
    const cms = TestBed.inject(CmsContentService);
    content.next([
      {
        key: 'home.hero',
        title: 'Título del CMS',
        body: 'Descripción real',
        status: 1,
      } as ApiSiteContent,
      { key: 'home.pricing', title: '', body: '', status: 1 } as ApiSiteContent,
    ]);
    content.complete();
    expect(cms.section('hero')().title).toBe('Título del CMS');
    expect(cms.section('pricing')().title).toBe('');
    expect(cms.contentStatus()).toBe('ready');
    expect(cms.collectionsStatus()).toBe('loading');
    collections.next({} as ApiCms);
    collections.complete();
    expect(cms.section('hero')().title).toBe('Título del CMS');
    expect(cms.contentStatus()).toBe('ready');
    expect(cms.footer().email).toBe('');
  });
  it('offers a retry after failure and never substitutes demo content', () => {
    let failed = true;
    const api = {
      siteContent: vi.fn(() =>
        failed
          ? throwError(() => ({ status: 503 }))
          : of([{ key: 'home.hero', title: 'Recuperado', body: '', status: 1 } as ApiSiteContent]),
      ),
      cms: vi.fn(() => of({} as ApiCms)),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: { siteSettings: () => of({}), ...api } }],
    });
    const cms = TestBed.inject(CmsContentService);
    expect(cms.contentStatus()).toBe('error');
    expect(cms.section('hero')().title).toBe('');
    failed = false;
    cms.retryPublic();
    expect(cms.contentStatus()).toBe('ready');
    expect(cms.section('hero')().title).toBe('Recuperado');
  });
  it('shows the banner without waiting for CMS collections and reuses the same request', () => {
    const content = new Subject<ApiSiteContent[]>(),
      collections = new Subject<ApiCms>();
    const api = { siteContent: vi.fn(() => content), cms: vi.fn(() => collections) };
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: { siteSettings: () => of({}), ...api } }],
    });
    const cms = TestBed.inject(CmsContentService);
    content.next([
      { key: 'site.announcement', title: 'Nueva promoción', body: '', status: 1 } as ApiSiteContent,
    ]);
    expect(cms.announcement().message).toBe('Nueva promoción');
    expect(cms.announcement().active).toBe(true);
    content.complete();
    collections.next({} as ApiCms);
    collections.complete();
    expect(cms.announcement().message).toBe('Nueva promoción');
    expect(api.siteContent).toHaveBeenCalledOnce();
    expect(api.cms).toHaveBeenCalledOnce();
  });
  it('round-trips animation, multiple buttons and image framing through the existing content contract', async () => {
    let stored: ApiSiteContent[] = [];
    const api = {
      cms: vi.fn(() => of({} as ApiCms)),
      siteContent: vi.fn(() => of(stored)),
      updateSiteContent: vi.fn((key: string, value: ApiSiteContent) => {
        stored = [{ ...value, key }];
        return of(value);
      }),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: { siteSettings: () => of({}), ...api } }],
    });
    const cms = TestBed.inject(CmsContentService);
    const value = {
      message: 'Promoción',
      active: true,
      linkLabel: '',
      linkHref: '',
      backgroundColor: '#4654FF',
      backgroundImage: 'https://example.com/banner.webp',
      mediaType: 'animation' as const,
      animation: 'aurora' as const,
      imageX: 20,
      imageY: 70,
      imageZoom: 1.8,
      overlay: 35,
      minHeight: 80,
      inlineImages: [
        {
          id: 'product',
          src: 'https://example.com/product.webp',
          alt: 'Producto',
          position: 'after' as const,
          width: 80,
          mobileVisible: false,
          desktopVisible: true,
        },
      ],
      mobileLayout: 'inline' as const,
      visibility: {
        mobile: { banner: true, message: true, images: false, buttons: true, countdown: false },
        desktop: { banner: true, message: true, images: true, buttons: true, countdown: true },
      },
      countdown: {
        enabled: true,
        endsAt: '2026-12-31T23:59:00Z',
        label: 'Termina en',
        expiredAction: 'hide' as const,
        expiredMessage: 'Finalizó',
      },
      buttons: [
        { label: 'Cursos', href: '/cursos', variant: 'solid' as const, newTab: false },
        { label: 'Planes', href: '#planes', variant: 'outline' as const, newTab: false },
      ],
    };
    await firstValueFrom(cms.saveAnnouncement(value));
    expect(cms.announcement()).toMatchObject({
      ...value,
      linkLabel: 'Cursos',
      linkHref: '/cursos',
    });
    const details = JSON.parse(stored[0].body);
    expect(details.linkHref).toBe('/cursos');
    expect(details.backgroundImage).toBeUndefined();
    expect(stored[0].imageUrl).toBe(value.backgroundImage);
  });
});
