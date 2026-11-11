/**
 * False while the public pages are prerendered at build time (Node has no window).
 * Guard browser-only work with it: storage, timers, observers, scroll and media queries.
 */
export const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';
