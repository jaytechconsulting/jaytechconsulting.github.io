import { Injectable, signal } from '@angular/core';
import type { DialogTone } from '../../ui/feedback/dialog/dialog';

export interface DialogOptions {
  tone?: DialogTone;
  title: string;
  message?: string;
  confirmLabel?: string;
  /** null = sin botón cancelar (modo alerta). */
  cancelLabel?: string | null;
}

export interface ActiveDialog {
  tone: DialogTone;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string | null;
  resolve: (result: boolean) => void;
}

/**
 * API funcional de diálogos de confirmación. Inyectar y llamar:
 *   const ok = await dialog.confirm({ title: '¿Eliminar proyecto?', tone: 'danger' });
 *   await dialog.alert({ title: 'Listo', message: 'Propuesta enviada.' });
 * Requiere `<app-dialog-outlet />` montado una sola vez (app root).
 */
@Injectable({ providedIn: 'root' })
export class DialogService {
  private readonly _dialog = signal<ActiveDialog | null>(null);
  readonly dialog = this._dialog.asReadonly();

  confirm(options: DialogOptions): Promise<boolean> {
    this._dialog()?.resolve(false);
    return new Promise<boolean>((resolve) => {
      this._dialog.set({
        tone: options.tone ?? 'brand',
        title: options.title,
        message: options.message ?? '',
        confirmLabel: options.confirmLabel ?? 'Confirmar',
        cancelLabel: options.cancelLabel === undefined ? 'Cancelar' : options.cancelLabel,
        resolve,
      });
    });
  }

  question(options: DialogOptions): Promise<boolean> {
    return this.confirm({ ...options, tone: options.tone ?? 'info' });
  }

  alert(options: DialogOptions): Promise<boolean> {
    return this.confirm({
      ...options,
      confirmLabel: options.confirmLabel ?? 'Entendido',
      cancelLabel: null,
    });
  }

  close(result: boolean): void {
    const active = this._dialog();
    if (!active) return;
    this._dialog.set(null);
    active.resolve(result);
  }
}
