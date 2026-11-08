import { Component, input } from '@angular/core';

export type PaymentBadgeName = 'visa' | 'mastercard' | 'amex' | 'diners' | 'yape' | 'plin' | 'pagoefectivo' | 'cuotealo';

/** Official payment-method logo chip (sourced from Culqi's public logo assets, self-hosted under public/payment-logos). */
@Component({
  selector: 'app-payment-badge',
  templateUrl: './payment-badge.html',
})
export class PaymentBadge {
  readonly name = input.required<PaymentBadgeName>();
}
