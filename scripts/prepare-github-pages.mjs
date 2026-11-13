import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';

// Angular prerenders every public route to its own index.html with the published CMS content
// and its SEO tags already inside. This step only adds what a static host needs around them:
// a build id, the client-rendered fallbacks for private routes and the 404 page.
const outputDir = resolve(process.argv[2] ?? 'dist/app-eldronenlasopa-web/browser');

async function htmlFiles(directory) {
  const found = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) found.push(...(await htmlFiles(path)));
    else if (entry.name.endsWith('.html')) found.push(path);
  }
  return found;
}

const home = await readFile(resolve(outputDir, 'index.html'), 'utf8').catch(() => {
  throw new Error(`No se encontró el index.html prerenderizado en ${outputDir}.`);
});
// A publish that could not read the CMS would replace the live site with empty pages.
if (home.includes('<app-cms-placeholder') || !/<h1[\s>]/.test(home))
  throw new Error(
    'La portada se prerenderizó sin contenido del CMS (¿API inaccesible durante el build?). Publicación cancelada.',
  );

const productionEnvironment = await readFile(
  resolve('src/environments/environment.prod.ts'),
  'utf8',
);
const apiOrigin = new URL(productionEnvironment.match(/apiUrl:\s*['"]([^'"]+)['"]/)[1]).origin;
const buildId = new Date().toISOString();
const headExtras =
  `  <link rel="preconnect" href="${escapeAttribute(apiOrigin)}" crossorigin>\n` +
  `  <meta name="build-id" content="${buildId}">\n</head>`;

const pages = await htmlFiles(outputDir);
for (const page of pages)
  await writeFile(page, (await readFile(page, 'utf8')).replace('</head>', headExtras));

// The sitemap lists exactly what was prerendered, so new CMS records reach search engines with
// the publish that creates their page.
const seoService = await readFile(resolve('src/app/core/services/seo.service.ts'), 'utf8');
const siteUrl = seoService.match(/SITE_URL\s*=\s*['"]([^'"]+)['"]/)[1].replace(/\/$/, '');
const sitemapUrls = [];
for (const page of pages.filter((path) => path.endsWith('index.html'))) {
  const html = await readFile(page, 'utf8');
  if (/<meta\b[^>]*name="robots"[^>]*content="[^"]*\bnoindex\b/i.test(html)) continue;
  const path = relative(outputDir, page).split(sep).join('/').replace(/\/?index\.html$/, '');
  sitemapUrls.push(path ? `${siteUrl}/${path}` : `${siteUrl}/`);
}
sitemapUrls.sort();
const sitemapEntries = sitemapUrls.map(
  (url) => `  <url><loc>${escapeAttribute(url)}</loc></url>`,
);
await writeFile(
  resolve(outputDir, 'sitemap.xml'),
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...sitemapEntries,
    '</urlset>',
    '',
  ].join('\n'),
);

// Private areas depend on the visitor's session: they get the client-rendered shell, never
// prerendered content, and are kept out of search results.
const shell = await readFile(resolve(outputDir, 'index.csr.html'), 'utf8');
const privateRoutes = [
  ['restablecer-contrasena', 'Restablecer contraseña | Jaytech'],
  ['login', 'Acceso de clientes | Jaytech'],
  ['olvide-password', 'Recuperar contraseña | Jaytech'],
  ['restablecer-password', 'Restablecer contraseña | Jaytech'],
  ['loader', 'Cargando | Jaytech'],
  ['cursos/checkout', 'Checkout de cursos | Jaytech'],
  ['panel-cliente', 'Panel de cliente | Jaytech'],
  ['panel-cliente/tickets/nuevo', 'Nuevo ticket | Jaytech'],
  ['admin', 'Administración | Jaytech'],
  ['admin/contenido', 'CMS | Jaytech'],
];

function escapeAttribute(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function privateHtml(title) {
  return shell
    .replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`)
    .replace(
      /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i,
      '<meta name="robots" content="noindex, nofollow">',
    )
    .replace(/<link rel="(?:canonical|alternate)"[^>]*>\s*/gi, '');
}

for (const [path, title] of privateRoutes) {
  const routeDirectory = resolve(outputDir, path);
  await mkdir(routeDirectory, { recursive: true });
  await writeFile(resolve(routeDirectory, 'index.html'), privateHtml(title));
}

// GitHub Pages serves 404.html for any path without a file: unknown URLs and records created
// after the last publish both boot the app there and are resolved by the client router.
await writeFile(resolve(outputDir, '404.html'), privateHtml('Jaytech'));
await writeFile(resolve(outputDir, 'version.json'), JSON.stringify({ buildId }));
await writeFile(resolve(outputDir, '.nojekyll'), '');

console.log(
  `GitHub Pages preparado: ${outputDir} (${buildId}, ${sitemapUrls.length} páginas prerenderizadas en el sitemap, ${privateRoutes.length} rutas privadas)`,
);
