import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { AnnouncementBanner } from './announcement-banner';
import { normalizeAnnouncement, type Announcement } from '../../../core/models/announcement';

describe('Promotion banner', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });
  function setup(value: Partial<Announcement>) {
    const fixture = TestBed.createComponent(AnnouncementBanner);
    fixture.componentRef.setInput('config', { message: 'Oferta', ...value });
    fixture.detectChanges();
    return fixture;
  }
  it('places foreground images on either side of the text and applies per-screen visibility', () => {
    const fixture = setup({
      inlineImages: [
        {
          id: 'one',
          src: 'https://example.com/one.png',
          alt: 'Primero',
          width: 64,
          position: 'before',
          mobileVisible: false,
          desktopVisible: true,
        },
        {
          id: 'two',
          src: 'https://example.com/two.png',
          alt: 'Segundo',
          width: 80,
          position: 'after',
          mobileVisible: true,
          desktopVisible: false,
        },
      ],
    });
    const copy = fixture.nativeElement.querySelector('.banner-copy');
    expect(copy.firstElementChild.querySelector('img').alt).toBe('Primero');
    expect(copy.lastElementChild.querySelector('img').alt).toBe('Segundo');
    expect(copy.firstElementChild.querySelector('img').classList.contains('hide-mobile')).toBe(
      true,
    );
    expect(copy.lastElementChild.querySelector('img').classList.contains('hide-desktop')).toBe(
      true,
    );
  });
  it('counts down to an absolute instant and hides an expired banner without resetting on reload', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-10T00:00:00Z'));
    const config = normalizeAnnouncement({
      countdown: {
        enabled: true,
        endsAt: '2026-11-10T00:00:02Z',
        label: 'Termina en',
        expiredAction: 'hide',
        expiredMessage: 'Finalizó',
      },
    });
    const fixture = setup(config);
    expect(fixture.componentInstance.remaining()[3].value).toBe('02');
    vi.advanceTimersByTime(2000);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('section')).toBeNull();
    fixture.destroy();
    const reloaded = setup(config);
    expect(reloaded.nativeElement.querySelector('section')).toBeNull();
  });
  it('replaces expired promotions with their final message and removes purchase actions', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-10T00:00:05Z'));
    const fixture = setup({
      countdown: {
        enabled: true,
        endsAt: '2026-11-10T00:00:02Z',
        label: 'Termina',
        expiredAction: 'message',
        expiredMessage: 'Esta promoción terminó',
      },
      buttons: [{ label: 'Comprar', href: '/cursos', variant: 'solid', newTab: false }],
    });
    expect(fixture.nativeElement.textContent).toContain('Esta promoción terminó');
    expect(fixture.nativeElement.querySelector('.announcement-button')).toBeNull();
    expect(fixture.nativeElement.querySelector('[role=timer]')).toBeNull();
  });
  it('cleans up the running countdown when the banner is destroyed', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-10T00:00:00Z'));
    const fixture = setup({
      countdown: {
        enabled: true,
        endsAt: '2026-11-11T00:00:00Z',
        label: 'Termina',
        expiredAction: 'hide',
        expiredMessage: '',
      },
    });
    const clear = vi.spyOn(globalThis, 'clearInterval');
    fixture.destroy();
    expect(clear).toHaveBeenCalled();
  });
});
