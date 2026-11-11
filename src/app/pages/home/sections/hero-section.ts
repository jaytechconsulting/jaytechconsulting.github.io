import { isBrowser } from '../../../core/platform';
import { Component, afterNextRender, computed, inject, signal } from '@angular/core';
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

  constructor() {
    afterNextRender(() => this.videoMounted.set(true));
  }

  goToProposal(): void {
    this.router.navigateByUrl('/solicitar-propuesta');
  }
}
