import { Component, input, output, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { Home } from './home';
import { CmsContentService } from '../../core/cms/cms-content.service';
import { CmsPlaceholder } from '../../ui/feedback/cms-placeholder/cms-placeholder';

@Component({ selector: 'app-header', template: '<nav>{{cta()}}</nav>' })
class HeaderStub {
  readonly loading = input(false);
  readonly links = input<unknown[]>();
  readonly cta = input('');
  readonly ctaClicked = output<void>();
}
@Component({ selector: 'app-hero-section', template: '<h1>Contenido real</h1>' })
class HeroStub {}
@Component({ selector: 'app-ads-bar', template: 'Anuncio real' })
class AdsStub {}
@Component({
  selector:
    'app-clients-section,app-services-section,app-pricing-section,app-reviews-section,app-contact-section,app-footer,app-whatsapp-fab',
  template: '',
})
class EmptyStub {}

describe('Coherent initial home render', () => {
  beforeEach(() =>
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = vi.fn();
        disconnect = vi.fn();
      },
    ),
  );
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.unstubAllGlobals();
  });
  async function setup() {
    const cms = {
      contentStatus: signal('loading'),
      collectionsStatus: signal('loading'),
      headerStatus: signal('loading'),
      header: signal({ links: [], cta: '' }),
      retryPublic: vi.fn(),
    };
    TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideRouter([]), { provide: CmsContentService, useValue: cms }],
    });
    TestBed.overrideComponent(Home, {
      set: { imports: [HeaderStub, HeroStub, AdsStub, EmptyStub, CmsPlaceholder] },
    });
    await TestBed.compileComponents();
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    return { cms, fixture };
  }
  it('keeps navigation visible and shows the full hero before collections arrive', async () => {
    const { cms, fixture } = await setup();
    expect(fixture.nativeElement.querySelector('app-header')).not.toBeNull();
    cms.contentStatus.set('ready');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-hero-section')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-ads-bar')).toBeNull();
    cms.header.set({ links: [], cta: 'Acción definitiva' });
    cms.headerStatus.set('ready');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-clients-section')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-header').textContent).toContain(
      'Acción definitiva',
    );
    expect(fixture.nativeElement.querySelector('h1').textContent).toBe('Contenido real');
    expect(fixture.nativeElement.querySelector('app-ads-bar')).not.toBeNull();
  });
  it('does not expose partial page data after an error and supports retry', async () => {
    const { cms, fixture } = await setup();
    cms.contentStatus.set('ready');
    cms.headerStatus.set('error');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-hero-section')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('No pudimos cargar este contenido');
    fixture.nativeElement.querySelector('app-cms-placeholder button').click();
    expect(cms.retryPublic).toHaveBeenCalledOnce();
  });
});
