import { isBrowser } from '../../core/platform';
import { CmsPlaceholder } from '../../ui/feedback/cms-placeholder/cms-placeholder';
import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  viewChild,
  computed,
} from '@angular/core';
import { Router } from '@angular/router';
import { Header } from '../../ui/navigation/header/header';
import { Footer } from '../../ui/navigation/footer/footer';
import { WhatsAppFab } from '../../ui/marketing/whatsapp-fab/whatsapp-fab';
import { AdsBar } from '../../ui/marketing/ads-bar/ads-bar';
import { CmsContentService } from '../../core/cms/cms-content.service';
import { HeroSection } from './sections/hero-section';
import { ClientsSection } from './sections/clients-section';
import { ServicesSection } from './sections/services-section';
import { PricingSection } from './sections/pricing-section';
import { ReviewsSection } from './sections/reviews-section';
import { ContactSection } from './sections/contact-section';

@Component({
  selector: 'app-home',
  imports: [
    CmsPlaceholder,
    Header,
    Footer,
    WhatsAppFab,
    AdsBar,
    HeroSection,
    ClientsSection,
    ServicesSection,
    PricingSection,
    ReviewsSection,
    ContactSection,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements AfterViewInit {
  private readonly router = inject(Router);
  readonly cms = inject(CmsContentService);
  private readonly adsBarEl = viewChild.required('adsBarEl', { read: ElementRef<HTMLElement> });
  private readonly headerEl = viewChild.required('headerEl', { read: ElementRef<HTMLElement> });
  private readonly destroyRef = inject(DestroyRef);

  readonly header = this.cms.header;
  readonly ready = computed(
    () => this.cms.contentStatus() === 'ready' && this.cms.headerStatus() === 'ready',
  );
  readonly failed = computed(
    () => this.cms.contentStatus() === 'error' || this.cms.headerStatus() === 'error',
  );

  ngAfterViewInit(): void {
    if (!isBrowser) return;
    const adsBar = this.adsBarEl().nativeElement;
    const header = this.headerEl().nativeElement;
    const setHeight = () =>
      document.documentElement.style.setProperty(
        '--hero-chrome-h',
        `${adsBar.offsetHeight + header.offsetHeight}px`,
      );
    setHeight();
    const observer = new ResizeObserver(setHeight);
    observer.observe(adsBar);
    observer.observe(header);
    this.destroyRef.onDestroy(() => observer.disconnect());
  }

  goToProposal(): void {
    this.router.navigateByUrl('/solicitar-propuesta');
  }
}
