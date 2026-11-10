import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { AnnouncementEditor } from './announcement-editor';
import { AccessService } from '../../../../core/access/access.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { ToastService } from '../../../../core/services/toast.service';

describe('Announcement editor', () => {
  function setup() {
    TestBed.configureTestingModule({
      imports: [AnnouncementEditor],
      providers: [
        { provide: ThemeService, useValue: { theme: signal('light') } },
        { provide: AccessService, useValue: { allowed: () => true } },
        { provide: ToastService, useValue: { error: vi.fn() } },
      ],
    });
    const fixture = TestBed.createComponent(AnnouncementEditor);
    fixture.componentRef.setInput('value', { message: 'Promoción', active: true });
    fixture.detectChanges();
    return { fixture, editor: fixture.componentInstance };
  }
  it('prevents invalid saves then emits all framing and action settings', () => {
    const { editor } = setup(),
      save = vi.spyOn(editor.save, 'emit');
    editor.addButton();
    editor.submit();
    expect(save).not.toHaveBeenCalled();
    editor.changeButton(0, 'label', 'Ver cursos');
    editor.changeButton(0, 'href', '/cursos');
    editor.set('mediaType', 'animation');
    editor.set('animation', 'orbits');
    editor.set('imageZoom', 1.5);
    editor.submit();
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        mediaType: 'animation',
        animation: 'orbits',
        imageZoom: 1.5,
        buttons: [expect.objectContaining({ href: '/cursos', label: 'Ver cursos' })],
      }),
    );
  });
  it('keeps unsaved edits when an identical server response arrives again', () => {
    const { fixture, editor } = setup();
    editor.set('message', 'Sin guardar');
    fixture.componentRef.setInput('value', { message: 'Promoción', active: true });
    fixture.detectChanges();
    expect(editor.draft().message).toBe('Sin guardar');
  });
  it('limits, reorders and removes buttons and previews the draft without publishing', () => {
    const { fixture, editor } = setup();
    for (let i = 0; i < 6; i++) editor.addButton();
    expect(editor.draft().buttons).toHaveLength(5);
    editor.changeButton(0, 'label', 'Primero');
    editor.moveButton(0, 1);
    expect(editor.draft().buttons[1].label).toBe('Primero');
    editor.removeButton(1);
    expect(editor.draft().buttons).toHaveLength(4);
    editor.set('active', false);
    editor.set('message', 'Vista previa oculta');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-announcement-banner').textContent).toContain(
      'Vista previa oculta',
    );
  });
  it('saves foreground images, responsive settings and a timezone-safe expiry', () => {
    const { editor } = setup(),
      save = vi.spyOn(editor.save, 'emit');
    editor.addInlineImage();
    const id = editor.draft().inlineImages[0].id;
    editor.changeInlineImage(id, 'src', 'https://example.com/product.webp');
    editor.changeInlineImage(id, 'position', 'after');
    editor.changeVisibility('mobile', 'images', false);
    editor.setCountdown('enabled', true);
    editor.setEndsAt('2026-12-31T23:59');
    editor.submit();
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        inlineImages: [expect.objectContaining({ position: 'after' })],
        visibility: expect.objectContaining({ mobile: expect.objectContaining({ images: false }) }),
        countdown: expect.objectContaining({
          enabled: true,
          endsAt: new Date('2026-12-31T23:59').toISOString(),
        }),
      }),
    );
  });
  it('rejects missing foreground images and an invalid promotion deadline', () => {
    const { editor } = setup(),
      save = vi.spyOn(editor.save, 'emit');
    editor.addInlineImage();
    editor.setCountdown('enabled', true);
    editor.submit();
    expect(save).not.toHaveBeenCalled();
    expect(editor.errors().length).toBeGreaterThan(1);
  });
});
