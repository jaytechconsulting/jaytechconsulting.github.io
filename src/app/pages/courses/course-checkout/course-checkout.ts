import { formatSoles } from '../../../core/formatting/money';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Header } from '../../../ui/navigation/header/header';
import { Footer } from '../../../ui/navigation/footer/footer';
import { Button } from '../../../ui/actions/button/button';
import { Input } from '../../../ui/forms/input/input';
import { Breadcrumb } from '../../../ui/navigation/breadcrumb/breadcrumb';
import { WhatsAppFab } from '../../../ui/marketing/whatsapp-fab/whatsapp-fab';
import { Reveal } from '../../../ui/behaviors/reveal';
import { Icon } from '../../../ui/data-display/icon/icon';
import { CmsContentService } from '../../../core/cms/cms-content.service';
import { SeoService } from '../../../core/services/seo.service';
import { ApiService } from '../../../core/api.service';
import { CartService } from '../../../core/commerce/cart.service';
import { environment } from '../../../../environments/environment';
import type { ApiCourse } from '../../../core/models/api.models';
import {
  PaymentBadge,
  type PaymentBadgeName,
} from '../../../ui/data-display/payment-badge/payment-badge';

declare global {
  interface Window {
    Culqi?: {
      publicKey: string;
      settings: (options: {
        title: string;
        currency: string;
        amount: number;
        description?: string;
      }) => void;
      options: (options: Record<string, unknown>) => void;
      open: () => void;
      close: () => void;
      token?: { id: string };
      order?: unknown;
      error?: { user_message?: string; merchant_message?: string };
    };
    culqi?: () => void;
    VisanetCheckout?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

type CheckoutStep = 'form' | 'success';
type PaymentProvider = 'culqi' | 'niubiz' | 'mercadopago';

interface PaymentMethodOption {
  id: PaymentProvider;
  label: string;
  description: string;
  badges: PaymentBadgeName[];
}

const PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    id: 'culqi',
    label: 'Tarjeta (Culqi)',
    description: 'Pago directo con tarjeta, sin salir del sitio.',
    badges: ['visa', 'mastercard', 'diners', 'amex', 'yape', 'plin', 'pagoefectivo', 'cuotealo'],
  },
  {
    id: 'niubiz',
    label: 'Niubiz',
    description: 'Pago directo con tarjeta vía Niubiz (VisaNet).',
    badges: ['visa', 'mastercard', 'amex', 'diners'],
  },
  {
    id: 'mercadopago',
    label: 'Mercado Pago',
    description: 'Serás redirigido a Mercado Pago para completar el pago.',
    badges: ['visa', 'mastercard', 'yape', 'pagoefectivo'],
  },
];

@Component({
  selector: 'app-course-checkout',
  imports: [Header, Footer, Button, Input, Breadcrumb, WhatsAppFab, Reveal, PaymentBadge, Icon],
  templateUrl: './course-checkout.html',
})
export class CourseCheckout {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cms = inject(CmsContentService);
  private readonly seo = inject(SeoService);
  private readonly api = inject(ApiService);
  readonly cart = inject(CartService);

  readonly header = this.cms.header;
  readonly loading = signal(false);
  readonly step = signal<CheckoutStep>('form');
  readonly errorMessage = signal('');

  readonly name = signal('');
  readonly email = signal('');
  readonly summaryExpanded = signal(true);

  readonly paymentMethods = PAYMENT_METHODS;
  readonly selectedProvider = signal<PaymentProvider>('culqi');
  readonly selectedMethod = computed(() =>
    this.paymentMethods.find((m) => m.id === this.selectedProvider())!,
  );

  private readonly returningFromMercadoPago: boolean;

  readonly breadcrumb = computed(() => [
    { label: 'Inicio', href: '/' },
    { label: 'Cursos', href: '/cursos' },
    { label: 'Checkout' },
  ]);

  constructor() {
    this.seo.update({
      title: 'Checkout de cursos | Jaytech',
      description: 'Completa tu compra de cursos de Jaytech.',
      path: '/cursos/checkout',
      index: false,
    });

    const params = this.route.snapshot.queryParamMap;
    const ref = params.get('ref');
    const paymentId = params.get('payment_id');
    this.returningFromMercadoPago = !!ref;

    if (ref && paymentId) {
      this.loading.set(true);
      this.api.confirmMercadoPagoCheckout(ref, paymentId).subscribe({
        next: () => {
          this.loading.set(false);
          this.cart.clear();
          this.step.set('success');
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set(
            err?.error?.message ?? 'No pudimos confirmar tu pago. Si ya pagaste, escríbenos.',
          );
        },
      });
    } else if (ref && params.get('mpFailed')) {
      this.errorMessage.set('El pago con Mercado Pago no se completó. Puedes intentarlo de nuevo.');
    } else if (ref && params.get('mpPending')) {
      this.errorMessage.set('Tu pago con Mercado Pago está pendiente de confirmación.');
    }

    effect(() => {
      if (this.cart.isEmpty() && this.step() === 'form' && !this.returningFromMercadoPago)
        this.router.navigate(['/cursos']);
    });
  }

  requestProposal(): void {
    this.router.navigate(['/solicitar-propuesta']);
  }

  backToQuote(): void {
    this.router.navigate(['/cursos']);
  }

  toggleSummary(): void {
    this.summaryExpanded.update((v) => !v);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  selectProvider(provider: PaymentProvider): void {
    this.selectedProvider.set(provider);
  }

  readonly formatPrice = formatSoles;

  async pay(): Promise<void> {
    const courses = this.cart.courses();
    if (courses.length === 0) return;
    if (!this.name().trim() || !this.email().trim()) {
      this.errorMessage.set('Completa tu nombre y correo para continuar.');
      return;
    }
    this.errorMessage.set('');

    switch (this.selectedProvider()) {
      case 'culqi':
        await this.payCulqi(courses);
        break;
      case 'niubiz':
        await this.payNiubiz(courses);
        break;
      case 'mercadopago':
        this.payMercadoPago(courses);
        break;
    }
  }

  private async payCulqi(courses: ApiCourse[]): Promise<void> {
    this.loading.set(true);
    try {
      await this.loadScript('culqi', 'https://checkout.culqi.com/js/v4');
    } catch {
      this.loading.set(false);
      this.errorMessage.set('No se pudo cargar la pasarela de pago. Inténtalo nuevamente.');
      return;
    }

    const total = this.cart.total();
    const culqi = window.Culqi!;
    culqi.publicKey = environment.culqiPublicKey;
    culqi.settings({
      title: 'Jaytech',
      currency: 'PEN',
      amount: Math.round(total * 100),
      description: courses.length === 1 ? courses[0].title : `${courses.length} cursos`,
    });
    culqi.options({
      lang: 'auto',
      installments: false,
      paymentMethods: {
        tarjeta: true,
        yape: true,
        bancaMovil: false,
        agente: false,
        billetera: false,
        cuotealo: false,
      },
    });

    window.culqi = () => {
      const token = window.Culqi?.token?.id;
      if (!token) {
        this.loading.set(false);
        this.errorMessage.set(window.Culqi?.error?.user_message ?? 'No se pudo completar el pago.');
        return;
      }
      this.confirmPurchase(
        courses.map((c) => c.id),
        token,
        'culqi',
      );
    };

    culqi.open();
    this.loading.set(false);
  }

  private async payNiubiz(courses: ApiCourse[]): Promise<void> {
    this.loading.set(true);
    this.api.startNiubizSession({ courseIds: courses.map((c) => c.id) }).subscribe({
      next: async (session) => {
        try {
          await this.loadScript('niubiz', session.scriptUrl);
        } catch {
          this.loading.set(false);
          this.errorMessage.set('No se pudo cargar la pasarela de pago. Inténtalo nuevamente.');
          return;
        }

        const widget = new window.VisanetCheckout!({
          sessiontoken: session.sessionKey,
          channel: 'web',
          merchantid: session.merchantId,
          purchasenumber: session.purchaseNumber,
          amount: session.amount,
          expirationminutes: 20,
          timeouturl: window.location.href,
          formbuttoncolor: '#FF6B35',
          action: (response: { transactionToken?: string }) => {
            this.loading.set(false);
            if (!response?.transactionToken) {
              this.errorMessage.set('No se pudo completar el pago con Niubiz.');
              return;
            }
            this.confirmPurchase(
              courses.map((c) => c.id),
              response.transactionToken,
              'niubiz',
            );
          },
        });
        this.loading.set(false);
        widget.open();
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.error?.message ?? 'No se pudo iniciar el pago con Niubiz.');
      },
    });
  }

  private payMercadoPago(courses: ApiCourse[]): void {
    this.loading.set(true);
    this.api
      .startMercadoPagoCheckout({
        courseIds: courses.map((c) => c.id),
        email: this.email().trim(),
        name: this.name().trim(),
      })
      .subscribe({
        next: (res) => {
          window.location.href = res.redirectUrl;
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set(
            err?.error?.message ?? 'No se pudo iniciar el pago con Mercado Pago.',
          );
        },
      });
  }

  private confirmPurchase(courseIds: string[], token: string, provider: PaymentProvider): void {
    this.loading.set(true);
    this.api
      .checkoutCart({
        courseIds,
        token,
        email: this.email().trim(),
        name: this.name().trim(),
        provider,
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.cart.clear();
          this.step.set('success');
        },
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set(
            err?.error?.message ?? 'No se pudo procesar el pago. Inténtalo nuevamente.',
          );
        },
      });
  }

  private readonly loadedScripts = new Set<string>();

  private loadScript(key: string, src: string): Promise<void> {
    if (this.loadedScripts.has(key)) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => {
        this.loadedScripts.add(key);
        resolve();
      };
      script.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
      document.head.appendChild(script);
    });
  }
}
