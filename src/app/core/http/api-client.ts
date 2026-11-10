import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, InjectionToken } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiResponse } from '../models/api.models';

export type ApiQuery = Readonly<Record<string, string | number | boolean | null | undefined>>;
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => environment.apiUrl,
});

/** Transport only: authentication, CSRF and loading stay in the HTTP interceptor. */
@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL).replace(/\/$/, '');

  get<T>(path: string, query?: ApiQuery): Observable<T> {
    return this.request<T>('GET', path, undefined, query);
  }
  post<T>(path: string, body: unknown): Observable<T> {
    return this.request<T>('POST', path, body);
  }
  put<T>(path: string, body: unknown): Observable<T> {
    return this.request<T>('PUT', path, body);
  }
  patch<T>(path: string, body: unknown): Observable<T> {
    return this.request<T>('PATCH', path, body);
  }
  delete<T>(path: string): Observable<T> {
    return this.request<T>('DELETE', path);
  }

  private request<T>(
    method: string,
    path: string,
    body?: unknown,
    query?: ApiQuery,
  ): Observable<T> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined && value !== null) params = params.set(key, String(value));
    }
    const url = `${this.baseUrl}/${path.replace(/^\/+/, '')}`;
    // Empty 204 responses are valid for mutations. HTTP errors propagate unchanged.
    return this.http
      .request<ApiResponse<T> | null>(method, url, { body, params })
      .pipe(map((response) => response?.data as T));
  }
}
