import { ImageFile } from '../../../../ui/behaviors/image-file';
import { Wordmark } from '../../../../ui/brand/wordmark/wordmark';
import { ThemeService } from '../../../../core/services/theme.service';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import {
  normalizeAnnouncement,
  validAnnouncementHref,
  validAnnouncementImage,
  type AnnouncementImage,
  type AnnouncementVisibility,
  type AnnouncementCountdown,
  type Announcement,
  type AnnouncementButton,
} from '../../../../core/models/announcement';
import { AccessAction } from '../../../../ui/behaviors/access-action';
import { ToastService } from '../../../../core/services/toast.service';
import { Button } from '../../../../ui/actions/button/button';
import { Card } from '../../../../ui/data-display/card/card';
import { Icon } from '../../../../ui/data-display/icon/icon';
import { Input } from '../../../../ui/forms/input/input';
import { Textarea } from '../../../../ui/forms/textarea/textarea';
import { Select } from '../../../../ui/forms/select/select';
import { Checkbox } from '../../../../ui/forms/checkbox/checkbox';
import { AnnouncementBanner } from '../../../../ui/marketing/announcement-banner/announcement-banner';
@Component({
  selector: 'app-announcement-editor',
  imports: [
    ImageFile,
    Wordmark,
    AccessAction,
    Button,
    Card,
    Icon,
    Input,
    Textarea,
    Select,
    Checkbox,
    AnnouncementBanner,
  ],
  templateUrl: './announcement-editor.html',
  styleUrl: './announcement-editor.css',
})
export class AnnouncementEditor {
  readonly value = input.required<Partial<Announcement>>();
  readonly saving = input(false);
  readonly save = output<Announcement>();
  readonly draft = signal<Announcement>(normalizeAnnouncement({}));
  readonly mobilePreview = signal(false);
  readonly imageSourceVersion = signal(0);
  readonly submitted = signal(false);
  readonly theme = inject(ThemeService);
  private readonly toast = inject(ToastService);

  private sourceFingerprint?: string;
  readonly mediaOptions = [
    { value: 'color', label: 'Color' },
    { value: 'image', label: 'Imagen / GIF' },
    { value: 'animation', label: 'Animación' },
  ];
  readonly animationOptions = [
    { value: 'aurora', label: 'Aurora' },
    { value: 'gradient', label: 'Degradado en movimiento' },
    { value: 'orbits', label: 'Órbitas' },
  ];
  readonly buttonOptions = [
    { value: 'solid', label: 'Sólido' },
    { value: 'outline', label: 'Contorno' },
  ];
  readonly palette = ['#4654FF', '#0F172A', '#7C3AED', '#0E7490', '#BE185D', '#047857'];
  readonly positionOptions = [
    { value: 'before', label: 'Antes del texto' },
    { value: 'after', label: 'Después del texto' },
  ];
  readonly layoutOptions = [
    { value: 'stacked', label: 'Apilado y centrado' },
    { value: 'inline', label: 'En línea, con ajuste automático' },
  ];
  readonly expiryOptions = [
    { value: 'hide', label: 'Ocultar el banner' },
    { value: 'message', label: 'Mostrar mensaje de finalización' },
  ];
  readonly screens = [
    { key: 'desktop', label: 'Escritorio' },
    { key: 'mobile', label: 'Móvil (hasta 600 px)' },
  ] as const;
  readonly visibilityRows = [
    { key: 'banner', label: 'Banner completo' },
    { key: 'message', label: 'Texto' },
    { key: 'images', label: 'Imágenes adicionales' },
    { key: 'buttons', label: 'Botones' },
    { key: 'countdown', label: 'Temporizador' },
  ] as const;
  readonly timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  readonly endsAtLocal = computed(() => {
    const date = new Date(this.draft().countdown.endsAt);
    if (!Number.isFinite(date.getTime())) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  });
  readonly errors = computed(() => {
    const d = this.draft(),
      errors: string[] = [];
    if (!d.message.trim() || d.message.length > 500)
      errors.push('Escribe un mensaje de hasta 500 caracteres.');
    if (d.mediaType === 'image' && !d.backgroundImage)
      errors.push('Selecciona una imagen para el fondo.');
    if (
      d.buttons.some(
        (b) => !b.label.trim() || b.label.length > 60 || !validAnnouncementHref(b.href),
      )
    )
      errors.push(
        'Cada botón necesita un texto de hasta 60 caracteres y un enlace HTTPS, una ruta interna o un ancla válidos.',
      );
    if (d.inlineImages.some((i) => !validAnnouncementImage(i.src) || i.alt.length > 160))
      errors.push(
        'Cada imagen adicional necesita un archivo o enlace válido y una descripción de hasta 160 caracteres.',
      );
    if (
      d.countdown.enabled &&
      (!Number.isFinite(Date.parse(d.countdown.endsAt)) ||
        Date.parse(d.countdown.endsAt) >= Date.parse('2100-01-01T00:00:00Z'))
    )
      errors.push('Selecciona una fecha y hora de finalización válidas, anteriores al año 2100.');
    if (
      d.countdown.label.length > 80 ||
      d.countdown.expiredMessage.length > 200 ||
      (d.countdown.expiredAction === 'message' && !d.countdown.expiredMessage.trim())
    )
      errors.push(
        'El temporizador admite un título de hasta 80 caracteres y un mensaje final de entre 1 y 200 caracteres.',
      );
    return errors;
  });
  constructor() {
    effect(() => {
      const value = this.value(),
        fingerprint = JSON.stringify(value);
      if (fingerprint === this.sourceFingerprint) return;
      this.sourceFingerprint = fingerprint;
      this.imageSourceVersion.update((version) => version + 1);

      this.draft.set(normalizeAnnouncement(value));
      this.submitted.set(false);
    });
  }
  set<K extends keyof Announcement>(key: K, value: Announcement[K]): void {
    this.draft.update((d) => ({ ...d, [key]: value }));
  }
  setMedia(value: string): void {
    if (['color', 'image', 'animation'].includes(value))
      this.set('mediaType', value as Announcement['mediaType']);
  }
  setAnimation(value: string): void {
    if (['aurora', 'gradient', 'orbits'].includes(value))
      this.set('animation', value as Announcement['animation']);
  }
  number(key: 'imageX' | 'imageY' | 'imageZoom' | 'overlay' | 'minHeight', event: Event): void {
    this.set(key, Number((event.target as HTMLInputElement).value));
  }
  resetImage(): void {
    this.draft.update((d) => ({ ...d, imageX: 50, imageY: 50, imageZoom: 1 }));
  }
  clearImage(): void {
    this.set('backgroundImage', '');
    this.resetImage();
  }
  addButton(): void {
    if (this.draft().buttons.length < 5)
      this.draft.update((d) => ({
        ...d,
        buttons: [...d.buttons, { label: '', href: '', variant: 'solid', newTab: false }],
      }));
  }
  changeButton(index: number, key: keyof AnnouncementButton, value: string | boolean): void {
    this.draft.update((d) => ({
      ...d,
      buttons: d.buttons.map((b, i) => (i === index ? { ...b, [key]: value } : b)),
    }));
  }
  removeButton(index: number): void {
    this.draft.update((d) => ({ ...d, buttons: d.buttons.filter((_, i) => i !== index) }));
  }
  moveButton(index: number, direction: number): void {
    const buttons = [...this.draft().buttons],
      other = index + direction;
    if (other < 0 || other >= buttons.length) return;
    [buttons[index], buttons[other]] = [buttons[other], buttons[index]];
    this.set('buttons', buttons);
  }
  upload(image: string): void {
    this.set('backgroundImage', image);
    this.set('mediaType', 'image');
    this.resetImage();
  }
  imageUploadError(message: string): void {
    this.toast.error('Imagen no válida', message);
  }
  readonly imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  addInlineImage(): void {
    if (this.draft().inlineImages.length < 3)
      this.set('inlineImages', [
        ...this.draft().inlineImages,
        {
          id: crypto.randomUUID(),
          src: '',
          alt: '',
          position: 'before',
          width: 72,
          mobileVisible: true,
          desktopVisible: true,
        },
      ]);
  }
  changeInlineImage<K extends keyof AnnouncementImage>(
    id: string,
    key: K,
    value: AnnouncementImage[K],
  ): void {
    this.set(
      'inlineImages',
      this.draft().inlineImages.map((i) => (i.id === id ? { ...i, [key]: value } : i)),
    );
  }
  removeInlineImage(id: string): void {
    this.set(
      'inlineImages',
      this.draft().inlineImages.filter((i) => i.id !== id),
    );
  }
  uploadInline(image: string, id: string): void {
    this.changeInlineImage(id, 'src', image);
  }
  changeVisibility(
    screen: 'mobile' | 'desktop',
    key: keyof AnnouncementVisibility,
    value: boolean,
  ): void {
    const visibility = this.draft().visibility;
    this.set('visibility', { ...visibility, [screen]: { ...visibility[screen], [key]: value } });
  }
  setCountdown<K extends keyof AnnouncementCountdown>(
    key: K,
    value: AnnouncementCountdown[K],
  ): void {
    this.set('countdown', { ...this.draft().countdown, [key]: value });
  }
  setEndsAt(value: string): void {
    const date = new Date(value);
    this.setCountdown('endsAt', Number.isFinite(date.getTime()) ? date.toISOString() : '');
  }
  private drag?: {
    x: number;
    y: number;
    startX: number;
    startY: number;
    width: number;
    height: number;
  };
  startDrag(event: PointerEvent): void {
    if (this.draft().mediaType !== 'image' || !this.draft().backgroundImage || event.button !== 0)
      return;
    event.preventDefault();
    const el = event.currentTarget as HTMLElement;
    el.setPointerCapture(event.pointerId);
    this.drag = {
      x: event.clientX,
      y: event.clientY,
      startX: this.draft().imageX,
      startY: this.draft().imageY,
      width: el.clientWidth,
      height: el.clientHeight,
    };
  }
  moveDrag(event: PointerEvent): void {
    if (!this.drag) return;
    const d = this.drag;
    this.set(
      'imageX',
      Math.max(0, Math.min(100, d.startX - ((event.clientX - d.x) / Math.max(d.width, 1)) * 100)),
    );
    this.set(
      'imageY',
      Math.max(0, Math.min(100, d.startY - ((event.clientY - d.y) / Math.max(d.height, 1)) * 100)),
    );
  }
  endDrag(): void {
    this.drag = undefined;
  }
  submit(): void {
    this.submitted.set(true);
    if (this.saving() || this.errors().length) return;
    const d = this.draft();
    this.save.emit({
      ...d,
      message: d.message.trim(),
      buttons: d.buttons.map((b) => ({ ...b, label: b.label.trim(), href: b.href.trim() })),
      linkLabel: d.buttons[0]?.label.trim() || '',
      linkHref: d.buttons[0]?.href.trim() || '',
    });
  }
}
