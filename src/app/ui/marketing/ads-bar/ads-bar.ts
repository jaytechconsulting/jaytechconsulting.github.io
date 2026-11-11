import { Component, computed, inject, signal } from '@angular/core';
import { AnnouncementBanner } from '../announcement-banner/announcement-banner';
import { CmsContentService } from '../../../core/cms/cms-content.service';
import { isBrowser } from '../../../core/platform';

const DISMISS_KEY = 'jaytech-announcement-dismissed';

/** Promo/announcement strip above the header. Content and visibility are
 * managed from the admin CMS (site.announcement content key); visitors can
 * additionally dismiss it for the current message only — it reappears if
 * the admin publishes a new one. */
@Component({
  selector: 'app-ads-bar',
  imports: [AnnouncementBanner],
  templateUrl: './ads-bar.html',
})
export class AdsBar {
  private readonly cms = inject(CmsContentService);
  private readonly dismissed = signal<string | null>(
    isBrowser ? localStorage.getItem(DISMISS_KEY) : null,
  );

  readonly announcement = this.cms.announcement;
  readonly visible = computed(() => {
    const a = this.announcement();
    return a.active && a.message.trim().length > 0 && this.dismissed() !== a.message;
  });

  dismiss(): void {
    const message = this.announcement().message;
    localStorage.setItem(DISMISS_KEY, message);
    this.dismissed.set(message);
  }
}
