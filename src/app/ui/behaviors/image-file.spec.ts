import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { vi } from 'vitest';
import { ImageFile } from './image-file';
import { ImageFileService } from '../../core/files/image-file.service';
@Component({
  imports: [ImageFile],
  template:
    '<input type="file" appImageFile [imageResetKey]="generation" (imageSelected)="selected=$event" />',
})
class Host {
  selected = '';
  generation = 0;
}
describe('Image file behavior', () => {
  it('clears the input for re-selection, ignores old reads and cleans up on destruction', () => {
    const first = new Subject<string>(),
      second = new Subject<string>();
    const read = vi.fn().mockReturnValueOnce(first).mockReturnValueOnce(second);
    TestBed.configureTestingModule({
      imports: [Host],
      providers: [{ provide: ImageFileService, useValue: { read } }],
    });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input');
    Object.defineProperty(input, 'files', {
      value: [new File(['x'], 'image.png', { type: 'image/png' })],
    });
    input.dispatchEvent(new Event('change'));
    input.dispatchEvent(new Event('change'));
    expect(first.observers.length).toBe(0);
    first.next('old');
    second.next('new');
    expect(fixture.componentInstance.selected).toBe('new');
    expect(input.value).toBe('');
    fixture.componentInstance.generation++;
    fixture.detectChanges();
    expect(second.observers.length).toBe(0);
    read.mockReturnValue(second);
    input.dispatchEvent(new Event('change'));
    fixture.destroy();
    expect(second.observers.length).toBe(0);
  });
});
