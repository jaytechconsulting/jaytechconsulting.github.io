import { Injectable, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { ApiService } from '../api.service';
import type {
  ApiAdminUser,
  PersonalProfileFields,
  PersonalProfileInput,
} from '../models/api.models';

export type AdminUserRole = 'admin' | 'client';

export interface AdminUser extends PersonalProfileFields {
  id: string;
  name: string;
  email: string;
  role: AdminUserRole;
  isActive: boolean;
  createdAt: string;
}

export interface AdminUserInput extends PersonalProfileInput {
  name: string;
  email: string;
  role: AdminUserRole;
  password: string;
}

function toAdminUser(item: ApiAdminUser): AdminUser {
  return {
    ...item,
    id: item.id,
    name: item.name,
    email: item.email,
    role: item.role.toLowerCase() === 'admin' ? 'admin' : 'client',
    isActive: item.isActive,
    createdAt: new Date(item.createdAt).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
  };
}

function apiRole(role: AdminUserRole): string {
  return role === 'admin' ? 'Admin' : 'Client';
}

/** Account type is separate from the access roles managed by the security module. */
@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly api = inject(ApiService);
  private readonly _users = signal<AdminUser[]>([]);
  readonly users = this._users.asReadonly();

  load(): Observable<AdminUser[]> {
    return this.api.adminUsers().pipe(
      map((items) => items.map(toAdminUser)),
      tap((items) => this._users.set(items)),
    );
  }

  get(id: string): Observable<AdminUser> {
    return this.api.adminUser(id).pipe(map(toAdminUser));
  }

  create(input: AdminUserInput): Observable<AdminUser> {
    return this.api.createAdminUser({ ...input, role: apiRole(input.role) }).pipe(
      map(toAdminUser),
      tap((user) => this._users.update((list) => [...list, user])),
    );
  }

  update(id: string, input: AdminUserInput): Observable<AdminUser> {
    const { password, ...fields } = input;
    return this.api.updateAdminUser(id, { ...fields, role: apiRole(input.role) }).pipe(
      map(toAdminUser),
      tap((user) => this._users.update((list) => list.map((u) => (u.id === id ? user : u)))),
    );
  }

  remove(id: string): Observable<void> {
    return this.api.deleteAdminUser(id).pipe(
      tap(() => this._users.update((list) => list.filter((u) => u.id !== id))),
      map(() => undefined),
    );
  }

  activate(id: string): Observable<AdminUser> {
    return this.api.activateAdminUser(id).pipe(
      map(toAdminUser),
      tap((user) =>
        this._users.update((list) => list.map((item) => (item.id === id ? user : item))),
      ),
    );
  }
}
