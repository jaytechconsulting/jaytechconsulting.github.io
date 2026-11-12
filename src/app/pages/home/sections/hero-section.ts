import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  afterRenderEffect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { Button } from '../../../ui/actions/button/button';
import { CmsContentService } from '../../../core/cms/cms-content.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-hero-section',
  imports: [Button],
  templateUrl: './hero-section.html',
})
export class HeroSection {
  private readonly router = inject(Router);
  private readonly cms = inject(CmsContentService);
  private readonly themeService = inject(ThemeService);

  readonly content = this.cms.section('hero');
  readonly stack = computed(() =>
    this.content()
      .items.split('\n')
      .map((item) => item.trim())
      .filter(Boolean),
  );
  readonly theme = this.themeService.theme;
  readonly heroAnimation = this.cms.heroAnimation;
  readonly ctaLabel = computed(() => this.cms.header().cta);
  readonly videoAllowed = signal(false);
  readonly videoSrc = computed(() => this.heroAnimation().videoUrl ||
    (this.theme() === 'dark' ? 'hero/hero-oscuro.mp4' : 'hero/hero-claro.mp4'));

  private readonly video = viewChild<ElementRef<HTMLVideoElement>>('heroVideo');

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const desktop = matchMedia('(min-width: 821px)');
      const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
      const update = () => this.videoAllowed.set(desktop.matches && !reducedMotion.matches);
      update();
      desktop.addEventListener('change', update);
      reducedMotion.addEventListener('change', update);
      destroyRef.onDestroy(() => {
        desktop.removeEventListener('change', update);
        reducedMotion.removeEventListener('change', update);
      });
    });

    afterRenderEffect((onCleanup) => {
      const video = this.video()?.nativeElement;
      if (!video) return;

      video.defaultMuted = true;
      video.muted = true;

      const document = video.ownerDocument;
      const events = ['click', 'touchend', 'keydown'] as const;
      let active = true;
      const removeListeners = () => {
        for (const event of events) document.removeEventListener(event, resume);
      };
      const resume = () => {
        removeListeners();
        if (video.paused) void video.play().catch(() => undefined);
      };

      onCleanup(() => {
        active = false;
        removeListeners();
      });

      // Native autoplay handles visibility. Retry on interaction if the browser requires one.
      void video.play().catch((error: DOMException) => {
        if (!active || error.name !== 'NotAllowedError') return;
        for (const event of events) document.addEventListener(event, resume, { passive: true });
      });
    });
  }

  goToProposal(): void {
    this.router.navigateByUrl('/solicitar-propuesta');
  }
}
