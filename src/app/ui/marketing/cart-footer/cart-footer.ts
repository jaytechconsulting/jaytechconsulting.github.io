import { formatSoles } from '../../../core/formatting/money';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import { Button } from '../../actions/button/button';
import { CartService } from '../../../core/commerce/cart.service';

/** Persistent "cotizador" bar: visible site-wide while the cart has items.
 * Pulses briefly whenever a course is added, so the add feels like it "lands" here. */
@Component({
  selector: 'app-cart-footer',
  imports: [Button],
  templateUrl: './cart-footer.html',
  styleUrl: './cart-footer.css',
})
export class CartFooter {
  private readonly router = inject(Router);
  readonly cart = inject(CartService);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  readonly visible = computed(
    () => !this.cart.isEmpty() && !this.url().split('?')[0].startsWith('/cursos'),
  );

  readonly pulsing = signal(false);
  private lastCount = this.cart.count();

  constructor() {
    effect(() => {
      const count = this.cart.count();
      if (count > this.lastCount) {
        this.pulsing.set(false);
        requestAnimationFrame(() => this.pulsing.set(true));
        setTimeout(() => this.pulsing.set(false), 420);
      }
      this.lastCount = count;
    });
  }

  readonly formatPrice = formatSoles;

  onAction(): void {
    this.router.navigate(['/cursos']);
  }
}
