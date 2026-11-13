import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

export const SITE_URL = 'https://jaytechconsulting.github.io';
const DEFAULT_IMAGE = `${SITE_URL}/jaytech-social.jpg`;

// Commit de prueba
export interface SeoConfig {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: 'website' | 'article';
  index?: boolean;
  structuredData?: Record<string, unknown> | Record<string, unknown>[];
}

const ORGANIZATION_SCHEMA = {
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: 'Jaytech',
  legalName: 'Jaytech',
  url: `${SITE_URL}/`,
  logo: `${SITE_URL}/favicon.svg`,
  email: 'hola@dronlab.pe',
  telephone: '+51 993 908 435',
  areaServed: 'PE',
  knowsAbout: ['Aplicaciones web', 'Páginas web', 'Automatizaciones', 'Integraciones API'],
};

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private initialized = false;

  init(): void {
    if (this.initialized) return;
    this.initialized = true;

    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event) => {
      let activeRoute = this.router.routerState.root;
      while (activeRoute.firstChild) activeRoute = activeRoute.firstChild;

      const config = activeRoute.snapshot.data['seo'] as SeoConfig | undefined;
      if (!config) return;
      const path = (event as NavigationEnd).urlAfterRedirects.split(/[?#]/, 1)[0];
      this.update({ ...config, path });
    });
  }

  update(config: SeoConfig): void {
    const canonicalUrl = this.absoluteUrl(config.path ?? this.router.url);
    const imageUrl = this.absoluteUrl(config.image || DEFAULT_IMAGE);
    const robots = config.index === false ? 'noindex, nofollow' : 'index, follow, max-image-preview:large';

    this.title.setTitle(config.title);
    this.meta.updateTag({ name: 'description', content: config.description });
    this.meta.updateTag({ name: 'robots', content: robots });
    this.meta.updateTag({ name: 'author', content: 'Jaytech' });

    this.meta.updateTag({ property: 'og:locale', content: 'es_PE' });
    this.meta.updateTag({ property: 'og:site_name', content: 'Jaytech' });
    this.meta.updateTag({ property: 'og:type', content: config.type ?? 'website' });
    this.meta.updateTag({ property: 'og:title', content: config.title });
    this.meta.updateTag({ property: 'og:description', content: config.description });
    this.meta.updateTag({ property: 'og:url', content: canonicalUrl });
    this.meta.updateTag({ property: 'og:image', content: imageUrl });
    this.meta.updateTag({ property: 'og:image:secure_url', content: imageUrl });
    if (imageUrl === DEFAULT_IMAGE) {
      this.meta.updateTag({ property: 'og:image:type', content: 'image/jpeg' });
      this.meta.updateTag({ property: 'og:image:width', content: '1200' });
      this.meta.updateTag({ property: 'og:image:height', content: '630' });
    } else {
      this.meta.removeTag('property="og:image:type"');
      this.meta.removeTag('property="og:image:width"');
      this.meta.removeTag('property="og:image:height"');
    }
    this.meta.updateTag({ property: 'og:image:alt', content: 'Jaytech, software y automatizaciones a medida' });

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: config.title });
    this.meta.updateTag({ name: 'twitter:description', content: config.description });
    this.meta.updateTag({ name: 'twitter:image', content: imageUrl });
    this.meta.updateTag({ name: 'twitter:image:alt', content: 'Jaytech, software y automatizaciones a medida' });

    this.setLink('canonical', canonicalUrl);
    this.setLink('alternate', canonicalUrl, 'es-PE');
    this.setLink('alternate', canonicalUrl, 'x-default');
    this.setStructuredData(config, canonicalUrl, imageUrl);
  }

  private absoluteUrl(value: string): string {
    if (/^https?:\/\//.test(value)) return value;
    const path = value.split(/[?#]/, 1)[0];
    return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  }

  private setLink(rel: string, href: string, hrefLang?: string): void {
    const selector = hrefLang ? `link[rel="${rel}"][hreflang="${hrefLang}"]` : `link[rel="${rel}"]:not([hreflang])`;
    let link = this.document.head.querySelector<HTMLLinkElement>(selector);
    if (!link) {
      link = this.document.createElement('link');
      link.rel = rel;
      if (hrefLang) link.hreflang = hrefLang;
      this.document.head.appendChild(link);
    }
    link.href = href;
  }

  private setStructuredData(config: SeoConfig, canonicalUrl: string, imageUrl: string): void {
    let script = this.document.getElementById('seo-structured-data') as HTMLScriptElement | null;
    if (!script) {
      script = this.document.createElement('script');
      script.id = 'seo-structured-data';
      script.type = 'application/ld+json';
      this.document.head.appendChild(script);
    }

    const pageId = canonicalUrl.endsWith('/') ? `${canonicalUrl}#webpage` : `${canonicalUrl}/#webpage`;
    const pageSchema: Record<string, unknown> = {
      '@type': config.type === 'article' ? 'CreativeWork' : 'WebPage',
      '@id': pageId,
      url: canonicalUrl,
      name: config.title,
      description: config.description,
      inLanguage: 'es-PE',
      isPartOf: { '@id': `${SITE_URL}/#website` },
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: imageUrl,
        ...(imageUrl === DEFAULT_IMAGE ? { width: 1200, height: 630 } : {}),
      },
    };
    const websiteSchema = {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: 'Jaytech',
      inLanguage: 'es-PE',
      publisher: { '@id': `${SITE_URL}/#organization` },
    };
    const extra = Array.isArray(config.structuredData) ? config.structuredData : config.structuredData ? [config.structuredData] : [];
    const graph = config.index === false ? [pageSchema] : [ORGANIZATION_SCHEMA, websiteSchema, pageSchema, ...extra];
    script.text = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
  }
}
