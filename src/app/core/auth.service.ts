import { AccessService } from './access.service';
import type { ApiUser, ApiProfile, PersonalProfileFields, PersonalProfileInput } from './models/api.models';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';

export type UserRole = 'client' | 'admin';

export interface AuthUser {
  id?: string;
  name: string;
  email: string;
  role: UserRole;
  initials: string;
  avatarUrl?: string;
  avatarZoom?:number; avatarX?:number; avatarY?:number;
}

const STORAGE_KEY = 'jaytech_session';

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

/** Persiste la sesión devuelta por el backend para conservarla entre recargas. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly access=inject(AccessService);
  private readonly user = signal<AuthUser | null>(readStoredUser());

  readonly currentUser = this.user.asReadonly();
  readonly isAuthenticated = computed(() => this.user() !== null);

  private persistProfile(response: Omit<ApiUser, 'token'>): AuthUser {
    const role:UserRole=response.role.toLowerCase()==='admin'?'admin':'client';
    const user:AuthUser={id:response.id,name:response.name,email:response.email,role,avatarUrl:response.avatarUrl ?? undefined,avatarZoom:response.avatarZoom ?? 1,avatarX:response.avatarX ?? 50,avatarY:response.avatarY ?? 50,initials:response.name.split(' ').filter(Boolean).map(part=>part[0]).join('').slice(0,2).toUpperCase()};
    this.user.set(user);localStorage.setItem(STORAGE_KEY,JSON.stringify(user));return user;
  }
  private applySession(response:ApiUser):AuthUser {localStorage.setItem('jaytech_token',response.token);return this.persistProfile(response);}
  login(email:string,password:string):Observable<AuthUser> {return this.api.login(email,password).pipe(map(response=>this.applySession(response)));}
  loadProfile():Observable<AuthUser & PersonalProfileFields> {return this.api.currentProfile().pipe(map(response=>this.profileDetails(this.persistProfile(response),response)));}
  updateProfile(input:string|PersonalProfileInput):Observable<AuthUser & PersonalProfileFields> {return this.api.updateProfile(input).pipe(map(response=>this.profileDetails(this.applySession(response),response)));}
  private profileDetails(user:AuthUser,response:PersonalProfileFields):AuthUser & PersonalProfileFields {return {...user,givenNames:response.givenNames,paternalSurname:response.paternalSurname,maternalSurname:response.maternalSurname,documentType:response.documentType,documentNumber:response.documentNumber,phone:response.phone,contactEmail:response.contactEmail,sex:response.sex};}
  changeEmail(email:string,currentPassword:string):Observable<AuthUser> {return this.api.changeEmail(email,currentPassword).pipe(map(response=>this.applySession(response)));}
  changePassword(currentPassword:string,newPassword:string):Observable<void> {return this.api.changePassword(currentPassword,newPassword);}

  logout(): void {
    this.access.clear();
    this.user.set(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('jaytech_token');
  }

  requestPasswordReset(email: string): Observable<void> {
    return this.api.forgotPassword(email);
  }

  resetPassword(token: string, password: string): Observable<void> {
    return this.api.resetPassword(token, password);
  }
}
