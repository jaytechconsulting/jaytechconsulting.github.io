import { Component, computed, inject } from '@angular/core';
import { ContactForm } from '../../../ui/forms/contact-form/contact-form';
import { ApiService } from '../../../core/api.service';
import { DialogService } from '../../../core/services/dialog.service';
import { ToastService } from '../../../core/services/toast.service';
import type { ContactFormValue } from '../../../ui/forms/contact-form/contact-form';
import { CmsContentService } from '../../../core/cms-content.service';

@Component({ selector: 'app-contact-section', imports: [ContactForm], templateUrl: './contact-section.html' })
export class ContactSection {
  private readonly api = inject(ApiService);
  private readonly dialog = inject(DialogService);
  private readonly toast = inject(ToastService);
  private readonly cms = inject(CmsContentService);
  private submitting = false;
  readonly content = this.cms.section('contact');
  readonly highlights = computed(() => this.content().items.split('\n').map((item) => item.trim()).filter(Boolean));

  async submit(value: ContactFormValue): Promise<void> {
    if (this.submitting) return;

    const confirmed = await this.dialog.confirm({
      tone: 'brand',
      title: '¿Enviar información de contacto?',
      message: 'Revisaremos tus datos y te responderemos en menos de 24 horas.',
      confirmLabel: 'Enviar mensaje',
      cancelLabel: 'Revisar datos',
    });
    if (!confirmed) return;

    this.submitting = true;
    try {
      this.api.createContact({ name: value.name, company: null, email: value.email, message: `${value.service}: ${value.message}` }).subscribe({
        next: () => {
          this.submitting = false;
          this.toast.success('Mensaje enviado', 'Te responderemos en menos de 24 horas.');
        },
        error: () => {
          this.submitting = false;
          this.toast.error('No pudimos enviar el mensaje', 'Inténtalo nuevamente en unos momentos.');
        },
      });
    } catch {
      this.submitting = false;
      this.toast.error('No pudimos validar tu solicitud', 'Inténtalo nuevamente en unos momentos.');
    }
  }
}
