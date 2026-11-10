import { Injectable, signal } from '@angular/core';

/** Keep sidebar position across module shells, without persisting account data. */
@Injectable({ providedIn: 'root' })
export class AdminNavigationState {
  scrollTop = 0;
  readonly expanded = signal<Record<string, boolean>>({});
}
