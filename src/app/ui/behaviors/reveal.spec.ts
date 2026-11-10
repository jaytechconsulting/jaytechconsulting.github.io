import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Reveal } from './reveal';

@Component({
  imports: [Reveal],
  template: '<section appReveal [appRevealDelay]="900">Content</section>',
})
class Host {}

afterEach(() => {
  TestBed.resetTestingModule();
  vi.unstubAllGlobals();
});

describe('Reveal accessibility and lifecycle', () => {
  it('keeps content visible when reduced motion is preferred', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const section = fixture.nativeElement.querySelector('section');
    expect(section.classList.contains('reveal-pending')).toBe(false);
    expect(section.classList.contains('is-revealed')).toBe(true);
  });

  it('reveals on intersection, caps the delay and disconnects on destruction', () => {
    let callback: IntersectionObserverCallback;
    const observe = vi.fn(),
      unobserve = vi.fn(),
      disconnect = vi.fn();
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(handler: IntersectionObserverCallback) {
          callback = handler;
        }
        observe = observe;
        unobserve = unobserve;
        disconnect = disconnect;
      },
    );
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const section = fixture.nativeElement.querySelector('section');
    expect(section.style.getPropertyValue('--reveal-delay')).toBe('240ms');
    expect(section.classList.contains('reveal-pending')).toBe(true);
    callback!([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    expect(section.classList.contains('reveal-pending')).toBe(false);
    expect(section.classList.contains('is-revealed')).toBe(true);
    expect(unobserve).toHaveBeenCalledWith(section);
    fixture.destroy();
    expect(disconnect).toHaveBeenCalledOnce();
  });
});
