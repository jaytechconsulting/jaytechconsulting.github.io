export interface AnnouncementVisibility {
  banner: boolean;
  message: boolean;
  images: boolean;
  buttons: boolean;
  countdown: boolean;
}
export interface AnnouncementImage {
  id: string;
  src: string;
  alt: string;
  position: 'before' | 'after';
  width: number;
  mobileVisible: boolean;
  desktopVisible: boolean;
}
export interface AnnouncementCountdown {
  enabled: boolean;
  endsAt: string;
  label: string;
  expiredAction: 'hide' | 'message';
  expiredMessage: string;
}
export interface AnnouncementButton {
  label: string;
  href: string;
  variant: 'solid' | 'outline';
  newTab: boolean;
  mobileVisible?: boolean;
  desktopVisible?: boolean;
}
export interface Announcement {
  message: string;
  linkLabel: string;
  linkHref: string;
  active: boolean;
  backgroundColor: string;
  backgroundImage: string;
  mediaType: 'color' | 'image' | 'animation';
  animation: 'aurora' | 'gradient' | 'orbits';
  imageX: number;
  imageY: number;
  imageZoom: number;
  overlay: number;
  minHeight: number;
  buttons: AnnouncementButton[];
  inlineImages: AnnouncementImage[];
  visibility: { mobile: AnnouncementVisibility; desktop: AnnouncementVisibility };
  mobileLayout: 'inline' | 'stacked';
  countdown: AnnouncementCountdown;
}
export function validAnnouncementImage(value: string): boolean {
  if (value.startsWith('data:'))
    return (
      value.length <= 1400000 &&
      /^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)
    );
  return (value.startsWith('/') || value.startsWith('https://')) && validAnnouncementHref(value);
}
export function validAnnouncementHref(value: string): boolean {
  if (!value || value.length > 2048 || /[\\\s]/.test(value)) return false;
  if (value.startsWith('#')) return true;
  if (value.startsWith('/') && !value.startsWith('//')) {
    try {
      const decoded = decodeURIComponent(value);
      return !decoded.startsWith('//') && !/[\\\s]/.test(decoded);
    } catch {
      return false;
    }
  }
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}
const clamp = (value: unknown, fallback: number, min: number, max: number) =>
  typeof value === 'number' && Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : fallback;
export function normalizeAnnouncement(value: Partial<Announcement>): Announcement {
  const legacy: AnnouncementButton[] = value.linkHref
    ? [
        {
          label: value.linkLabel || 'Ver más',
          href: value.linkHref,
          variant: 'outline' as const,
          newTab: false,
        },
      ]
    : [];
  const buttons = (Array.isArray(value.buttons) ? value.buttons : legacy)
    .filter(
      (b) =>
        b &&
        typeof b.label === 'string' &&
        typeof b.href === 'string' &&
        validAnnouncementHref(b.href),
    )
    .slice(0, 5)
    .map((b) => ({
      label: b.label.slice(0, 60),
      href: b.href,
      variant: b.variant === 'solid' ? ('solid' as const) : ('outline' as const),
      newTab: b.newTab === true,
      mobileVisible: b.mobileVisible !== false,
      desktopVisible: b.desktopVisible !== false,
    }));
  return {
    message: value.message || '',
    linkLabel: value.linkLabel || '',
    linkHref: value.linkHref || '',
    active: value.active === true,
    backgroundImage: value.backgroundImage || '',
    backgroundColor: /^#[a-f\d]{6}$/i.test(value.backgroundColor || '')
      ? value.backgroundColor!
      : '',
    mediaType: ['color', 'image', 'animation'].includes(value.mediaType || '')
      ? value.mediaType!
      : value.backgroundImage
        ? 'image'
        : 'color',
    animation: ['aurora', 'gradient', 'orbits'].includes(value.animation || '')
      ? value.animation!
      : 'aurora',
    imageX: clamp(value.imageX, 50, 0, 100),
    imageY: clamp(value.imageY, 50, 0, 100),
    imageZoom: clamp(value.imageZoom, 1, 1, 3),
    overlay: clamp(value.overlay, 45, 0, 85),
    minHeight: clamp(value.minHeight, 48, 40, 180),
    buttons,
    inlineImages: (Array.isArray(value.inlineImages) ? value.inlineImages : [])
      .filter((i) => i && typeof i.src === 'string')
      .slice(0, 3)
      .map((i, index) => ({
        id: typeof i.id === 'string' ? i.id : `image-${index}`,
        src: validAnnouncementImage(i.src) ? i.src : '',
        alt: typeof i.alt === 'string' ? i.alt.slice(0, 160) : '',
        position: i.position === 'after' ? 'after' : 'before',
        width: clamp(i.width, 72, 32, 200),
        mobileVisible: i.mobileVisible !== false,
        desktopVisible: i.desktopVisible !== false,
      })),
    visibility: {
      mobile: normalizeVisibility(value.visibility?.mobile),
      desktop: normalizeVisibility(value.visibility?.desktop),
    },
    mobileLayout: value.mobileLayout === 'inline' ? 'inline' : 'stacked',
    countdown: {
      enabled: value.countdown?.enabled === true,
      endsAt: typeof value.countdown?.endsAt === 'string' ? value.countdown.endsAt : '',
      label:
        typeof value.countdown?.label === 'string'
          ? value.countdown.label.slice(0, 80)
          : 'Termina en',
      expiredAction: value.countdown?.expiredAction === 'message' ? 'message' : 'hide',
      expiredMessage:
        typeof value.countdown?.expiredMessage === 'string'
          ? value.countdown.expiredMessage.slice(0, 200)
          : 'Esta promoción ha finalizado',
    },
  };
}

function normalizeVisibility(
  value: Partial<AnnouncementVisibility> | undefined,
): AnnouncementVisibility {
  return {
    banner: value?.banner !== false,
    message: value?.message !== false,
    images: value?.images !== false,
    buttons: value?.buttons !== false,
    countdown: value?.countdown !== false,
  };
}
