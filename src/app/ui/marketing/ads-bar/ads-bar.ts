import { Component, computed, inject, signal } from '@angular/core';
import { CmsContentService } from '../../../core/cms-content.service';

const DISMISS_KEY = 'jaytech-announcement-dismissed';

/** Promo/announcement strip above the header. Content and visibility are
 * managed from the admin CMS (site.announcement content key); visitors can
 * additionally dismiss it for the current message only — it reappears if
 * the admin publishes a new one. */
@Component({
  selector: 'app-ads-bar',
  templateUrl: './ads-bar.html',
})
export class AdsBar {
  private readonly cms = inject(CmsContentService);
  private readonly dismissed = signal<string | null>(localStorage.getItem(DISMISS_KEY));

  readonly announcement = this.cms.announcement;
  readonly visible = computed(() => {
    const a = this.announcement();
    return a.active && a.message.trim().length > 0 && this.dismissed() !== a.message;
  });

  readonly barStyle = computed(() => {
    const a = this.announcement();
    if (a.backgroundImage) {
      return {
        'background-image': `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url(${a.backgroundImage})`,
        'background-size': 'cover',
        'background-position': 'center',
      };
    }
    if (a.backgroundColor) {
      return { background: a.backgroundColor };
    }
    return {};
  });

  dismiss(): void {
    const message = this.announcement().message;
    localStorage.setItem(DISMISS_KEY, message);
    this.dismissed.set(message);
  }
}
