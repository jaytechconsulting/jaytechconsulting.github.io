import { DestroyRef, Directive, effect, inject, input, output } from '@angular/core';
import type { Subscription } from 'rxjs';
import { ImageFileService } from '../../core/files/image-file.service';

/** Latest selection wins; leaving the view cancels unfinished reads. */
@Directive({
  selector: 'input[type=file][appImageFile]',
  exportAs: 'imageFile',
  host: { '(change)': 'read($event)' },
})
export class ImageFile {
  readonly imageTypes = input<readonly string[]>();
  readonly maxImageBytes = input(1024 * 1024);
  readonly verifyImage = input(false);
  readonly imageSelected = output<string>();
  readonly imageError = output<string>();
  readonly imageResetKey = input<unknown>();
  private readonly files = inject(ImageFileService);
  private pending?: Subscription;
  constructor() {
    // Switching records must not attach a previous record's unfinished image read.
    effect(() => {
      this.imageResetKey();
      this.cancel();
    });
    inject(DestroyRef).onDestroy(() => this.cancel());
  }
  cancel(): void {
    this.pending?.unsubscribe();
  }
  read(event: Event): void {
    const field = event.target as HTMLInputElement,
      file = field.files?.[0];
    field.value = '';
    if (!file) return;
    this.pending?.unsubscribe();
    this.pending = this.files
      .read(file, {
        maxBytes: this.maxImageBytes(),
        types: this.imageTypes(),
        verifyImage: this.verifyImage(),
      })
      .subscribe({
        next: (src) => this.imageSelected.emit(src),
        error: (error: Error) => this.imageError.emit(error.message),
      });
  }
}
