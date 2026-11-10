import { formatSoles } from '../../../core/formatting/money';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Header } from '../../../ui/navigation/header/header';
import { Footer } from '../../../ui/navigation/footer/footer';
import { Button } from '../../../ui/actions/button/button';
import { Icon } from '../../../ui/data-display/icon/icon';
import { WhatsAppFab } from '../../../ui/marketing/whatsapp-fab/whatsapp-fab';
import { Reveal } from '../../../ui/behaviors/reveal';
import { CmsContentService } from '../../../core/cms/cms-content.service';
import { CartService } from '../../../core/commerce/cart.service';

/** Course "cotizador": review the courses you've picked, remove any, add more, then continue to checkout. */
@Component({
  selector: 'app-course-quote',
  imports: [Header, Footer, Button, Icon, WhatsAppFab, Reveal],
  templateUrl: './course-quote.html',
})
export class CourseQuote {
  private readonly router = inject(Router);
  private readonly cms = inject(CmsContentService);
  readonly cart = inject(CartService);

  readonly header = this.cms.header;

  requestProposal(): void {
    this.router.navigate(['/solicitar-propuesta']);
  }

  readonly formatPrice = formatSoles;

  addMore(): void {
    this.router.navigate(['/capacitaciones'], { fragment: 'cursos-virtuales' });
  }

  goToCheckout(): void {
    if (this.cart.isEmpty()) return;
    this.router.navigate(['/cursos/checkout']);
  }
}
