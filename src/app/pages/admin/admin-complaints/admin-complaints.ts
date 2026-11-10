import { Component, HostListener, computed, inject, signal, viewChild } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AdminShell } from '../admin-shell/admin-shell';
import { AdminRow, AdminTable } from '../admin-table/admin-table';
import { ApiService } from '../../../core/api.service';
import { AccessService } from '../../../core/access/access.service';
import { ToastService } from '../../../core/services/toast.service';
import type { ApiComplaint, ApiComplaintSettings } from '../../../core/models/api.models';
import { Icon } from '../../../ui/data-display/icon/icon';
import { Button } from '../../../ui/actions/button/button';
import { Input } from '../../../ui/forms/input/input';
import { Textarea } from '../../../ui/forms/textarea/textarea';
import { Checkbox } from '../../../ui/forms/checkbox/checkbox';
import { OverlayScroll } from '../../../ui/behaviors/overlay-scroll';

type SettingsDraft = Omit<ApiComplaintSettings, 'smtpEnabled' | 'updatedAt' | 'responseDays'> & {
  responseDays: string;
};

/** Admin side of the Libro de Reclamaciones. One component serves both submenu routes:
 * "lista" (the shared server-side table plus the sheet detail) and "configuracion"
 * (who is emailed and the provider data printed on every sheet). */
@Component({
  selector: 'app-admin-complaints',
  imports: [
    AdminShell,
    AdminTable,
    DatePipe,
    DecimalPipe,
    Icon,
    Button,
    Input,
    Textarea,
    Checkbox,
    OverlayScroll,
  ],
  templateUrl: './admin-complaints.html',
  styleUrl: './admin-complaints.css',
})
export class AdminComplaints {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  private readonly access = inject(AccessService);
  private readonly routeData = toSignal(inject(ActivatedRoute).data);
  private readonly table = viewChild(AdminTable);

  readonly view = computed(() =>
    this.routeData()?.['complaintsView'] === 'configuracion' ? 'configuracion' : 'lista',
  );
  readonly canUpdate = computed(() => this.access.can('complaints', 'update'));

  // ---- Sheet detail ----
  readonly detailOpen = signal(false);
  readonly detailLoading = signal(false);
  readonly detailFailed = signal(false);
  readonly detailTitle = signal('');
  readonly complaint = signal<ApiComplaint | null>(null);
  readonly responseDraft = signal('');
  readonly sendEmail = signal(true);
  readonly responding = signal(false);

  // ---- Settings ----
  readonly settings = signal<ApiComplaintSettings | null>(null);
  readonly settingsDraft = signal<SettingsDraft | null>(null);
  readonly settingsFailed = signal(false);
  readonly saving = signal(false);

  constructor() {
    // Loaded for both views: the detail needs to know whether mail is enabled.
    this.loadSettings();
  }

  open(row: AdminRow): void {
    this.detailTitle.set(row.detail);
    this.complaint.set(null);
    this.detailFailed.set(false);
    this.detailLoading.set(true);
    this.detailOpen.set(true);
    this.api.complaint(row.id).subscribe({
      next: (complaint) => {
        this.complaint.set(complaint);
        this.responseDraft.set(complaint.providerResponse ?? '');
        this.sendEmail.set(true);
        this.detailLoading.set(false);
      },
      error: () => {
        this.detailLoading.set(false);
        this.detailFailed.set(true);
      },
    });
  }

  @HostListener('document:keydown.escape') close(): void {
    if (!this.responding()) this.detailOpen.set(false);
  }

  onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.close();
  }

  respond(): void {
    const complaint = this.complaint();
    const response = this.responseDraft().trim();
    if (!complaint || !response || this.responding()) return;
    this.responding.set(true);
    this.api.respondComplaint(complaint.id, response, this.sendEmail()).subscribe({
      next: (updated) => {
        this.responding.set(false);
        this.complaint.set(updated);
        this.toast.success(
          'Respuesta registrada',
          this.sendEmail() && this.settings()?.smtpEnabled
            ? `Se envió la respuesta a ${updated.email}.`
            : 'La hoja quedó marcada como atendida.',
        );
        this.detailOpen.set(false);
        this.table()?.refresh();
      },
      error: (error: HttpErrorResponse) => {
        this.responding.set(false);
        this.toast.error(
          'No pudimos guardar la respuesta',
          error.error?.errors?.message ?? 'Inténtalo nuevamente.',
        );
      },
    });
  }

  loadSettings(): void {
    this.settingsFailed.set(false);
    this.api.complaintSettings().subscribe({
      next: (settings) => this.applySettings(settings),
      error: () => this.settingsFailed.set(true),
    });
  }

  setSetting<K extends keyof SettingsDraft>(field: K, value: SettingsDraft[K]): void {
    this.settingsDraft.update((current) => (current ? { ...current, [field]: value } : current));
  }

  saveSettings(): void {
    const draft = this.settingsDraft();
    if (!draft || this.saving()) return;
    const responseDays = Number(draft.responseDays);
    if (!Number.isInteger(responseDays) || responseDays < 1 || responseDays > 30) {
      this.toast.error('Plazo no válido', 'El plazo de respuesta va de 1 a 30 días hábiles.');
      return;
    }
    this.saving.set(true);
    this.api.updateComplaintSettings({ ...draft, responseDays }).subscribe({
      next: (settings) => {
        this.saving.set(false);
        this.applySettings(settings);
        this.toast.success('Configuración guardada', 'Se aplicará a las próximas hojas.');
      },
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        this.toast.error(
          'No pudimos guardar',
          error.error?.errors?.message ?? 'Inténtalo nuevamente.',
        );
      },
    });
  }

  private applySettings(settings: ApiComplaintSettings): void {
    this.settings.set(settings);
    this.settingsDraft.set({
      notifyCustomer: settings.notifyCustomer,
      notifyOwner: settings.notifyOwner,
      ownerEmails: settings.ownerEmails,
      businessName: settings.businessName,
      businessRuc: settings.businessRuc,
      businessAddress: settings.businessAddress,
      responseDays: String(settings.responseDays),
    });
  }
}
