import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { Dialog } from './dialog';
import { ThemeService } from '../../../core/services/theme.service';
describe('Confirmation dialog', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [Dialog],
      providers: [{ provide: ThemeService, useValue: { theme: signal('light') } }],
    }),
  );
  it('waits for the exit effect and emits confirmation only once', async () => {
    const fixture = TestBed.createComponent(Dialog);
    fixture.componentRef.setInput('title', '¿Eliminar registro?');
    fixture.detectChanges();
    const confirmed = vi.fn();
    fixture.componentInstance.confirmed.subscribe(confirmed);
    let finish!: () => void;
    const finished = new Promise<void>((resolve) => (finish = resolve));
    fixture.nativeElement.querySelector('.dl-dialog-panel').animate = vi
      .fn()
      .mockReturnValue({ finished });
    const pending = fixture.componentInstance.requestClose(true);
    await fixture.componentInstance.requestClose(true);
    expect(confirmed).not.toHaveBeenCalled();
    finish();
    await pending;
    expect(confirmed).toHaveBeenCalledOnce();
  });
  it('cancels with Escape and uses the existing animated logo', async () => {
    const fixture = TestBed.createComponent(Dialog);
    fixture.detectChanges();
    const canceled = vi.fn();
    fixture.componentInstance.cancelled.subscribe(canceled);
    expect(fixture.nativeElement.querySelector('.dialog-logo').getAttribute('src')).toBe(
      'brand/animated/logo-animado-claro.svg',
    );
    fixture.componentInstance.onEscape();
    await Promise.resolve();
    expect(canceled).toHaveBeenCalledOnce();
  });
});
