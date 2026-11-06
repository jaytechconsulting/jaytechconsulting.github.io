import { closeModal } from '../modal-motion';
import { Button } from '../../actions/button/button';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, inject, input, output, signal } from '@angular/core';

/**
 * Rich read-only detail popover for public listing cards (programs, courses, etc.) — a quick
 * peek opened from "ver más detalles", with a link through to the full detail page. Mirrors
 * `Dialog`'s animate-then-emit close pattern but shows free-form content (image banner,
 * badges, full description) instead of a confirm/cancel prompt.
 */
@Component({
  selector: 'app-detail-modal',
  imports: [Button],
  templateUrl: './detail-modal.html',
  styleUrl: './detail-modal.css',
  host: {
    '(document:keydown.escape)': 'requestClose()',
  },
})
export class DetailModal implements OnInit, AfterViewInit, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private previousBodyOverflow = '';

  readonly image = input<string | null>(null);
  readonly accentColor = input('#FF6B35');
  readonly glyph = input('◆');
  readonly badges = input<string[]>([]);
  readonly title = input('');
  readonly description = input('');
  readonly ctaLabel = input('Solicitar propuesta');
  readonly detailLabel = input('Ver página completa');

  readonly closed = output<void>();
  readonly ctaClicked = output<void>();
  readonly detailClicked = output<void>();

  readonly closing = signal(false);

  ngOnInit(): void {
    this.previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }

  ngAfterViewInit(): void {
    this.host.nativeElement.querySelector<HTMLElement>('button')?.focus();
  }

  ngOnDestroy(): void {
    document.body.style.overflow = this.previousBodyOverflow;
  }

  async requestClose(): Promise<void> {
    if (this.closing()) return;
    this.closing.set(true);
    await closeModal(this.host.nativeElement.querySelector<HTMLElement>('.dm-panel') ?? undefined);
    this.closed.emit();
  }

  async goToDetail(): Promise<void> {
    if (this.closing()) return;
    this.closing.set(true);
    await closeModal(this.host.nativeElement.querySelector<HTMLElement>('.dm-panel') ?? undefined);
    this.detailClicked.emit();
  }

  onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) void this.requestClose();
  }
}
