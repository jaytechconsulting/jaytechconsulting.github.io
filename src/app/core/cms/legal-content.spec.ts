import { stateFromApi } from './cms.mappers';
import type { ApiCms, ApiSiteContent } from '../models/api.models';

const content = (id: string, body: string): ApiSiteContent => ({
  id,
  key: `page.${id}`,
  title: 'Documento aprobado',
  body,
  status: 1,
  updatedAt: '2026-11-10T00:00:00Z',
});

describe('Legal page content', () => {
  it('keeps both documents separate and preserves their paragraph breaks', () => {
    const state = stateFromApi({} as ApiCms, [
      content(
        'terminos-y-condiciones',
        JSON.stringify({ description: 'Condiciones', content: 'Uno\n\nDos' }),
      ),
      content(
        'avisos-legales',
        JSON.stringify({ description: 'Titular', content: 'Aviso independiente' }),
      ),
    ]);
    expect(state.pages['terminos-y-condiciones'].content).toBe('Uno\n\nDos');
    expect(state.pages['avisos-legales'].content).toBe('Aviso independiente');
  });
  it('loads reference copy when there is no saved document', () => {
    const state = stateFromApi({} as ApiCms, []);
    expect(state.pages['terminos-y-condiciones'].content).toContain('Servicios y cotizaciones');
    expect(state.pages['avisos-legales'].content).toContain('Cookies y analítica');
  });
  it('ignores malformed document content and keeps legacy page descriptions', () => {
    const state = stateFromApi({} as ApiCms, [
      content(
        'avisos-legales',
        JSON.stringify({ description: 'Resumen', content: { html: 'invalid' } }),
      ),
      content('terminos-y-condiciones', 'invalid json'),
    ]);
    expect(state.pages['avisos-legales'].description).toBe('Resumen');
    expect(state.pages['avisos-legales'].content).toBe('');
    expect(state.pages['terminos-y-condiciones'].content ?? '').toBe('');
  });
});
