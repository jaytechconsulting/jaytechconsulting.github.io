import { isBrowser } from '../../../core/platform';
import { Component, ElementRef, afterNextRender, computed, inject } from '@angular/core';
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

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef);
    // The prerendered video was parsed before Angular set `muted`, and browsers such as Safari
    // only autoplay muted media: start it once the page is interactive.
    afterNextRender(() => {
      const video = host.nativeElement.querySelector('video');
      if (!video || this.reducedMotion || !video.paused) return;
      video.muted = true;
      video.play().catch(() => undefined);
    });
  }

  goToProposal(): void {
    this.router.navigateByUrl('/solicitar-propuesta');
  }
}
