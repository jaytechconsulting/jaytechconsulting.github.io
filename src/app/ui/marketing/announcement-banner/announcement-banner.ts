import { isBrowser } from '../../../core/platform';
import { Component, computed, input, output, effect, signal } from '@angular/core';
import { normalizeAnnouncement, type Announcement } from '../../../core/models/announcement';
import { Icon } from '../../data-display/icon/icon';
@Component({
  selector: 'app-announcement-banner',
  imports: [Icon],
  templateUrl: './announcement-banner.html',
  styleUrl: './announcement-banner.css',
})
export class AnnouncementBanner {
  readonly config = input.required<Partial<Announcement>>();
  readonly preview = input(false);
  readonly dismissible = input(false);
  readonly dismissed = output<void>();
  readonly design = computed(() => normalizeAnnouncement(this.config()));
  readonly now = signal(Date.now());
  readonly expired = computed(
    () =>
      this.design().countdown.enabled &&
      Number.isFinite(Date.parse(this.design().countdown.endsAt)) &&
      Date.parse(this.design().countdown.endsAt) <= this.now(),
  );
  readonly remaining = computed(() => {
    const seconds =
      Math.max(0, Math.ceil((Date.parse(this.design().countdown.endsAt) - this.now()) / 1000)) || 0;
    return [
      {
        value: Math.floor(seconds / 86400)
          .toString()
          .padStart(2, '0'),
        label: 'días',
      },
      {
        value: Math.floor((seconds % 86400) / 3600)
          .toString()
          .padStart(2, '0'),
        label: 'h',
      },
      {
        value: Math.floor((seconds % 3600) / 60)
          .toString()
          .padStart(2, '0'),
        label: 'min',
      },
      { value: (seconds % 60).toString().padStart(2, '0'), label: 's' },
    ];
  });
  readonly countdownText = computed(() => {
    const [days, hours, minutes, seconds] = this.remaining();
    return `${Number(days.value) > 0 ? Number(days.value) + 'd ' : ''}${hours.value}:${minutes.value}:${seconds.value}`;
  });
  readonly endLabel = computed(() => {
    const end = Date.parse(this.design().countdown.endsAt);
    return Number.isFinite(end)
      ? 'Finaliza el ' +
          new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(end)
      : '';
  });
  readonly beforeImages = computed(() =>
    this.design().inlineImages.filter((i) => i.position === 'before'),
  );
  readonly afterImages = computed(() =>
    this.design().inlineImages.filter((i) => i.position === 'after'),
  );
  constructor() {
    effect((onCleanup) => {
      const countdown = this.design().countdown;
      if (!countdown.enabled || !Number.isFinite(Date.parse(countdown.endsAt))) return;
      this.now.set(Date.now());
      if (!isBrowser || Date.parse(countdown.endsAt) <= Date.now()) return;
      const timer = setInterval(() => {
        this.now.set(Date.now());
        if (Date.parse(countdown.endsAt) <= Date.now()) clearInterval(timer);
      }, 1000);
      const sync = () => this.now.set(Date.now());
      document.addEventListener('visibilitychange', sync);
      onCleanup(() => {
        clearInterval(timer);
        document.removeEventListener('visibilitychange', sync);
      });
    });
  }
  readonly imageStyle = computed(() => ({
    'background-image': `url(${JSON.stringify(this.design().backgroundImage)})`,
    'background-position': `${this.design().imageX}% ${this.design().imageY}%`,
    transform: `scale(${this.design().imageZoom})`,
    'transform-origin': `${this.design().imageX}% ${this.design().imageY}%`,
  }));
}
