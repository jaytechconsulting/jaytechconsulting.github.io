import { inject, Injector } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, defer, finalize, of, switchMap, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { CsrfService } from './csrf.service';
import { SessionLifecycle } from './session-lifecycle.service';
import { loginRedirect, privateReturnUrl } from './auth-navigation';
import { LoadingService } from '../services/loading.service';

import { PUBLIC_READ } from '../http/api-client';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const base = environment.apiUrl.replace(/\/$/, '');
  const isApi =
    request.url === base ||
    request.url.startsWith(base + '/') ||
    request.url.startsWith(base + '?');
  const loading = inject(LoadingService);
  const injector = inject(Injector);
  const lifecycle = inject(SessionLifecycle);
  const csrf = inject(CsrfService);
  const version = lifecycle.version;
  const unsafe = !['GET', 'HEAD', 'OPTIONS'].includes(request.method);
  const publicRead = !unsafe && request.context.get(PUBLIC_READ);
  const send = () =>
    (isApi && unsafe ? csrf.get() : of('')).pipe(
      switchMap((token) =>
        next(
          isApi
            ? request.clone({
                withCredentials: !publicRead,
                credentials: publicRead ? 'omit' : 'include',
                ...(token ? { setHeaders: { 'X-CSRF-TOKEN': token } } : {}),
              })
            : request,
        ),
      ),
    );
  loading.start();
  return defer(send).pipe(
    catchError((error) => {
      // This code is returned only by the pre-action CSRF filter; never retry general mutations.
      if (
        isApi &&
        unsafe &&
        error.status === 403 &&
        (error.error?.errors?.code ?? error.error?.code) === 'csrf_invalid' &&
        version === lifecycle.version
      ) {
        csrf.clear();
        return send();
      }
      return throwError(() => error);
    }),
    tap((event) => {
      if (
        isApi &&
        'status' in event &&
        event.status >= 200 &&
        event.status < 300 &&
        unsafe &&
        [
          '/auth/login',
          '/auth/logout',
          '/auth/logout-all',
          '/auth/change-password',
          '/auth/change-email',
          '/auth/me',
        ].some((path) => request.url === base + path)
      ) {
        lifecycle.advance();
        csrf.clear();
      }
    }),
    catchError((error) => {
      if (
        isApi &&
        !publicRead &&
        error.status === 401 &&
        version === lifecycle.version &&
        request.url !== base + '/auth/login' &&
        request.url !== base + '/auth/csrf'
      ) {
        injector.get(AuthService).clearSession();
        const router = injector.get(Router);
        const navigation = router.getCurrentNavigation();
        const destination =
          navigation?.finalUrl?.toString() ?? navigation?.extractedUrl.toString() ?? router.url;
        if (privateReturnUrl(destination))
          void router.navigateByUrl(loginRedirect(router, destination), { replaceUrl: true });
      }
      return throwError(() => error);
    }),
    finalize(() => loading.stop()),
  );
};
