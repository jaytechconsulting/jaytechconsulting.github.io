import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Observable, of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';
import { createLatestRequest } from './latest-request';
@Component({ template: '' })
class Host {
  readonly request = createLatestRequest(0);
}
describe('Latest request lifecycle', () => {
  it('cancels obsolete reads and accepts only the newest result', () => {
    const fixture = TestBed.createComponent(Host),
      state = fixture.componentInstance.request;
    const first = new Subject<number>(),
      second = new Subject<number>();
    state.load(first);
    state.load(second);
    expect(first.observers.length).toBe(0);
    expect(state.loading()).toBe(true);
    first.next(10);
    second.next(20);
    second.complete();
    expect(state.value()).toBe(20);
    expect(state.loading()).toBe(false);
    fixture.destroy();
  });
  it('remains usable after errors and cancels pending work when destroyed', () => {
    const fixture = TestBed.createComponent(Host),
      state = fixture.componentInstance.request;
    state.load(throwError(() => new Error('offline')));
    expect(state.error()).toBeInstanceOf(Error);
    expect(state.loading()).toBe(false);
    state.load(of(3));
    expect(state.error()).toBeNull();
    expect(state.value()).toBe(3);
    const canceled = vi.fn();
    state.load(new Observable(() => canceled));
    fixture.destroy();
    expect(canceled).toHaveBeenCalledOnce();
  });
});
