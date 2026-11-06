import { Component, computed, input, output } from '@angular/core';

let uid = 0;

/** Labeled text field with hint/error and an optional left-icon slot. */
@Component({
  selector: 'app-input',
  templateUrl: './input.html',
})
export class Input {
  readonly label = input<string>();
  readonly hint = input<string>();
  readonly error = input<string>();
  readonly id = input<string>();
  readonly type = input('text');
  readonly value = input('');
  readonly minLength = input<number>();
  readonly maxLength = input<number>();
  readonly inputMode = input<string>();
  readonly autocomplete = input<string>();
  readonly placeholder = input<string>();
  readonly disabled = input(false);
  readonly required = input(false);
  readonly hasIconLeft = input(false);

  readonly valueChange = output<string>();

  private readonly generatedId = `app-input-${++uid}`;
  readonly fieldId = computed(() => this.id() || this.generatedId);

  readonly fieldClasses = computed(() =>
    [
      'w-full box-border font-body text-[15px] text-text-body rounded-md border-[1.5px] outline-none',
      'transition-[border-color,box-shadow] duration-200 ease-out',
      this.hasIconLeft() ? 'pl-10 pr-3.5 py-3' : 'px-3.5 py-3',
      this.disabled() ? 'bg-surface-sunken' : 'bg-surface-card',
      this.error()
        ? 'border-danger focus:border-danger focus:shadow-[0_0_0_4px_var(--danger-tint)]'
        : 'border-border-default focus:border-border-focus focus:shadow-[0_0_0_4px_var(--focus-ring)]',
    ].join(' '),
  );

  onInput(event: Event): void {
    this.valueChange.emit((event.target as HTMLInputElement).value);
  }
}
