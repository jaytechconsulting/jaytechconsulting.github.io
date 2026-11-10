import { Icon } from '../../data-display/icon/icon';
import { SOCIAL_NETWORKS } from '../../../core/cms/social-links';
import { RouterLink } from '@angular/router';
import { Component, computed, inject } from '@angular/core';
import { Wordmark } from '../../brand/wordmark/wordmark';
import { CmsContentService } from '../../../core/cms/cms-content.service';

/** Dark marketing footer with columns and fine print. */
@Component({
  selector: 'app-footer',
  imports: [Wordmark, RouterLink, Icon],
  templateUrl: './footer.html',
})
export class Footer {
  private readonly cms = inject(CmsContentService);

  legalRoute(label: string): string | null {
    const normalized = label
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
    if (['terminos', 'terminos y condiciones'].includes(normalized))
      return '/terminos-y-condiciones';
    if (['aviso legal', 'avisos legales'].includes(normalized)) return '/avisos-legales';
    if (['reclamos', 'libro de reclamaciones'].includes(normalized))
      return '/libro-de-reclamaciones';
    return null;
  }

  readonly socialLinks = computed(() =>
    this.cms
      .socialLinks()
      .filter((link) => link.enabled)
      .map((link) => ({
        ...link,
        label: SOCIAL_NETWORKS.find((network) => network.value === link.network)!.label,
      })),
  );
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
