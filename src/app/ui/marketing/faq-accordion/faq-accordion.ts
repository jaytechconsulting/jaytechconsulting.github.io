import { Component, input, signal } from '@angular/core';
import { Reveal } from '../../behaviors/reveal';

export interface FaqItem {
  question: string;
  answer: string;
}

/** Numbered accordion for FAQ lists — smooth grid-rows expand, one open at a time. */
@Component({
  selector: 'app-faq-accordion',
  imports: [Reveal],
  templateUrl: './faq-accordion.html',
})
export class FaqAccordion {
  readonly items = input.required<FaqItem[]>();

  readonly openIndex = signal<number | null>(0);

  toggle(index: number): void {
    this.openIndex.update((current) => (current === index ? null : index));
  }
}
