import { Injectable } from '@angular/core';

/** Prevents a late HTTP response from clearing or restoring a newer session. */
@Injectable({ providedIn: 'root' })
export class SessionLifecycle {
  version = 0;
  advance(): void {
    this.version++;
  }
}
