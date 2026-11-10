import type { CatalogItem } from './catalog.models';
export function catalogValueValid(rule: CatalogItem | undefined, value: string): boolean {
  if (!rule) return false;
  if (
    (rule.minLength !== null && value.length < rule.minLength) ||
    (rule.maxLength !== null && value.length > rule.maxLength)
  )
    return false;
  if (rule.inputKind === 'digits' && !/^[0-9]+$/.test(value)) return false;
  if (
    rule.inputKind === 'integer' ||
    rule.inputKind === 'decimal' ||
    rule.minValue !== null ||
    rule.maxValue !== null
  ) {
    if (!/^[+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)$/.test(value)) return false;
    const number = Number(value);
    if (!Number.isFinite(number) || (rule.inputKind === 'integer' && !Number.isInteger(number)))
      return false;
    if (
      (rule.minValue !== null && number < rule.minValue) ||
      (rule.maxValue !== null && number > rule.maxValue)
    )
      return false;
  }
  return true;
}
