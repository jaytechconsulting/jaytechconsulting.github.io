import type { HomeSection } from './home-sections';
import type { SocialLink } from './social-links';
import type { Announcement } from '../models/announcement';

export interface CmsCompany {
  id?: string;
  name: string;
  sector: string;
  result: string;
  logo: string;
  glyph: string;
  color: string;
  isPublished?: string;
  displayOrder?: string;
}

export interface CmsReview {
  id?: string;
  name: string;
  role: string;
  company: string;
  quote: string;
  rating: string;
  photo: string;
  color: string;
  status?: string;
  displayOrder?: string;
}

export interface CmsServiceItem {
  id?: string;
  title: string;
  body: string;
  image: string;
  glyph: string;
  color: string;
  isPublished?: string;
  displayOrder?: string;
}

export interface CmsProjectItem {
  id?: string;
  slug?: string;
  title: string;
  client: string;
  cat: string;
  year: string;
  metric: string;
  logo: string;
  summary: string;
  challenge: string;
  solution: string;
  color: string;
  progress?: string;
  status?: string;
  tags?: string;
  isPublished?: string;
  displayOrder?: string;
}

export interface CmsPlan {
  id?: string;
  name: string;
  price: string;
  description: string;
  features: string;
  featured: string;
  cta: string;
  image: string;
  isPublished?: string;
  displayOrder?: string;
}

export interface CmsTeamMember {
  id?: string;
  name: string;
  role: string;
  bio: string;
  photo: string;
  linkedin: string;
  color: string;
  isPublished?: string;
  displayOrder?: string;
}

export type CmsSectionId = 'hero' | 'clients' | 'services' | 'reviews' | 'courses' | 'faq';

export interface CmsPageSection {
  id: CmsSectionId;
  name: string;
  eyebrow: string;
  title: string;
  highlight: string;
  description: string;
  items: string;
  image: string;
}

export type CmsHeaderLinkVariant = '' | 'primary' | 'outline';

export interface CmsHeaderLink {
  label: string;
  href: string;
  variant: CmsHeaderLinkVariant;
}

export interface CmsFooterColumn {
  title: string;
  links: string;
}

export interface CmsAnnouncement extends Partial<Announcement> {
  message: string;
  linkLabel: string;
  linkHref: string;
  active: boolean;
  backgroundColor: string;
  backgroundImage: string;
}

export type CmsPageDesignId =
  | 'proyectos'
  | 'propuesta'
  | 'login'
  | 'asesorias'
  | 'capacitaciones'
  | 'conocenos'
  | 'terminos-y-condiciones'
  | 'avisos-legales';

export interface CmsPageDesign {
  content?: string;
  heading: string;
  description: string;
  backgroundColor: string;
  backgroundImage: string;
}

export interface CmsLoaderConfig {
  enabled: boolean;
  color: string;
}

export interface CmsHeroAnimation {
  mode?: 'video' | 'image' | 'none';
  enabled: boolean;
  videoUrl: string;
}

export interface CmsContentState {
  socialLinks: SocialLink[];
  companies: CmsCompany[];
  reviews: CmsReview[];
  services: CmsServiceItem[];
  projects: CmsProjectItem[];
  plans: CmsPlan[];
  teamMembers: CmsTeamMember[];
  sections: CmsPageSection[];
  homeSectionOrder: HomeSection['id'][];
  announcement: CmsAnnouncement;
  pages: Record<CmsPageDesignId, CmsPageDesign>;
  loader: CmsLoaderConfig;
  heroAnimation: CmsHeroAnimation;
  header: {
    links: CmsHeaderLink[];
    cta: string;
  };
  footer: {
    about: string;
    email: string;
    phone: string;
    columns: CmsFooterColumn[];
  };
}

export type CmsCollectionKey =
  'companies' | 'reviews' | 'services' | 'projects' | 'plans' | 'sections' | 'teamMembers';
export type CmsEntityItem = Record<string, string>;
