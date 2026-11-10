import { Component, computed, inject } from '@angular/core';
import { CmsContentService } from '../../../core/cms/cms-content.service';
import { Reveal } from '../../../ui/behaviors/reveal';

@Component({
  selector: 'app-clients-section',
  imports: [Reveal],
  templateUrl: './clients-section.html',
})
export class ClientsSection {
  private readonly cms = inject(CmsContentService);

  readonly clients = this.cms.companies;
  readonly content = this.cms.section('clients');
  readonly stats = computed<[string, string][]>(() =>
    this.content()
      .items.split('\n')
      .map((line) => {
        const [value, label] = line.split('|').map((part) => part.trim());
        return [value, label || ''] as [string, string];
      })
      .filter(([value]) => Boolean(value)),
  );
}
