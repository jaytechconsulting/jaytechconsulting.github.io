import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CmsContentService } from '../../../core/cms/cms-content.service';
import { readHomeFaqs } from '../../../core/cms/home-faqs';
import { Button } from '../../../ui/actions/button/button';
import { Reveal } from '../../../ui/behaviors/reveal';
import { WHATSAPP_HREF } from '../../../ui/marketing/whatsapp-fab/whatsapp-fab';

/** Last screen of the home: frequent questions as an accordion (one open at a time), next to a
 * card with the two ways to keep talking: request a proposal or write on WhatsApp. A light block
 * after the dark reviews band. */
@Component({
  selector: 'app-faq-section',
  imports: [Button, Reveal],
  templateUrl: './faq-section.html',
})
export class FaqSection {
  private readonly router = inject(Router);

  readonly content = inject(CmsContentService).section('faq');
  readonly faqs = computed(() => readHomeFaqs(this.content().items).filter(item => item.question.trim() && item.answer.trim()));
  readonly open = signal<number | null>(0);
  readonly whatsappHref = WHATSAPP_HREF;

  toggle(index: number): void {
    this.open.update((current) => (current === index ? null : index));
  }

  position(index: number): string {
    return String(index + 1).padStart(2, '0');
  }

  goToProposal(): void {
    this.router.navigateByUrl('/solicitar-propuesta');
  }
}
