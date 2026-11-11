import { isBrowser } from '../../../core/platform';
import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
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
  readonly reducedMotion =
    isBrowser && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Single hero CTA — reuses the header's admin-configurable button text (Admin → Cabecera web). */
  readonly ctaLabel = computed(() => this.cms.header().cta);

  /**
   * The decorative video is created in the browser, never prerendered: Safari leaves a video that
   * arrived in the HTML paused after hydration, while one created by the app autoplays.
   */
  readonly videoMounted = signal(false);

  private readonly video = viewChild<ElementRef<HTMLVideoElement>>('heroVideo');

  constructor() {
    afterNextRender(() => this.videoMounted.set(true));

    // Do not rely on the autoplay attribute alone. Safari decides whether a video may start
    // on its own from its muted state at that instant, and can refuse one whose muted flag was
    // set by script: start it explicitly, and if the browser still refuses (autoplay disabled,
    // low power mode), start it on the visitor's first interaction with the page.
    const destroyRef = inject(DestroyRef);
    let stopWaiting = () => {};
    destroyRef.onDestroy(() => stopWaiting());
    effect(() => {
      const video = this.video()?.nativeElement;
      stopWaiting();
      if (!video || this.reducedMotion) return;
      video.muted = true;
      video.defaultMuted = true;
      const start = () => video.play();
      start().catch(() => {
        const events = ['pointerdown', 'keydown', 'touchend'] as const;
        const resume = () => {
          stopWaiting();
          start().catch(() => undefined);
        };
        stopWaiting = () => {
          for (const event of events) document.removeEventListener(event, resume);
          stopWaiting = () => {};
        };
        for (const event of events) document.addEventListener(event, resume, { passive: true });
      });
    });
  }

  goToProposal(): void {
    this.router.navigateByUrl('/solicitar-propuesta');
  }
}
