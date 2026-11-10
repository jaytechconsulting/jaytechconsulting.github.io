import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { PricingCard } from '../../../ui/marketing/pricing-card/pricing-card';
import { CmsContentService } from '../../../core/cms/cms-content.service';
import { Reveal } from '../../../ui/behaviors/reveal';

@Component({
  selector: 'app-pricing-section',
  imports: [PricingCard, Reveal],
  templateUrl: './pricing-section.html',
})
export class PricingSection {
  private readonly router = inject(Router);
  private readonly cms = inject(CmsContentService);

  readonly plans = this.cms.plans;
  readonly content = this.cms.section('pricing');

  goToProposal(): void {
    this.router.navigateByUrl('/solicitar-propuesta');
  }

  features(planFeatures: string): string[] {
    return planFeatures
      .split('\n')
      .map((feature) => feature.trim())
      .filter(Boolean);
  }
}
