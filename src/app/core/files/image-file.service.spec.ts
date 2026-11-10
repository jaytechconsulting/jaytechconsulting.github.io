import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ImageFileService } from './image-file.service';
describe('Local image reads', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('rejects unsupported types and oversized files before reading them', () => {
    const reader = vi.fn();
    vi.stubGlobal('FileReader', reader);
    const files = TestBed.inject(ImageFileService);
    const errors: string[] = [];
    files
      .read(new File(['x'], 'test.txt', { type: 'text/plain' }))
      .subscribe({ error: (error) => errors.push(error.reason) });
    files
      .read(new File(['too large'], 'test.png', { type: 'image/png' }), { maxBytes: 2 })
      .subscribe({ error: (error) => errors.push(error.reason) });
    expect(errors).toEqual(['type', 'size']);
    expect(reader).not.toHaveBeenCalled();
  });
  it('aborts an unfinished file read on cancellation', () => {
    const abort = vi.fn();
    vi.stubGlobal(
      'FileReader',
      class {
        static LOADING = 1;
        readyState = 1;
        onload = null;
        onerror = null;
        readAsDataURL = vi.fn();
        abort = abort;
      },
    );
    const pending = TestBed.inject(ImageFileService)
      .read(new File(['image'], 'image.png', { type: 'image/png' }))
      .subscribe();
    pending.unsubscribe();
    expect(abort).toHaveBeenCalledOnce();
  });
});
