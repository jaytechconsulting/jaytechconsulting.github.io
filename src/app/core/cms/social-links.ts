export const SOCIAL_NETWORKS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'github', label: 'GitHub' },
] as const;
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number]['value'];
export interface SocialLink {
  network: SocialNetwork;
  url: string;
  enabled: boolean;
}
export const EXAMPLE_SOCIAL_LINKS: SocialLink[] = [
  { network: 'instagram', url: 'https://www.instagram.com/', enabled: true },
  { network: 'facebook', url: 'https://www.facebook.com/', enabled: true },
  { network: 'linkedin', url: 'https://www.linkedin.com/', enabled: true },
  { network: 'youtube', url: 'https://www.youtube.com/', enabled: true },
  { network: 'github', url: 'https://github.com/', enabled: true },
];
export function socialUrlValid(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !!url.hostname && !url.username && !url.password;
  } catch {
    return false;
  }
}
export function parseSocialLinks(body: string | undefined): SocialLink[] {
  if (body === undefined) return EXAMPLE_SOCIAL_LINKS.map((link) => ({ ...link }));
  try {
    const links: unknown = JSON.parse(body);
    if (!Array.isArray(links)) return [];
    return links
      .filter(
        (item): item is SocialLink =>
          !!item &&
          typeof item === 'object' &&
          SOCIAL_NETWORKS.some((network) => network.value === item.network) &&
          typeof item.url === 'string' &&
          socialUrlValid(item.url) &&
          typeof item.enabled === 'boolean',
      )
      .filter(
        (item, index, items) =>
          items.findIndex((other) => other.network === item.network) === index,
      );
  } catch {
    return [];
  }
}
