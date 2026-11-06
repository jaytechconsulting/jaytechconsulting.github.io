import type { CatalogDetails } from './catalog.service';
import type { ApiProfile, PersonalProfileInput } from './models/api.models';
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import type {
  ApiAdminUser,
  ApiCms,
  ApiCompany,
  ApiFooter,
  ApiHeader,
  ApiPagedResult,
  ApiPlan,
  ApiProject,
  ApiResponse,
  ApiReview,
  ApiServiceItem,
  ApiSiteContent,
  ApiTeamMember,
  ApiTicket,
  ApiTrainingProgram,
  ApiUser,
} from './models/api.models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  private unwrap<T>(request: Observable<ApiResponse<T>>): Observable<T> {
    return request.pipe(map(response => response.data));
  }

  login(email: string, password: string): Observable<ApiUser> {
    return this.unwrap(this.http.post<ApiResponse<ApiUser>>(`${this.baseUrl}/auth/login`, { email, password }));
  }

  lookupDocument(documentType:string,documentNumber:string):Observable<{givenNames?:string|null;paternalSurname?:string|null;maternalSurname?:string|null;legalName?:string|null;fullName?:string|null;source:string}> {return this.unwrap(this.http.post<ApiResponse<{givenNames?:string|null;paternalSurname?:string|null;maternalSurname?:string|null;legalName?:string|null;fullName?:string|null;source:string}>>(`${this.baseUrl}/documents/lookup`,{documentType,documentNumber}));}

  catalogDetails(code:string):Observable<CatalogDetails> {return this.unwrap(this.http.get<ApiResponse<CatalogDetails>>(`${this.baseUrl}/catalogos/${encodeURIComponent(code)}/detalles`));}
  currentProfile(): Observable<Omit<ApiProfile, 'token'>> { return this.unwrap(this.http.get<ApiResponse<Omit<ApiProfile, 'token'>>>(`${this.baseUrl}/auth/me`)); }
  updateProfile(input: string | PersonalProfileInput): Observable<ApiProfile> { return this.unwrap(this.http.put<ApiResponse<ApiProfile>>(`${this.baseUrl}/auth/me`, typeof input === 'string' ? {name:input} : input)); }
  changeEmail(email: string, currentPassword: string): Observable<ApiUser> { return this.unwrap(this.http.post<ApiResponse<ApiUser>>(`${this.baseUrl}/auth/change-email`, {email,currentPassword})); }
  changePassword(currentPassword: string, newPassword: string): Observable<void> { return this.unwrap(this.http.post<ApiResponse<void>>(`${this.baseUrl}/auth/change-password`, {currentPassword,newPassword})); }

  forgotPassword(email: string): Observable<void> {
    return this.unwrap(this.http.post<ApiResponse<void>>(`${this.baseUrl}/auth/forgot-password`, { email }));
  }

  resetPassword(token: string, password: string): Observable<void> {
    return this.unwrap(this.http.post<ApiResponse<void>>(`${this.baseUrl}/auth/reset-password`, { token, newPassword: password }));
  }

  projects(): Observable<ApiProject[]> { return this.unwrap(this.http.get<ApiResponse<ApiProject[]>>(`${this.baseUrl}/projects`)); }
  project(slug: string): Observable<ApiProject> {
    return this.unwrap(this.http.get<ApiResponse<ApiProject>>(`${this.baseUrl}/projects/${encodeURIComponent(slug)}`));
  }
  clientProjects(): Observable<ApiProject[]> { return this.unwrap(this.http.get<ApiResponse<ApiProject[]>>(`${this.baseUrl}/projects/client`)); }
  reviews(): Observable<ApiReview[]> { return this.unwrap(this.http.get<ApiResponse<ApiReview[]>>(`${this.baseUrl}/reviews`)); }
  companies(): Observable<ApiCompany[]> { return this.unwrap(this.http.get<ApiResponse<ApiCompany[]>>(`${this.baseUrl}/companies`)); }
  tickets(): Observable<ApiTicket[]> { return this.unwrap(this.http.get<ApiResponse<ApiTicket[]>>(`${this.baseUrl}/tickets`)); }

  createTicket(input: { title: string; description: string; priority: string }): Observable<ApiTicket> {
    return this.unwrap(this.http.post<ApiResponse<ApiTicket>>(`${this.baseUrl}/tickets`, input));
  }

  createProposal(input: unknown): Observable<unknown> { return this.unwrap(this.http.post<ApiResponse<unknown>>(`${this.baseUrl}/proposals`, input)); }
  createContact(input: unknown): Observable<unknown> { return this.unwrap(this.http.post<ApiResponse<unknown>>(`${this.baseUrl}/contacts`, input)); }

  cms(includeUnpublished = false): Observable<ApiCms> {
    return this.unwrap(this.http.get<ApiResponse<ApiCms>>(`${this.baseUrl}/cms${includeUnpublished ? '/all' : ''}`));
  }
  siteContent(includeUnpublished = false): Observable<ApiSiteContent[]> {
    return this.unwrap(this.http.get<ApiResponse<ApiSiteContent[]>>(`${this.baseUrl}/content${includeUnpublished ? '/all' : ''}`));
  }
  updateSiteContent(key: string, input: unknown): Observable<ApiSiteContent> {
    return this.unwrap(this.http.put<ApiResponse<ApiSiteContent>>(`${this.baseUrl}/content/${encodeURIComponent(key)}`, input));
  }

  createCompany(input: unknown): Observable<ApiCompany> { return this.unwrap(this.http.post<ApiResponse<ApiCompany>>(`${this.baseUrl}/companies`, input)); }
  updateCompany(id: string, input: unknown): Observable<ApiCompany> { return this.unwrap(this.http.put<ApiResponse<ApiCompany>>(`${this.baseUrl}/companies/${encodeURIComponent(id)}`, input)); }
  deleteCompany(id: string): Observable<void> { return this.unwrap(this.http.delete<ApiResponse<void>>(`${this.baseUrl}/companies/${encodeURIComponent(id)}`)); }

  createReview(input: unknown): Observable<ApiReview> { return this.unwrap(this.http.post<ApiResponse<ApiReview>>(`${this.baseUrl}/reviews/cms`, input)); }
  updateReview(id: string, input: unknown): Observable<ApiReview> { return this.unwrap(this.http.put<ApiResponse<ApiReview>>(`${this.baseUrl}/reviews/${encodeURIComponent(id)}`, input)); }
  deleteReview(id: string): Observable<void> { return this.unwrap(this.http.delete<ApiResponse<void>>(`${this.baseUrl}/reviews/${encodeURIComponent(id)}`)); }

  createService(input: unknown): Observable<ApiServiceItem> { return this.unwrap(this.http.post<ApiResponse<ApiServiceItem>>(`${this.baseUrl}/services`, input)); }
  updateService(id: string, input: unknown): Observable<ApiServiceItem> { return this.unwrap(this.http.put<ApiResponse<ApiServiceItem>>(`${this.baseUrl}/services/${encodeURIComponent(id)}`, input)); }
  deleteService(id: string): Observable<void> { return this.unwrap(this.http.delete<ApiResponse<void>>(`${this.baseUrl}/services/${encodeURIComponent(id)}`)); }

  createProject(input: unknown): Observable<ApiProject> { return this.unwrap(this.http.post<ApiResponse<ApiProject>>(`${this.baseUrl}/projects`, input)); }
  updateProject(id: string, input: unknown): Observable<ApiProject> { return this.unwrap(this.http.put<ApiResponse<ApiProject>>(`${this.baseUrl}/projects/${encodeURIComponent(id)}`, input)); }
  deleteProject(id: string): Observable<void> { return this.unwrap(this.http.delete<ApiResponse<void>>(`${this.baseUrl}/projects/${encodeURIComponent(id)}`)); }

  createPlan(input: unknown): Observable<ApiPlan> { return this.unwrap(this.http.post<ApiResponse<ApiPlan>>(`${this.baseUrl}/plans`, input)); }
  updatePlan(id: string, input: unknown): Observable<ApiPlan> { return this.unwrap(this.http.put<ApiResponse<ApiPlan>>(`${this.baseUrl}/plans/${encodeURIComponent(id)}`, input)); }
  deletePlan(id: string): Observable<void> { return this.unwrap(this.http.delete<ApiResponse<void>>(`${this.baseUrl}/plans/${encodeURIComponent(id)}`)); }

  createTeamMember(input: unknown): Observable<ApiTeamMember> { return this.unwrap(this.http.post<ApiResponse<ApiTeamMember>>(`${this.baseUrl}/team-members`, input)); }
  updateTeamMember(id: string, input: unknown): Observable<ApiTeamMember> { return this.unwrap(this.http.put<ApiResponse<ApiTeamMember>>(`${this.baseUrl}/team-members/${encodeURIComponent(id)}`, input)); }
  deleteTeamMember(id: string): Observable<void> { return this.unwrap(this.http.delete<ApiResponse<void>>(`${this.baseUrl}/team-members/${encodeURIComponent(id)}`)); }

  trainingPrograms(params: { search?: string; modality?: string; sortBy?: string; sortDir?: string; page?: number; pageSize?: number }): Observable<ApiPagedResult<ApiTrainingProgram>> {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.modality) query.set('modality', params.modality);
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.sortDir) query.set('sortDir', params.sortDir);
    if (params.page) query.set('page', String(params.page));
    if (params.pageSize) query.set('pageSize', String(params.pageSize));
    const qs = query.toString();
    return this.unwrap(this.http.get<ApiResponse<ApiPagedResult<ApiTrainingProgram>>>(`${this.baseUrl}/training-programs${qs ? `?${qs}` : ''}`));
  }
  trainingProgram(id: string): Observable<ApiTrainingProgram> { return this.unwrap(this.http.get<ApiResponse<ApiTrainingProgram>>(`${this.baseUrl}/training-programs/${encodeURIComponent(id)}`)); }
  trainingProgramsAll(): Observable<ApiTrainingProgram[]> { return this.unwrap(this.http.get<ApiResponse<ApiTrainingProgram[]>>(`${this.baseUrl}/training-programs/all`)); }
  createTrainingProgram(input: unknown): Observable<ApiTrainingProgram> { return this.unwrap(this.http.post<ApiResponse<ApiTrainingProgram>>(`${this.baseUrl}/training-programs`, input)); }
  updateTrainingProgram(id: string, input: unknown): Observable<ApiTrainingProgram> { return this.unwrap(this.http.put<ApiResponse<ApiTrainingProgram>>(`${this.baseUrl}/training-programs/${encodeURIComponent(id)}`, input)); }
  deleteTrainingProgram(id: string): Observable<void> { return this.unwrap(this.http.delete<ApiResponse<void>>(`${this.baseUrl}/training-programs/${encodeURIComponent(id)}`)); }

  updateHeader(input: unknown): Observable<ApiHeader> { return this.unwrap(this.http.put<ApiResponse<ApiHeader>>(`${this.baseUrl}/site-settings/header`, input)); }
  updateFooter(input: unknown): Observable<ApiFooter> { return this.unwrap(this.http.put<ApiResponse<ApiFooter>>(`${this.baseUrl}/site-settings/footer`, input)); }

  adminUsers(): Observable<ApiAdminUser[]> {
    return this.unwrap(this.http.get<ApiResponse<ApiAdminUser[]>>(`${this.baseUrl}/users`));
  }
  adminUser(id:string):Observable<ApiAdminUser> {return this.unwrap(this.http.get<ApiResponse<ApiAdminUser>>(`${this.baseUrl}/users/${encodeURIComponent(id)}`));}
  createAdminUser(input: { name: string; email: string; password: string; role: string } & Partial<PersonalProfileInput>): Observable<ApiAdminUser> {
    return this.unwrap(this.http.post<ApiResponse<ApiAdminUser>>(`${this.baseUrl}/users`, input));
  }
  updateAdminUser(id: string, input: { name: string; email: string; role: string } & Partial<PersonalProfileInput>): Observable<ApiAdminUser> {
    return this.unwrap(this.http.put<ApiResponse<ApiAdminUser>>(`${this.baseUrl}/users/${encodeURIComponent(id)}`, input));
  }
  deleteAdminUser(id: string): Observable<ApiAdminUser> {
    return this.unwrap(this.http.delete<ApiResponse<ApiAdminUser>>(`${this.baseUrl}/users/${encodeURIComponent(id)}`));
  }
  activateAdminUser(id: string): Observable<ApiAdminUser> {
    return this.unwrap(this.http.patch<ApiResponse<ApiAdminUser>>(`${this.baseUrl}/users/${encodeURIComponent(id)}/activate`, {}));
  }
}
