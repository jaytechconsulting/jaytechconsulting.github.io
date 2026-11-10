/* Start only published content before Angular; never send a session cookie. */
(() => {
  if (window.__publicSiteBootstrap || typeof fetch !== 'function') return;
  const endpoint = document.querySelector('meta[name="public-site-endpoint"]')?.content;
  if (!endpoint) return;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  const entry = { url: endpoint, startedAt: performance.now(), result: null };
  // Resolve failures as values so a failure before Angular starts cannot become
  // an unhandled rejection. Angular restores the normal HTTP error channel.
  entry.result = fetch(endpoint, {
    credentials: 'omit',
    mode: 'cors',
    cache: 'no-cache',
    headers: { Accept: 'application/json' },
    signal: controller.signal,
  }).then(async (response) => ({
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    body: await response.json(),
  })).catch(() => ({ ok: false, status: 0, statusText: 'Network error', body: null }))
    .finally(() => clearTimeout(timer));
  window.__publicSiteBootstrap = entry;
})();
