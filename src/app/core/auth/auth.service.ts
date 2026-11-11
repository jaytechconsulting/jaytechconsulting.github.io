import { AccessService } from '../access/access.service';
import type { ApiUser, PersonalProfileFields, PersonalProfileInput } from '../models/api.models';
import { Injectable, computed, inject, signal } from '@angular/core';
import {
  Observable,
  map,
  tap,
  catchError,
  of,
  throwError,
  switchMap,
  finalize,
  shareReplay,
} from 'rxjs';
import { CsrfService } from './csrf.service';
import { SessionLifecycle } from './session-lifecycle.service';
import { DestroyRef } from '@angular/core';
import { Router } from '@angular/router';
import { loginRedirect, privateReturnUrl } from './auth-navigation';
import { ApiService } from '../api.service';

export type UserRole = 'client' | 'admin';

export interface AuthUser {
  id?: string;
  name: string;
  email: string;
  role: UserRole;
  initials: string;
  avatarUrl?: string;
  avatarZoom?: number;
  avatarX?: number;
  avatarY?: number;
}

const AUTH_EVENT = 'jaytech_auth_event';

/** Authentication is verified against the server; credentials never enter web storage. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly access = inject(AccessService);
  private readonly user = signal<AuthUser | null>(null);
  private readonly csrf = inject(CsrfService);
  private readonly lifecycle = inject(SessionLifecycle);
  private logoutRequest?: Observable<void>;

  readonly currentUser = this.user.asReadonly();
  readonly isAuthenticated = computed(() => this.user() !== null);
  private generation = 0;

  constructor() {
    const router = inject(Router);
    // Remove legacy bearer credentials during the transition; they are no longer accepted.
    try {
      localStorage.removeItem('jaytech_token');
      localStorage.removeItem('jaytech_session');
    } catch {}
    const onStorage = (event: StorageEvent) => {
      if (event.key !== AUTH_EVENT || !event.newValue) return;
      let kind: string;
      try {
        kind = JSON.parse(event.newValue).kind;
      } catch {
        return;
      }
      this.clearSession(false);
      if (kind === 'logout') {
        if (privateReturnUrl(router.url))
          void router.navigateByUrl(loginRedirect(router, router.url), { replaceUrl: true });
      } else if (kind === 'changed') {
        if (privateReturnUrl(router.url))
          void router.navigateByUrl(router.url, {
            replaceUrl: true,
            onSameUrlNavigation: 'reload',
          });
        else this.loadProfile().subscribe({ error: () => {} });
      }
    };
    window.addEventListener('storage', onStorage);
    inject(DestroyRef).onDestroy(() => window.removeEventListener('storage', onStorage));
  }

  private requireCurrentSession(generation: number): void {
    if (generation !== this.generation) throw new Error('La sesión cambió durante la solicitud.');
  }

  private persistProfile(response: ApiUser): AuthUser {
    const role: UserRole = response.role.toLowerCase() === 'admin' ? 'admin' : 'client';
    const user: AuthUser = {
      id: response.id,
      name: response.name,
      email: response.email,
      role,
      avatarUrl: response.avatarUrl ?? undefined,
      avatarZoom: response.avatarZoom ?? 1,
      avatarX: response.avatarX ?? 50,
      avatarY: response.avatarY ?? 50,
      initials: response.name
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
    };
    this.user.set(user);
    return user;
  }
  login(email: string, password: string): Observable<AuthUser> {
    const generation = ++this.generation;
    this.lifecycle.advance();
    this.access.clear();
    return this.api.login(email, password).pipe(
      switchMap(() => this.api.currentProfile()),
      map((response) => {
        this.requireCurrentSession(generation);
        const user = this.persistProfile(response);
        this.broadcast('changed');
        return user;
      }),
    );
  }
  loadProfile(): Observable<AuthUser & PersonalProfileFields> {
    const generation = this.generation;
    return this.api.currentProfile().pipe(
      map((response) => {
        this.requireCurrentSession(generation);
        return this.profileDetails(this.persistProfile(response), response);
      }),
    );
  }
  loadAdminSession() {
    const generation = this.generation;
    return this.api.adminBootstrap().pipe(
      map(({ profile, access }) => {
        this.requireCurrentSession(generation);
        this.persistProfile(profile);
        this.access.acceptBootstrap(access);
        return access;
      }),
    );
  }
  updateProfile(
    input: string | PersonalProfileInput,
  ): Observable<AuthUser & PersonalProfileFields> {
    const generation = this.generation;
    return this.api.updateProfile(input).pipe(
      map((response) => {
        this.requireCurrentSession(generation);
        const result = this.profileDetails(this.persistProfile(response), response);
        this.broadcast('changed');
        return result;
      }),
    );
  }
  private profileDetails(
    user: AuthUser,
    response: PersonalProfileFields,
  ): AuthUser & PersonalProfileFields {
    return {
      ...user,
      givenNames: response.givenNames,
      paternalSurname: response.paternalSurname,
      maternalSurname: response.maternalSurname,
      documentType: response.documentType,
      documentNumber: response.documentNumber,
      phone: response.phone,
      contactEmail: response.contactEmail,
      sex: response.sex,
    };
  }
  changeEmail(email: string, currentPassword: string): Observable<AuthUser> {
    const generation = this.generation;
    return this.api.changeEmail(email, currentPassword).pipe(
      map((response) => {
        this.requireCurrentSession(generation);
        const user = this.persistProfile(response);
        this.broadcast('changed');
        return user;
      }),
    );
  }
  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.api
      .changePassword(currentPassword, newPassword)
      .pipe(tap(() => this.broadcast('changed')));
  }

  private broadcast(kind: 'logout' | 'changed'): void {
    try {
      localStorage.setItem(AUTH_EVENT, JSON.stringify({ kind, nonce: crypto.randomUUID() }));
    } catch {}
  }

  clearSession(broadcast = true): void {
    this.generation++;
    this.lifecycle.advance();
    this.access.clear();
    this.csrf.clear();
    this.user.set(null);
    if (broadcast) this.broadcast('logout');
  }

  logout(): Observable<void> {
    if (this.logoutRequest) return this.logoutRequest;
    this.logoutRequest = this.api.logout().pipe(
      catchError((error) => (error.status === 401 ? of(undefined) : throwError(() => error))),
      tap(() => this.clearSession()),
      finalize(() => (this.logoutRequest = undefined)),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.logoutRequest;
  }

  requestPasswordReset(email: string): Observable<void> {
    return this.api.forgotPassword(email);
  }

  resetPassword(token: string, password: string): Observable<void> {
    return this.api.resetPassword(token, password);
  }
}
