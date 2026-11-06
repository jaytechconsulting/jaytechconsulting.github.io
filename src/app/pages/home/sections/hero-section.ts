import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Button } from '../../../ui/actions/button/button';
import { CmsContentService } from '../../../core/cms-content.service';
import { ThemeService } from '../../../core/theme.service';

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
  readonly stack = computed(() => this.content().items.split('\n').map((item) => item.trim()).filter(Boolean));
  readonly theme = this.themeService.theme;
  readonly heroAnimation = this.cms.heroAnimation;
  readonly reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  goToProposal(): void {
    this.router.navigateByUrl('/solicitar-propuesta');
  }

  goToProjects(): void {
    this.router.navigateByUrl('/proyectos');
  }

  goToClientArea(): void {
    this.router.navigateByUrl('/login');
  }
}
