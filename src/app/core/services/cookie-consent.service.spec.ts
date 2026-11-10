import { TestBed } from '@angular/core/testing';
import { AnalyticsService } from './analytics.service';
import { CookieConsentService } from './cookie-consent.service';

describe('Cookie consent and analytics', () => {
  beforeEach(() => {
    const storage = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      clear: () => storage.clear(),
    });
    TestBed.resetTestingModule();
    document.getElementById('google-tag-manager-script')?.remove();
  });
  afterEach(() => {
    document.getElementById('google-tag-manager-script')?.remove();
    vi.unstubAllGlobals();
  });
  it('does not load analytics without consent or after rejection', () => {
    const analytics = TestBed.inject(AnalyticsService);
    analytics.init();
    expect(document.getElementById('google-tag-manager-script')).toBeNull();
    TestBed.inject(CookieConsentService).save(false);
    analytics.init();
    expect(document.getElementById('google-tag-manager-script')).toBeNull();
  });
  it('loads the requested GTM container once after acceptance', () => {
    const consent = TestBed.inject(CookieConsentService);
    const analytics = TestBed.inject(AnalyticsService);
    consent.save(true);
    analytics.init();
    analytics.init();
    expect(document.querySelectorAll('#google-tag-manager-script').length).toBe(1);
    expect(document.querySelector<HTMLScriptElement>('#google-tag-manager-script')?.src).toBe(
      'https://www.googletagmanager.com/gtm.js?id=GTM-PZBV2SLJ',
    );
    expect(document.querySelector('script[src*="/gtag/js"]')).toBeNull();
  });
  it('remembers rejection on subsequent visits', () => {
    TestBed.inject(CookieConsentService).save(false);
    TestBed.resetTestingModule();
    expect(TestBed.inject(CookieConsentService).choice()?.analytics).toBe(false);
  });
  it('requires a fresh choice for expired or invalid consent', () => {
    localStorage.setItem(
      'jaytech-cookie-consent',
      JSON.stringify({ version: 1, analytics: true, savedAt: 1 }),
    );
    expect(TestBed.inject(CookieConsentService).choice()).toBeNull();
  });
});
