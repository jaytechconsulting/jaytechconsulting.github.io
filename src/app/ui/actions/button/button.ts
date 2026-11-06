import { Icon, IconName } from '../../data-display/icon/icon';
import { Component, computed, input, output } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'inverse' | 'ghost-inverse' | 'glass' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'gap-1.5 px-4 py-2 text-sm',
  md: 'gap-2 px-[22px] py-3 text-[15px]',
  lg: 'gap-2.5 px-[30px] py-4 text-[17px]',
};

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'border-2 border-transparent bg-accent-primary text-text-on-brand shadow-brand',
  secondary: 'border-2 border-transparent bg-accent-secondary text-text-on-brand',
  outline: 'border-2 border-border-strong bg-transparent text-text-strong',
  ghost: 'border-2 border-transparent bg-transparent text-text-body',
  inverse: 'border-2 border-transparent bg-white text-ink-950',
  'ghost-inverse': 'border-2 border-[var(--glass-border)] bg-transparent text-text-on-inverse hover:bg-white/5',
  glass: 'border-2 border-[var(--glass-border)] bg-[var(--glass-dark)] text-text-on-inverse',
  danger: 'border-2 border-transparent bg-danger text-white shadow-[0_0_20px_-6px_var(--danger)]',
};

/** Primary action control. `primary` (orange) for the main CTA, `inverse` on dark surfaces. */
@Component({
  selector: 'app-button',
  imports: [Icon],
  styleUrl: './button.css',
  templateUrl: './button.html',
})
export class Button {
  readonly tone = input<'success' | 'info' | 'warning' | 'danger'>();
  readonly icon = input<IconName>();
  readonly iconOnly = input(false);
  readonly mobileIcon = input(false);
  readonly label = input<string>();
  readonly active = input(false);
  readonly expanded = input<boolean>();
  readonly controls = input<string>();
  readonly current = input<'page' | null>(null);
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly fullWidth = input(false);
  readonly disabled = input(false);
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly clicked = output<MouseEvent>();

  readonly classes = computed(() =>
    [
      'inline-flex items-center justify-center rounded-pill font-body font-bold leading-none tracking-[0.01em]',
      'cursor-pointer transition-[transform,filter] duration-200 ease-out hover:brightness-95 active:scale-[0.97]',
      'disabled:opacity-[0.45] disabled:cursor-not-allowed disabled:pointer-events-none',
      this.fullWidth() ? 'w-full' : 'w-auto',
      SIZE_CLASSES[this.size()],
      VARIANT_CLASSES[this.variant()],
    ].join(' '),
  );

  onClick(event: MouseEvent): void {
    if (this.disabled()) return;
    this.clicked.emit(event);
  }
}
