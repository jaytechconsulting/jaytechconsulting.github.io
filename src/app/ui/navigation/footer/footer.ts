import { Component, computed, inject } from '@angular/core';
import { Wordmark } from '../../brand/wordmark/wordmark';
import { CmsContentService } from '../../../core/cms/cms-content.service';

/** Dark marketing footer with columns and fine print. */
@Component({
  selector: 'app-footer',
  imports: [Wordmark],
  templateUrl: './footer.html',
})
export class Footer {
  private readonly cms = inject(CmsContentService);

  readonly footer = this.cms.footer;
  readonly columns = computed(() =>
    this.footer().columns.map((column) => ({
      title: column.title,
      items: column.links
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
    })),
  );
}
