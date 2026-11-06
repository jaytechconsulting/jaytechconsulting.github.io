import { Component, computed, DestroyRef, inject, input, OnInit, output, signal } from '@angular/core';

export type ToastTone = 'success' | 'warning' | 'error' | 'info';

const TONES: Record<ToastTone, { color: string; label: string; glyph: string }> = {
  success: { color: 'var(--success)', label: 'Éxito', glyph: '✓' },
  warning: { color: 'var(--brand-yellow)', label: 'Aviso', glyph: '!' },
  error: { color: 'var(--danger)', label: 'Error', glyph: '×' },
  info: { color: 'var(--brand-cyan)', label: 'Info', glyph: 'i' },
};

/**
 * Toast — glass notification with its original rotating icon ring and countdown.
 * `duration` in ms; 0 disables auto-dismiss.
 */
@Component({
  selector: 'app-toast',
  templateUrl: './toast.html',
  styleUrl: './toast.css',
})
export class Toast implements OnInit {
  readonly tone = input<ToastTone>('info');
  readonly title = input('');
  readonly message = input('');
  readonly duration = input(4000);
  readonly closed = output<void>();

  private readonly destroyRef = inject(DestroyRef);
  readonly leaving = signal(false);

  readonly toneColor = computed(() => (TONES[this.tone()] ?? TONES.info).color);
  readonly toneLabel = computed(() => (TONES[this.tone()] ?? TONES.info).label);
  readonly toneGlyph = computed(() => (TONES[this.tone()] ?? TONES.info).glyph);
  readonly ringGradient = computed(
    () => `conic-gradient(from 0deg, transparent 0 66%, ${this.toneColor()} 82%, #fff 90%, transparent 100%)`,
  );

  ngOnInit(): void {
    if (!this.duration()) return;
    const id = setTimeout(() => this.dismiss(), this.duration());
    this.destroyRef.onDestroy(() => clearTimeout(id));
  }

  dismiss(): void {
    if (this.leaving()) return;
    this.leaving.set(true);
    const id = setTimeout(() => this.closed.emit(), 240);
    this.destroyRef.onDestroy(() => clearTimeout(id));
  }
}
