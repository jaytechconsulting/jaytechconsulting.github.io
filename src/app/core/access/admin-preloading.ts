import { Injectable, inject } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AccessService } from './access.service';

/** Fetch admin code after a verified entry, before the user selects another module. */
@Injectable({ providedIn: 'root' })
export class AdminPreloading implements PreloadingStrategy {
  private readonly access = inject(AccessService);
  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    return route.path?.startsWith('admin') && this.access.loaded() && this.access.session().canAdmin
      ? load()
      : of(null);
  }
}
