export interface BackgroundMedia {
  backgroundImage?: string;
  backgroundColor?: string;
}
/** Shared background treatment; no dependency on CMS or page components. */
export function backgroundStyle(media: BackgroundMedia): Record<string, string> {
  if (media.backgroundImage)
    return {
      'background-image': `linear-gradient(rgba(11,15,26,0.72), rgba(11,15,26,0.72)), url(${JSON.stringify(media.backgroundImage)})`,
      'background-size': 'cover',
      'background-position': 'center',
    };
  return media.backgroundColor ? { background: media.backgroundColor } : {};
}
