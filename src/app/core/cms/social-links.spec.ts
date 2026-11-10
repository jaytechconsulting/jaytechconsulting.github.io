import { parseSocialLinks, socialUrlValid } from './social-links';
import { stateFromApi } from './cms.mappers';
import type { ApiCms, ApiSiteContent } from '../models/api.models';

describe('Footer social links', () => {
  it('provides platform home pages as test links only when no configuration exists', () => {
    expect(parseSocialLinks(undefined)).toHaveLength(5);
    expect(parseSocialLinks('[]')).toEqual([]);
  });
  it('rejects executable URLs, credentials and unsupported networks', () => {
    expect(socialUrlValid('javascript:alert(1)')).toBe(false);
    expect(socialUrlValid('https://user:pass@example.com')).toBe(false);
    expect(socialUrlValid('https://www.instagram.com/example/')).toBe(true);
    expect(
      parseSocialLinks(
        JSON.stringify([
          { network: 'instagram', url: 'javascript:alert(1)', enabled: true },
          { network: 'unknown', url: 'https://example.com/', enabled: true },
        ]),
      ),
    ).toEqual([]);
  });
  it('preserves hidden settings and removes duplicate networks', () => {
    const link = {
      network: 'linkedin',
      url: 'https://www.linkedin.com/company/example/',
      enabled: false,
    };
    expect(parseSocialLinks(JSON.stringify([link, link]))).toEqual([link]);
  });
  it('reads the saved configuration from the published content snapshot', () => {
    const links = [{ network: 'youtube', url: 'https://www.youtube.com/@example', enabled: true }];
    const state = stateFromApi({} as ApiCms, [
      { key: 'site.social-links', body: JSON.stringify(links) } as ApiSiteContent,
    ]);
    expect(state.socialLinks).toEqual(links);
    expect(parseSocialLinks('invalid')).toEqual([]);
  });
});
