const soles = new Intl.NumberFormat('es-PE', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});
/** Preserve the site's S/ notation and reuse the formatter between renders. */
export function formatSoles(value: number): string {
  return `S/ ${soles.format(value)}`;
}
