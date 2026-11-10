import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../core/api.service';
import { CmsContentService } from '../../core/cms/cms-content.service';
import { DialogService } from '../../core/services/dialog.service';
import { ToastService } from '../../core/services/toast.service';
import type { ApiComplaintBookInfo, ApiComplaintReceipt } from '../../core/models/api.models';
import { Header } from '../../ui/navigation/header/header';
import { Footer } from '../../ui/navigation/footer/footer';
import { Icon } from '../../ui/data-display/icon/icon';
import { Button } from '../../ui/actions/button/button';
import { Input } from '../../ui/forms/input/input';
import { Textarea } from '../../ui/forms/textarea/textarea';
import { Select } from '../../ui/forms/select/select';
import { Checkbox } from '../../ui/forms/checkbox/checkbox';

interface ComplaintDraft {
  fullName: string;
  documentType: string;
  documentNumber: string;
  email: string;
  phone: string;
  address: string;
  isMinor: boolean;
  guardianName: string;
  itemType: 'producto' | 'servicio';
  itemDescription: string;
  amount: string;
  orderReference: string;
  claimType: 'reclamo' | 'queja';
  detail: string;
  request: string;
  acceptsTerms: boolean;
}
type DraftField = keyof ComplaintDraft;

const EMPTY_DRAFT: ComplaintDraft = {
  fullName: '',
  documentType: 'DNI',
  documentNumber: '',
  email: '',
  phone: '',
  address: '',
  isMinor: false,
  guardianName: '',
  itemType: 'servicio',
  itemDescription: '',
  amount: '',
  orderReference: '',
  claimType: 'reclamo',
  detail: '',
  request: '',
  acceptsTerms: false,
};

const DOCUMENT_TYPES = [
  { value: 'DNI', label: 'DNI' },
  { value: 'CE', label: 'Carné de extranjería' },
  { value: 'PASAPORTE', label: 'Pasaporte' },
  { value: 'RUC', label: 'RUC' },
];

const CLAIM_TYPES = [
  {
    value: 'reclamo' as const,
    title: 'Reclamo',
    description: 'Disconformidad relacionada con los productos o servicios contratados.',
  },
  {
    value: 'queja' as const,
    title: 'Queja',
    description:
      'Malestar o descontento respecto a la atención recibida, no relacionado directamente con el producto o servicio.',
  },
];

const DOCUMENT_RULES: Record<string, { pattern: RegExp; message: string; maxLength: number }> = {
  DNI: { pattern: /^[0-9]{8}$/, message: 'El DNI tiene 8 dígitos.', maxLength: 8 },
  RUC: { pattern: /^[0-9]{11}$/, message: 'El RUC tiene 11 dígitos.', maxLength: 11 },
  CE: { pattern: /^[A-Za-z0-9]{6,12}$/, message: 'Entre 6 y 12 letras o números.', maxLength: 12 },
  PASAPORTE: {
    pattern: /^[A-Za-z0-9]{6,12}$/,
    message: 'Entre 6 y 12 letras o números.',
    maxLength: 12,
  },
};

const DEFAULT_INFO: ApiComplaintBookInfo = {
  businessName: 'Jaytech',
  businessRuc: '',
  businessAddress: '',
  responseDays: 15,
};

/** Public "Libro de Reclamaciones" (Ley 29571): one sheet with the three sections the regulation
 * defines — consumer, contracted good and claim detail — plus the receipt shown after registering. */
@Component({
  selector: 'app-complaints-book',
  imports: [Header, Footer, RouterLink, Icon, Button, Input, Textarea, Select, Checkbox, DatePipe],
  templateUrl: './complaints-book.html',
  styleUrl: './complaints-book.css',
})
export class ComplaintsBook {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly dialog = inject(DialogService);
  private readonly toast = inject(ToastService);
  readonly cms = inject(CmsContentService);

  readonly documentTypes = DOCUMENT_TYPES;
  readonly claimTypes = CLAIM_TYPES;
  readonly today = new Date();
  readonly info = signal<ApiComplaintBookInfo>(DEFAULT_INFO);
  readonly draft = signal<ComplaintDraft>({ ...EMPTY_DRAFT });
  readonly submitting = signal(false);
  readonly receipt = signal<ApiComplaintReceipt | null>(null);
  private readonly touched = signal<Partial<Record<DraftField, boolean>>>({});
  private readonly attempted = signal(false);

  readonly documentMaxLength = computed(
    () => DOCUMENT_RULES[this.draft().documentType]?.maxLength ?? 12,
  );

  readonly errors = computed<Partial<Record<DraftField, string>>>(() => {
    const d = this.draft();
    const result: Partial<Record<DraftField, string>> = {};
    const required = (field: DraftField, message: string) => {
      if (!String(d[field]).trim()) result[field] = message;
    };
    required('fullName', 'Ingresa tus nombres y apellidos.');
    required('address', 'Ingresa tu domicilio.');
    required('itemDescription', 'Describe el producto o servicio contratado.');
    required('detail', 'Cuéntanos qué ocurrió.');
    required('request', 'Indica qué solución solicitas.');

    const rule = DOCUMENT_RULES[d.documentType];
    if (!d.documentNumber.trim()) result.documentNumber = 'Ingresa tu número de documento.';
    else if (rule && !rule.pattern.test(d.documentNumber.trim()))
      result.documentNumber = rule.message;

    if (!d.email.trim()) result.email = 'Ingresa tu correo electrónico.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim()))
      result.email = 'Ingresa un correo válido.';

    if (!d.phone.trim()) result.phone = 'Ingresa un teléfono de contacto.';
    else if (!/^\+?[0-9 ()-]{6,32}$/.test(d.phone.trim()))
      result.phone = 'Ingresa un teléfono válido.';

    if (d.isMinor && !d.guardianName.trim())
      result.guardianName = 'Indica el nombre del padre, madre o apoderado.';

    if (d.amount.trim() && this.parseAmount(d.amount) === null)
      result.amount = 'Ingresa un monto válido, por ejemplo 150.00.';

    if (!d.acceptsTerms) result.acceptsTerms = 'Debes aceptar la declaración para continuar.';
    return result;
  });

  constructor() {
    this.api.complaintBookInfo().subscribe({
      next: (info) => this.info.set(info),
      // The form stays usable with the default provider data if this lookup fails.
      error: () => undefined,
    });
  }

  set<K extends DraftField>(field: K, value: ComplaintDraft[K]): void {
    this.draft.update((current) => ({ ...current, [field]: value }));
  }

  touch(field: DraftField): void {
    this.touched.update((current) => ({ ...current, [field]: true }));
  }

  error(field: DraftField): string {
    return this.attempted() || this.touched()[field] ? (this.errors()[field] ?? '') : '';
  }

  changeDocumentType(value: string): void {
    this.draft.update((current) => ({ ...current, documentType: value, documentNumber: '' }));
  }

  async submit(): Promise<void> {
    if (this.submitting()) return;
    this.attempted.set(true);
    if (Object.keys(this.errors()).length) {
      this.toast.error('Revisa el formulario', 'Hay campos obligatorios incompletos o con errores.');
      requestAnimationFrame(() =>
        document
          .querySelector<HTMLElement>('.sheet [aria-invalid="true"], .sheet .has-error')
          ?.focus(),
      );
      return;
    }

    const d = this.draft();
    const kind = d.claimType === 'queja' ? 'queja' : 'reclamo';
    const confirmed = await this.dialog.confirm({
      tone: 'brand',
      title: `¿Registrar ${kind === 'queja' ? 'la queja' : 'el reclamo'}?`,
      message:
        'Una vez registrada, la hoja no puede modificarse. Verifica que tus datos sean correctos.',
      confirmLabel: 'Registrar hoja',
      cancelLabel: 'Revisar datos',
    });
    if (!confirmed) return;

    this.submitting.set(true);
    this.api
      .createComplaint({
        fullName: d.fullName.trim(),
        documentType: d.documentType,
        documentNumber: d.documentNumber.trim(),
        email: d.email.trim(),
        phone: d.phone.trim(),
        address: d.address.trim(),
        isMinor: d.isMinor,
        guardianName: d.isMinor ? d.guardianName.trim() : null,
        itemType: d.itemType,
        itemDescription: d.itemDescription.trim(),
        amount: this.parseAmount(d.amount),
        orderReference: d.orderReference.trim() || null,
        claimType: d.claimType,
        detail: d.detail.trim(),
        request: d.request.trim(),
        acceptsTerms: d.acceptsTerms,
      })
      .subscribe({
        next: (receipt) => {
          this.submitting.set(false);
          this.receipt.set(receipt);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        error: (error: HttpErrorResponse) => {
          this.submitting.set(false);
          this.toast.error(
            'No pudimos registrar la hoja',
            error.status === 429
              ? 'Has enviado varias solicitudes seguidas. Espera un minuto e inténtalo de nuevo.'
              : (error.error?.errors?.message ?? 'Inténtalo nuevamente en unos momentos.'),
          );
        },
      });
  }

  startOver(): void {
    this.draft.set({ ...EMPTY_DRAFT });
    this.touched.set({});
    this.attempted.set(false);
    this.receipt.set(null);
  }

  print(): void {
    window.print();
  }

  proposal(): void {
    void this.router.navigateByUrl('/solicitar-propuesta');
  }

  private parseAmount(value: string): number | null {
    const normalized = value.trim().replace(/\s/g, '').replace(',', '.');
    if (!/^\d{1,7}(\.\d{1,2})?$/.test(normalized)) return null;
    return Number(normalized);
  }
}
