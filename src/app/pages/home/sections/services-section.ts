import { Component, inject } from '@angular/core';
import { Card } from '../../../ui/data-display/card/card';
import { CmsContentService } from '../../../core/cms-content.service';
import { Reveal } from '../../../core/directives/reveal';

@Component({
  selector: 'app-services-section',
  imports: [Card, Reveal],
  templateUrl: './services-section.html',
})
export class ServicesSection {
  private readonly cms = inject(CmsContentService);

  readonly services = this.cms.services;
  readonly content = this.cms.section('services');
}
