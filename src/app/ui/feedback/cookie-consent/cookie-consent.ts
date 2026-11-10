import { Icon } from '../../data-display/icon/icon';
import { Component, inject, signal } from '@angular/core';
import { CookieConsentService } from '../../../core/services/cookie-consent.service';
import { Button } from '../../actions/button/button';
import { Checkbox } from '../../forms/checkbox/checkbox';

@Component({
  selector: 'app-cookie-consent',
  imports: [Button, Checkbox, Icon],
  templateUrl: './cookie-consent.html',
  styleUrl: './cookie-consent.css',
})
export class CookieConsent {
  readonly consent = inject(CookieConsentService);
  readonly analytics = signal(false);
  customize(): void {
    this.analytics.set(this.consent.choice()?.analytics ?? false);
    this.consent.open();
  }
}
