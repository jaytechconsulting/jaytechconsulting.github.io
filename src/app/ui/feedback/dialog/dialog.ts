import { ThemeService } from '../../../core/services/theme.service';
import { closeModal } from '../modal-motion';
import { Icon, IconName } from '../../data-display/icon/icon';
import {
  Component,
  computed,
  input,
  output,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { Button } from '../../actions/button/button';

export type DialogTone = 'brand' | 'success' | 'warning' | 'danger' | 'info';

let dialogUid = 0;

const TONES: Record<DialogTone, { color: string; label: string }> = {
  brand: { color: 'var(--brand-orange)', label: 'Confirmación' },
  success: { color: 'var(--success)', label: 'Completado' },
  warning: { color: 'var(--brand-yellow)', label: 'Revisa antes de continuar' },
  danger: { color: 'var(--danger)', label: 'Acción importante' },
  info: { color: 'var(--brand-cyan)', label: 'Confirmación' },
};

/**
 * Dialog — centered brand confirmation with a transparent blur backdrop.
 * `cancelLabel: null` oculta el botón cancelar. Escape/backdrop emiten `cancelled`.
 */
@Component({
  selector: 'app-dialog',
  imports: [Button, Icon],
  templateUrl: './dialog.html',
  styleUrl: './dialog.css',
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class Dialog implements AfterViewInit, OnDestroy {
  readonly theme = inject(ThemeService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly previousFocus = document.activeElement as HTMLElement | null;
  private readonly uid = `dialog-${++dialogUid}`;
  readonly titleId = this.uid + '-title';
  readonly messageId = this.uid + '-message';
  readonly icon = computed<IconName>(() =>
    this.tone() === 'danger' || this.tone() === 'warning'
      ? 'warning'
      : this.tone() === 'success'
        ? 'check'
        : this.tone() === 'info'
          ? 'info'
          : 'question',
  );
  ngAfterViewInit(): void {
    this.host.nativeElement.querySelector<HTMLElement>('button')?.focus();
  }
  ngOnDestroy(): void {
    requestAnimationFrame(() => this.previousFocus?.isConnected && this.previousFocus.focus());
  }
  @HostListener('keydown', ['$event']) trapFocus(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    const buttons = Array.from(
      this.host.nativeElement.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'),
    );
    const first = buttons[0],
      last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  readonly closing = signal(false);
  async requestClose(confirmed: boolean): Promise<void> {
    if (this.closing()) return;
    this.closing.set(true);
    await closeModal(
      this.host.nativeElement.querySelector<HTMLElement>('.dl-dialog-panel') ?? undefined,
    );
    if (confirmed) this.confirmed.emit();
    else this.cancelled.emit();
  }
  readonly open = input(true);
  readonly tone = input<DialogTone>('brand');
  readonly title = input('');
  readonly message = input('');
  readonly confirmLabel = input('Confirmar');
  readonly cancelLabel = input<string | null>('Cancelar');
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  readonly toneColor = computed(() => (TONES[this.tone()] ?? TONES.brand).color);
  readonly contextLabel = computed(() => (TONES[this.tone()] ?? TONES.brand).label);

  onEscape(): void {
    if (this.open()) void this.requestClose(false);
  }

  onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) void this.requestClose(false);
  }
}
