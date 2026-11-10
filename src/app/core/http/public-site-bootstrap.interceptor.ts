import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { from, mergeMap, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PUBLIC_READ } from './api-client';

interface BootstrapResult {
  ok: boolean;
  status: number;
  statusText: string;
  body: unknown;
}

declare global {
  interface Window {
    __publicSiteBootstrap?: {
      url: string;
      startedAt: number;
      result: Promise<BootstrapResult>;
    };
  }
}

/** One-use handoff, scoped to the configured anonymous CMS endpoint. No storage. */
export const publicSiteBootstrapInterceptor: HttpInterceptorFn = (request, next) => {
  const endpoint = environment.apiUrl.replace(/\/$/, '') + '/public-site';
  if (request.method !== 'GET' || !request.context.get(PUBLIC_READ) || request.urlWithParams !== endpoint)
    return next(request);
  const early = window.__publicSiteBootstrap;
  delete window.__publicSiteBootstrap;
  if (!early || early.url !== endpoint || performance.now() - early.startedAt > 15000)
    return next(request);
  return from(early.result).pipe(
    mergeMap((result) => result.ok
      ? of(new HttpResponse({ body: result.body, status: result.status, statusText: result.statusText, url: endpoint }))
      : throwError(() => new HttpErrorResponse({ error: result.body, status: result.status, statusText: result.statusText, url: endpoint }))),
  );
};
