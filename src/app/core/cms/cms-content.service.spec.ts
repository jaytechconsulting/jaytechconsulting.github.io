import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ApiService } from '../api.service';
import { CmsContentService } from './cms-content.service';
import type { ApiCms, ApiSiteContent, ApiPublicSite } from '../models/api.models';
const snapshot = (title = 'Portada real'): ApiPublicSite => ({
  cms: {
    companies: [],
    reviews: [],
    services: [],
    projects: [],
    plans: [],
    teamMembers: [],
    header: { cta: 'Acción real', links: [] },
    footer: { about: '', email: '', phone: '', columns: [] },
  } as ApiCms,
  content: [{ key: 'home.hero', title, body: 'Descripción real', status: 1 } as ApiSiteContent],
});
describe('Published site snapshot', () => {
  it('applies the saved home section order and restores missing sections once', () => {
    const data = snapshot();
    data.content.push({
      ...data.content[0], key: 'home.section-order', body: '["faq","faq","unknown","reviews"]',
    });
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: { publicSite: () => of(data) } }],
    });
    expect(TestBed.inject(CmsContentService).homeSectionOrder()).toEqual([
      'faq', 'reviews', 'services', 'courses', 'clients',
    ]);
  });
  it('uses the media saved in the hero record ahead of the legacy video record', () => {
    const data = snapshot();
    data.content[0].body = JSON.stringify({
      kind: 'hero-media', description: 'Texto visible', mode: 'image', videoUrl: '',
    });
    data.content[0].imageUrl = '/portada.webp';
    data.content.push({
      ...data.content[0], key: 'home.heroAnimation', body: '{"videoUrl":"/anterior.mp4"}',
    });
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: { publicSite: () => of(data) } }],
    });
    const cms = TestBed.inject(CmsContentService);
    expect(cms.section('hero')()).toMatchObject({ description: 'Texto visible', image: '/portada.webp' });
    expect(cms.heroAnimation()).toEqual({ enabled: false, mode: 'image', videoUrl: '' });
  });
  it('starts empty, shares one request and publishes all parts together', () => {
    const source = new Subject<ApiPublicSite>();
    const api = { publicSite: vi.fn(() => source) };
    TestBed.configureTestingModule({ providers: [{ provide: ApiService, useValue: api }] });
    const cms = TestBed.inject(CmsContentService);
    cms.load(false).subscribe();
    expect(cms.section('hero')().title).toBe('');
    expect(cms.header().cta).toBe('');
    expect(cms.contentStatus()).toBe('loading');
    source.next(snapshot());
    source.complete();
    expect(cms.section('hero')().title).toBe('Portada real');
    expect(cms.header().cta).toBe('Acción real');
    expect(cms.contentStatus()).toBe('ready');
    expect(cms.collectionsStatus()).toBe('ready');
    expect(api.publicSite).toHaveBeenCalledOnce();
  });
  it('preserves empty fields without demo content', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: ApiService, useValue: { publicSite: () => of(snapshot('')) } }],
    });
    const cms = TestBed.inject(CmsContentService);
    expect(cms.section('hero')().title).toBe('');
    expect(cms.footer().email).toBe('');
  });
  it('recovers after failure without persisting an old snapshot', () => {
    let failed = true;
    const api = {
      publicSite: () => (failed ? throwError(() => ({ status: 503 })) : of(snapshot('Recuperado'))),
    };
    TestBed.configureTestingModule({ providers: [{ provide: ApiService, useValue: api }] });
    const cms = TestBed.inject(CmsContentService);
    expect(cms.contentStatus()).toBe('error');
    failed = false;
    cms.retryPublic();
    expect(cms.section('hero')().title).toBe('Recuperado');
  });
  it('does not allow a late public response to overwrite administrator data', () => {
    const publicRequest = new Subject<ApiPublicSite>();
    const api = {
      publicSite: () => publicRequest,
      cms: () => of({ header: { cta: 'Privado', links: [] } } as unknown as ApiCms),
      siteContent: () =>
        of([{ key: 'home.hero', title: 'Borrador admin', body: '', status: 1 } as ApiSiteContent]),
    };
    TestBed.configureTestingModule({ providers: [{ provide: ApiService, useValue: api }] });
    const cms = TestBed.inject(CmsContentService);
    cms.load(true).subscribe();
    publicRequest.next(snapshot('Obsoleto'));
    expect(cms.section('hero')().title).toBe('Borrador admin');
    expect(publicRequest.observers.length).toBe(0);
  });
  it('round-trips animation, multiple buttons and image framing through the existing content contract', async () => {
    let stored: ApiSiteContent[] = [];
    const api = {
      publicSite: () => of({ cms: {} as ApiCms, content: stored }),
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

describe('Legal document persistence', () => {
  it('saves full document text through the existing content API', async () => {
    const updateSiteContent = vi.fn(() => of({}));
    const api = {
      publicSite: () => of(snapshot()),
      updateSiteContent,
      cms: () => of(snapshot().cms),
      siteContent: () => of([]),
    };
    TestBed.configureTestingModule({ providers: [{ provide: ApiService, useValue: api }] });
    await firstValueFrom(
      TestBed.inject(CmsContentService).savePageDesign('terminos-y-condiciones', {
        heading: 'Términos aprobados',
        description: 'Resumen',
        content: 'Primero\n\nSegundo',
        backgroundColor: '',
        backgroundImage: '',
      }),
    );
    expect(updateSiteContent).toHaveBeenCalledWith(
      'page.terminos-y-condiciones',
      expect.objectContaining({
        title: 'Términos aprobados',
        status: 1,
        body: JSON.stringify({
          description: 'Resumen',
          content: 'Primero\n\nSegundo',
          backgroundColor: '',
        }),
      }),
    );
  });
});
