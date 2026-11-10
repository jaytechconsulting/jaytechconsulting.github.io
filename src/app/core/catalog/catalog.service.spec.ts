import { catalogValueValid } from './catalog.validation';
import type { CatalogItem } from './catalog.models';
const base: CatalogItem = {
  id: 1,
  code: 'TEST',
  name: 'Test',
  order: 1,
  inputKind: 'text',
  minLength: 4,
  maxLength: 8,
  minValue: null,
  maxValue: null,
};
describe('Catalog-driven validation', () => {
  it('enforces configured length rather than fixed document rules', () => {
    expect(catalogValueValid(base, '123')).toBe(false);
    expect(catalogValueValid(base, '123456789')).toBe(false);
    expect(catalogValueValid(base, '001234')).toBe(true);
    expect(catalogValueValid({ ...base, minLength: 10, maxLength: 12 }, '1234567890')).toBe(true);
  });
  it('honors input kind and configured numeric bounds', () => {
    expect(catalogValueValid({ ...base, inputKind: 'digits' }, 'ABC123')).toBe(false);
    const rule = {
      ...base,
      inputKind: 'integer' as const,
      minLength: null,
      maxLength: null,
      minValue: 5,
      maxValue: 10,
    };
    expect(catalogValueValid(rule, '4')).toBe(false);
    expect(catalogValueValid(rule, '11')).toBe(false);
    expect(catalogValueValid(rule, '7.5')).toBe(false);
    expect(catalogValueValid(rule, '7')).toBe(true);
    expect(catalogValueValid({ ...rule, inputKind: 'decimal' }, '7.5')).toBe(true);
  });
  it('does not accept missing catalog details', () => {
    expect(catalogValueValid(undefined, '1234')).toBe(false);
  });
});
