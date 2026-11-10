import { DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, defer, EMPTY, finalize, type Observable, Subject, switchMap, tap } from 'rxjs';

/** Call in a component/service injection context. New reads cancel obsolete reads. */
export function createLatestRequest<T>(initialValue: T) {
  const value = signal(initialValue),
    loading = signal(false),
    error = signal<unknown>(null);
  const requests = new Subject<Observable<T>>();
  const destroy = inject(DestroyRef);
  requests
    .pipe(
      switchMap((source) =>
        defer(() => {
          loading.set(true);
          error.set(null);
          return source.pipe(
            tap((result) => value.set(result)),
            catchError((reason) => {
              error.set(reason);
              return EMPTY;
            }),
            finalize(() => loading.set(false)),
          );
        }),
      ),
      takeUntilDestroyed(destroy),
    )
    .subscribe();
  destroy.onDestroy(() => requests.complete());
  return {
    value: value.asReadonly(),
    loading: loading.asReadonly(),
    error: error.asReadonly(),
    load: (source: Observable<T>) => requests.next(source),
  };
}
