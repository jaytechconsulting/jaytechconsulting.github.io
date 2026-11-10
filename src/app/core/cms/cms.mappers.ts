import { parseSocialLinks } from './social-links';
import { normalizeAnnouncement, type Announcement } from '../models/announcement';
import type {
  ApiCms,
  ApiCompany,
  ApiPlan,
  ApiProject,
  ApiReview,
  ApiServiceItem,
  ApiSiteContent,
  ApiTeamMember,
} from '../models/api.models';
import type {
  CmsCompany,
  CmsReview,
  CmsServiceItem,
  CmsProjectItem,
  CmsPlan,
  CmsTeamMember,
  CmsHeaderLinkVariant,
  CmsAnnouncement,
  CmsPageDesignId,
  CmsPageDesign,
  CmsContentState,
} from './cms.models';
import { cloneState, DEFAULT_STATE } from './cms.defaults';

function text(value: string | null | undefined): string {
  return value ?? '';
}

function toHeaderLinkVariant(value: string | null | undefined): CmsHeaderLinkVariant {
  return value === 'primary' || value === 'outline' ? value : '';
}

function parseAnnouncementDetails(body: string): Partial<Announcement> {
  try {
    const value: unknown = JSON.parse(body || '{}');
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Partial<Announcement>)
      : {};
  } catch {
    return {};
  }
}

function parsePageDesignDetails(body: string): {
  description: string;
  backgroundColor: string;
  content?: string;
} {
  try {
    const parsed = JSON.parse(body || '{}') as Partial<{
      description: string;
      content: string;
      backgroundColor: string;
    }>;
    return {
      description: parsed.description ?? '',
      backgroundColor: parsed.backgroundColor ?? '',
      content: typeof parsed.content === 'string' ? parsed.content : '',
    };
  } catch {
    return { description: '', backgroundColor: '' };
  }
}

function parseLoaderDetails(body: string): { color: string } {
  try {
    const parsed = JSON.parse(body || '{}') as Partial<{ color: string }>;
    return { color: parsed.color ?? '' };
  } catch {
    return { color: '' };
  }
}

function parseHeroAnimationDetails(body: string): { videoUrl: string } {
  try {
    const parsed = JSON.parse(body || '{}') as Partial<{ videoUrl: string }>;
    return { videoUrl: parsed.videoUrl ?? '' };
  } catch {
    return { videoUrl: '' };
  }
}

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function toCompany(item: ApiCompany): CmsCompany {
  return {
    id: item.id,
    name: item.name,
    sector: text(item.sector),
    result: text(item.result),
    logo: text(item.logoUrl),
    glyph: text(item.glyph) || '◧',
    color: text(item.accentColor) || '#FF6B35',
    isPublished: String(item.isPublished),
    displayOrder: String(item.displayOrder),
  };
}

function toReview(item: ApiReview): CmsReview {
  return {
    id: item.id,
    name: item.authorName,
    role: text(item.role),
    company: text(item.companyName),
    quote: item.body,
    rating: String(item.rating),
    photo: text(item.photoUrl),
    color: text(item.accentColor) || '#FF6B35',
    status: String(item.status),
    displayOrder: String(item.displayOrder),
  };
}

function toService(item: ApiServiceItem): CmsServiceItem {
  return {
    id: item.id,
    title: item.title,
    body: item.body,
    image: '',
    glyph: text(item.glyph) || '◆',
    color: text(item.accentColor) || '#FF6B35',
    isPublished: String(item.isPublished),
    displayOrder: String(item.displayOrder),
  };
}

function toProject(item: ApiProject): CmsProjectItem {
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    client: item.clientName,
    cat: item.category,
    year: String(item.year),
    metric: text(item.metric),
    logo: text(item.imageUrl),
    summary: item.description,
    challenge: text(item.challenge),
    solution: text(item.solution),
    color: text(item.accentColor) || '#FF6B35',
    progress: String(item.progress),
    status: item.status,
    tags: (item.tags ?? []).join('\n'),
    isPublished: String(item.isPublished ?? true),
    displayOrder: String(item.displayOrder ?? 0),
  };
}

function toPlan(item: ApiPlan): CmsPlan {
  return {
    id: item.id,
    name: item.name,
    price: item.price,
    description: item.description,
    features: (item.features ?? []).join('\n'),
    featured: item.isFeatured ? 'Sí' : 'No',
    cta: item.cta,
    image: '',
    isPublished: String(item.isPublished),
    displayOrder: String(item.displayOrder),
  };
}

function toTeamMember(item: ApiTeamMember): CmsTeamMember {
  return {
    id: item.id,
    name: item.name,
    role: item.role,
    bio: item.bio,
    photo: text(item.photoUrl),
    linkedin: text(item.linkedinUrl),
    color: text(item.accentColor) || '#FF6B35',
    isPublished: String(item.isPublished),
    displayOrder: String(item.displayOrder),
  };
}

export function stateFromApi(cms: ApiCms, content: ApiSiteContent[]): CmsContentState {
  const defaults = cloneState();
  return {
    companies: (cms.companies ?? []).map(toCompany),
    reviews: (cms.reviews ?? []).map(toReview),
    services: (cms.services ?? []).map(toService),
    projects: (cms.projects ?? []).map(toProject),
    plans: (cms.plans ?? []).map(toPlan),
    teamMembers: (cms.teamMembers ?? []).map(toTeamMember),
    sections: defaults.sections.map((section) => {
      const stored = content.find((item) => item.key === `home.${section.id}`);
      return stored
        ? {
            ...section,
            title: text(stored.title),
            description: text(stored.body),
            image: text(stored.imageUrl),
          }
        : {
            ...section,
            eyebrow: '',
            title: '',
            highlight: '',
            description: '',
            items: '',
            image: '',
          };
    }),
    socialLinks: parseSocialLinks(content.find((item) => item.key === 'site.social-links')?.body),
    announcement: announcementFromApi(content),
    pages: (() => {
      const ids: CmsPageDesignId[] = [
        'proyectos',
        'propuesta',
        'login',
        'asesorias',
        'capacitaciones',
        'conocenos',
        'terminos-y-condiciones',
        'avisos-legales',
      ];
      const result = {} as Record<CmsPageDesignId, CmsPageDesign>;
      for (const id of ids) {
        const stored = content.find((item) => item.key === `page.${id}`);
        if (!stored) {
          result[id] =
            id === 'terminos-y-condiciones' || id === 'avisos-legales'
              ? { ...defaults.pages[id] }
              : { heading: '', description: '', backgroundColor: '', backgroundImage: '' };
          continue;
        }
        const details = parsePageDesignDetails(stored.body);
        result[id] = {
          heading: text(stored.title),
          description: details.description,
          ...(details.content !== undefined ? { content: details.content } : {}),
          backgroundColor: details.backgroundColor,
          backgroundImage: text(stored.imageUrl),
        };
      }
      return result;
    })(),
    loader: (() => {
      const stored = content.find((item) => item.key === 'site.loader');
      if (!stored) return defaults.loader;
      const details = parseLoaderDetails(stored.body);
      return { enabled: stored.status === 1, color: details.color };
    })(),
    heroAnimation: (() => {
      const stored = content.find((item) => item.key === 'home.heroAnimation');
      if (!stored) return defaults.heroAnimation;
      const details = parseHeroAnimationDetails(stored.body);
      return { enabled: stored.status === 1, videoUrl: details.videoUrl };
    })(),
    header: {
      cta: cms.header?.cta ?? '',
      links: (cms.header?.links ?? []).map((link) => ({
        label: link.label,
        href: link.href,
        variant: toHeaderLinkVariant(link.variant),
      })),
    },
    footer: {
      about: cms.footer?.about ?? '',
      email: cms.footer?.email ?? '',
      phone: cms.footer?.phone ?? '',
      columns: (cms.footer?.columns ?? []).map((column) => ({
        title: column.title,
        links: (column.links ?? []).join('\n'),
      })),
    },
  };
}

function announcementFromApi(content: ApiSiteContent[]): CmsAnnouncement {
  const stored = content.find((item) => item.key === 'site.announcement');
  if (!stored) return { ...DEFAULT_STATE.announcement };
  const details = parseAnnouncementDetails(stored.body);
  return normalizeAnnouncement({
    ...details,
    message: stored.title || '',
    backgroundImage: text(stored.imageUrl),
    active: stored.status === 1,
  });
}
