import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const candidates = [
  resolve('dist/app-eldronenlasopa-web/browser'),
  resolve('dist/app-eldronenlasopa-web'),
];

let outputDir;
for (const candidate of candidates) {
  try {
    await readFile(resolve(candidate, 'index.html'));
    outputDir = candidate;
    break;
  } catch {
    // Try the next Angular output layout.
  }
}

if (!outputDir) throw new Error('No se encontró el index.html compilado de Angular.');

const indexPath = resolve(outputDir, 'index.html');
const buildId = new Date().toISOString();
const index = await readFile(indexPath, 'utf8');
// Start DNS/TLS while the browser downloads Angular, rather than after bootstrap.
const productionEnvironment = await readFile(
  resolve('src/environments/environment.prod.ts'),
  'utf8',
);
const apiUrl = productionEnvironment.match(/apiUrl:\s*['"]([^'"]+)['"]/)[1];
const apiOrigin = new URL(apiUrl).origin;
const bootstrap = await readFile(resolve('public/cms-bootstrap.js'), 'utf8');
// Inline the small bootstrap before styles and Angular so the API download starts
// with HTML parsing, without another script download on the critical path.
const withBuildId = index
  .replace(/<meta name="public-site-endpoint" content="[^"]*"\s*\/?>/,
    `<meta name="public-site-endpoint" content="${escapeAttribute(apiUrl.replace(/\/$/, '') + '/public-site')}">\n  <link rel="preconnect" href="${escapeAttribute(apiOrigin)}" crossorigin>`)
  .replace(/<script src="\/cms-bootstrap.js"><\/script>/,
    `<script>${bootstrap.replaceAll('</script', '<\\/script')}</script>`)
  .replace('</head>', `  <meta name="build-id" content="${buildId}">\n</head>`);

const siteUrl = 'https://eldronenlasopa.github.io';
const defaultImage = `${siteUrl}/og-cover.jpg`;
const publicRoutes = [
  { path: 'terminos-y-condiciones', title: 'Términos y condiciones | Jaytech', description: 'Condiciones de uso del sitio web de Jaytech.' },
  { path: 'avisos-legales', title: 'Avisos legales | Jaytech', description: 'Información legal del sitio web de Jaytech.' },
  {
    path: 'proyectos',
    title: 'Proyectos de software y automatización | DronLab',
    description:
      'Conoce proyectos de aplicaciones web, landings, automatizaciones e integraciones desarrollados por DronLab para empresas.',
  },
  {
    path: 'proyectos/comercial-andina-panel-de-inventario',
    title: 'Panel de inventario para Comercial Andina | DronLab',
    description:
      'Control de stock en tiempo real con alertas y reportes, desarrollado por DronLab para Comercial Andina.',
    type: 'article',
  },
  {
    path: 'proyectos/estudio-vega-automatizacion-de-facturas',
    title: 'Automatización de facturas para Estudio Vega | DronLab',
    description:
      'Emisión y envío de comprobantes conectando ventas con la SUNAT, desarrollado por DronLab para Estudio Vega.',
    type: 'article',
  },
  {
    path: 'solicitar-propuesta',
    title: 'Solicita una propuesta de software | DronLab',
    description:
      'Cuéntanos tu proyecto de software, página web, automatización o integración y recibe una primera propuesta de alcance y presupuesto.',
  },
];
const privateRoutes = [
  ['restablecer-contrasena', 'Restablecer contrasena | DronLab'],
  ['login', 'Acceso de clientes | DronLab'],
  ['olvide-password', 'Recuperar contraseña | DronLab'],
  ['restablecer-password', 'Restablecer contraseña | DronLab'],
  ['loader', 'Cargando | DronLab'],
  ['panel-cliente', 'Panel de cliente | DronLab'],
  ['panel-cliente/tickets/nuevo', 'Nuevo ticket | DronLab'],
  ['admin', 'Administración | DronLab'],
  ['admin/contenido', 'CMS | DronLab'],
].map(([path, title]) => ({ path, title, description: 'Área privada de DronLab.', index: false }));

function escapeAttribute(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function replaceMeta(html, attribute, name, content) {
  const pattern = new RegExp(`<meta\\s+${attribute}="${name}"\\s+content="[^"]*"\\s*\\/?>`, 'i');
  const tag = `<meta ${attribute}="${name}" content="${escapeAttribute(content)}">`;
  return pattern.test(html)
    ? html.replace(pattern, tag)
    : html.replace('</head>', `  ${tag}\n</head>`);
}

function routeHtml(source, route) {
  const canonical = route.path ? `${siteUrl}/${route.path}` : `${siteUrl}/`;
  const robots =
    route.index === false ? 'noindex, nofollow' : 'index, follow, max-image-preview:large';
  let html = source.replace(/<title>[^<]*<\/title>/i, `<title>${route.title}</title>`);
  html = replaceMeta(html, 'name', 'description', route.description);
  html = replaceMeta(html, 'name', 'robots', robots);
  html = replaceMeta(html, 'property', 'og:type', route.type ?? 'website');
  html = replaceMeta(html, 'property', 'og:title', route.title);
  html = replaceMeta(html, 'property', 'og:description', route.description);
  html = replaceMeta(html, 'property', 'og:url', canonical);
  html = replaceMeta(html, 'property', 'og:image', defaultImage);
  html = replaceMeta(html, 'name', 'twitter:title', route.title);
  html = replaceMeta(html, 'name', 'twitter:description', route.description);
  html = replaceMeta(html, 'name', 'twitter:image', defaultImage);
  html = html.replace(
    /<link rel="canonical" href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${canonical}">`,
  );
  html = html.replace(
    /<link rel="alternate" hreflang="es-PE" href="[^"]*"\s*\/?>/i,
    `<link rel="alternate" hreflang="es-PE" href="${canonical}">`,
  );
  html = html.replace(
    /<link rel="alternate" hreflang="x-default" href="[^"]*"\s*\/?>/i,
    `<link rel="alternate" hreflang="x-default" href="${canonical}">`,
  );
  const pageId = canonical.endsWith('/') ? `${canonical}#webpage` : `${canonical}/#webpage`;
  const pageSchema = {
    '@context': 'https://schema.org',
    '@type': route.type === 'article' ? 'CreativeWork' : 'WebPage',
    '@id': pageId,
    url: canonical,
    name: route.title,
    description: route.description,
    inLanguage: 'es-PE',
    ...(route.index === false ? {} : { creator: { '@id': `${siteUrl}/#organization` } }),
  };
  html = html.replace(
    /<script id="seo-structured-data" type="application\/ld\+json">[\s\S]*?<\/script>/i,
    `<script id="seo-structured-data" type="application/ld+json">${JSON.stringify(pageSchema).replaceAll('<', '\\u003c')}</script>`,
  );
  return html;
}

await writeFile(indexPath, withBuildId);
await writeFile(resolve(outputDir, 'version.json'), JSON.stringify({ buildId }));
for (const route of [...publicRoutes, ...privateRoutes]) {
  const routeDirectory = resolve(outputDir, route.path);
  await mkdir(routeDirectory, { recursive: true });
  await writeFile(resolve(routeDirectory, 'index.html'), routeHtml(withBuildId, route));
}

const notFound = routeHtml(withBuildId, {
  path: '',
  title: 'Página no encontrada | DronLab',
  description: 'La página solicitada no existe.',
  index: false,
});
await writeFile(resolve(outputDir, '404.html'), notFound);
await writeFile(resolve(outputDir, '.nojekyll'), '');

console.log(
  `GitHub Pages preparado: ${outputDir} (${buildId}, ${publicRoutes.length + privateRoutes.length} rutas SEO)`,
);
