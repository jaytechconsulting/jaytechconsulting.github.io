import { normalizeAnnouncement, validAnnouncementHref } from './announcement';

describe('Announcement compatibility and safe rendering', () => {
  it('keeps legacy images and a single action with centered framing', () => {
    const result = normalizeAnnouncement({
      backgroundImage: 'https://example.com/banner.webp',
      linkHref: '#planes',
      linkLabel: 'Ver planes',
    });
    expect(result.mediaType).toBe('image');
    expect(result.imageX).toBe(50);
    expect(result.imageZoom).toBe(1);
    expect(result.buttons).toEqual([
      {
        label: 'Ver planes',
        href: '#planes',
        variant: 'outline',
        newTab: false,
        mobileVisible: true,
        desktopVisible: true,
      },
    ]);
  });
  it('does not resurrect a removed legacy action and clamps malformed framing', () => {
    const result = normalizeAnnouncement({
      buttons: [],
      linkHref: '#planes',
      imageZoom: 99,
      imageY: -10,
      overlay: NaN,
    });
    expect(result.buttons).toEqual([]);
    expect(result.imageZoom).toBe(3);
    expect(result.imageY).toBe(0);
    expect(result.overlay).toBe(45);
  });
  it('rejects unsafe action URLs', () => {
    for (const href of [
      'javascript:alert(1)',
      '//evil.test',
      '/%2Fevil.test',
      '/\\evil.test',
      'https://user:pass@example.com',
      '/test path',
    ])
      expect(validAnnouncementHref(href)).toBe(false);
    for (const href of ['/cursos', '#planes', 'https://example.com/products'])
      expect(validAnnouncementHref(href)).toBe(true);
  });
});
