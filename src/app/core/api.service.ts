import type { CatalogDetails } from './catalog/catalog.models';
import type { ApiProfile, PersonalProfileInput, DocumentLookupResult } from './models/api.models';
import { Injectable, inject } from '@angular/core';
import { ApiClient } from './http/api-client';
import type { AccessSession } from './access/access.service';
import { Observable } from 'rxjs';
import type {
  ApiAdminUser,
  ApiCms,
  ApiPublicSite,
  ApiCompany,
  ApiComplaint,
  ApiComplaintBookInfo,
  ApiComplaintInput,
  ApiComplaintReceipt,
  ApiComplaintSettings,
  ApiPublishStatus,
  ApiCourse,
  ApiCourseAdmin,
  ApiCoursePurchase,
  ApiFooter,
  ApiHeader,
  ApiPagedResult,
  ApiPlan,
  ApiProject,
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
  private readonly client = inject(ApiClient);

  login(email: string, password: string): Observable<ApiUser> {
    return this.client.post<ApiUser>(`/auth/login`, { email, password });
  }

  logout(): Observable<void> {
    return this.client.post<void>(`/auth/logout`, {});
  }

  lookupDocument(documentType: string, documentNumber: string): Observable<DocumentLookupResult> {
    return this.client.post<DocumentLookupResult>(`/documents/lookup`, {
      documentType,
      documentNumber,
    });
  }

  catalogDetails(code: string): Observable<CatalogDetails> {
    return this.client.get<CatalogDetails>(`/catalogos/${encodeURIComponent(code)}/detalles`);
  }
  currentProfile(): Observable<ApiProfile> {
    return this.client.get<ApiProfile>(`/auth/me`);
  }
  adminBootstrap(): Observable<{ profile: ApiProfile; access: AccessSession }> {
    return this.client.get('/auth/admin-bootstrap');
  }
  updateProfile(input: string | PersonalProfileInput): Observable<ApiProfile> {
    return this.client.put<ApiProfile>(
      `/auth/me`,
      typeof input === 'string' ? { name: input } : input,
    );
  }
  changeEmail(email: string, currentPassword: string): Observable<ApiUser> {
    return this.client.post<ApiUser>(`/auth/change-email`, { email, currentPassword });
  }
  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.client.post<void>(`/auth/change-password`, { currentPassword, newPassword });
  }

  forgotPassword(email: string): Observable<void> {
    return this.client.post<void>(`/auth/forgot-password`, { email });
  }

  resetPassword(token: string, password: string): Observable<void> {
    return this.client.post<void>(`/auth/reset-password`, { token, newPassword: password });
  }

  projects(): Observable<ApiProject[]> {
    return this.client.getPublic<ApiProject[]>(`/projects`);
  }
  project(slug: string): Observable<ApiProject> {
    return this.client.getPublic<ApiProject>(`/projects/${encodeURIComponent(slug)}`);
  }
  clientProjects(): Observable<ApiProject[]> {
    return this.client.get<ApiProject[]>(`/projects/client`);
  }
  reviews(): Observable<ApiReview[]> {
    return this.client.get<ApiReview[]>(`/reviews`);
  }
  companies(): Observable<ApiCompany[]> {
    return this.client.get<ApiCompany[]>(`/companies`);
  }
  tickets(): Observable<ApiTicket[]> {
    return this.client.get<ApiTicket[]>(`/tickets`);
  }

  createTicket(input: {
    title: string;
    description: string;
    priority: string;
  }): Observable<ApiTicket> {
    return this.client.post<ApiTicket>(`/tickets`, input);
  }

  createProposal(input: unknown): Observable<unknown> {
    return this.client.post<unknown>(`/proposals`, input);
  }
  createContact(input: unknown): Observable<unknown> {
    return this.client.post<unknown>(`/contacts`, input);
  }

  complaintBookInfo(): Observable<ApiComplaintBookInfo> {
    return this.client.getPublic<ApiComplaintBookInfo>(`/complaints/info`);
  }
  createComplaint(input: ApiComplaintInput): Observable<ApiComplaintReceipt> {
    return this.client.post<ApiComplaintReceipt>(`/complaints`, input);
  }
  complaint(id: string): Observable<ApiComplaint> {
    return this.client.get<ApiComplaint>(`/complaints/${encodeURIComponent(id)}`);
  }
  respondComplaint(id: string, response: string, sendEmail: boolean): Observable<ApiComplaint> {
    return this.client.patch<ApiComplaint>(`/complaints/${encodeURIComponent(id)}/response`, {
      response,
      sendEmail,
    });
  }
  publishStatus(): Observable<ApiPublishStatus> {
    return this.client.get<ApiPublishStatus>(`/publishing`);
  }
  publishSite(): Observable<void> {
    return this.client.post<void>(`/publishing`, {});
  }
  updatePublishSettings(autoPublish: boolean): Observable<{ autoPublish: boolean }> {
    return this.client.put<{ autoPublish: boolean }>(`/publishing/settings`, { autoPublish });
  }
  complaintSettings(): Observable<ApiComplaintSettings> {
    return this.client.get<ApiComplaintSettings>(`/complaints/settings`);
  }
  updateComplaintSettings(
    input: Omit<ApiComplaintSettings, 'smtpEnabled' | 'updatedAt'>,
  ): Observable<ApiComplaintSettings> {
    return this.client.put<ApiComplaintSettings>(`/complaints/settings`, input);
  }

  publicSite(): Observable<ApiPublicSite> {
    return this.client.getPublic<ApiPublicSite>('/public-site');
  }
  cms(includeUnpublished = false): Observable<ApiCms> {
    return this.client.get<ApiCms>(`/cms${includeUnpublished ? '/all' : ''}`);
  }
  siteSettings(): Observable<Pick<ApiCms, 'header' | 'footer'>> {
    return this.client.get<Pick<ApiCms, 'header' | 'footer'>>(`/site-settings`);
  }
  siteContent(includeUnpublished = false): Observable<ApiSiteContent[]> {
    return this.client.get<ApiSiteContent[]>(`/content${includeUnpublished ? '/all' : ''}`);
  }
  updateSiteContent(key: string, input: unknown): Observable<ApiSiteContent> {
    return this.client.put<ApiSiteContent>(`/content/${encodeURIComponent(key)}`, input);
  }

  createCompany(input: unknown): Observable<ApiCompany> {
    return this.client.post<ApiCompany>(`/companies`, input);
  }
  updateCompany(id: string, input: unknown): Observable<ApiCompany> {
    return this.client.put<ApiCompany>(`/companies/${encodeURIComponent(id)}`, input);
  }
  deleteCompany(id: string): Observable<void> {
    return this.client.delete<void>(`/companies/${encodeURIComponent(id)}`);
  }

  createReview(input: unknown): Observable<ApiReview> {
    return this.client.post<ApiReview>(`/reviews/cms`, input);
  }
  updateReview(id: string, input: unknown): Observable<ApiReview> {
    return this.client.put<ApiReview>(`/reviews/${encodeURIComponent(id)}`, input);
  }
  deleteReview(id: string): Observable<void> {
    return this.client.delete<void>(`/reviews/${encodeURIComponent(id)}`);
  }

  createService(input: unknown): Observable<ApiServiceItem> {
    return this.client.post<ApiServiceItem>(`/services`, input);
  }
  updateService(id: string, input: unknown): Observable<ApiServiceItem> {
    return this.client.put<ApiServiceItem>(`/services/${encodeURIComponent(id)}`, input);
  }
  deleteService(id: string): Observable<void> {
    return this.client.delete<void>(`/services/${encodeURIComponent(id)}`);
  }

  createProject(input: unknown): Observable<ApiProject> {
    return this.client.post<ApiProject>(`/projects`, input);
  }
  updateProject(id: string, input: unknown): Observable<ApiProject> {
    return this.client.put<ApiProject>(`/projects/${encodeURIComponent(id)}`, input);
  }
  deleteProject(id: string): Observable<void> {
    return this.client.delete<void>(`/projects/${encodeURIComponent(id)}`);
  }

  createPlan(input: unknown): Observable<ApiPlan> {
    return this.client.post<ApiPlan>(`/plans`, input);
  }
  updatePlan(id: string, input: unknown): Observable<ApiPlan> {
    return this.client.put<ApiPlan>(`/plans/${encodeURIComponent(id)}`, input);
  }
  deletePlan(id: string): Observable<void> {
    return this.client.delete<void>(`/plans/${encodeURIComponent(id)}`);
  }

  createTeamMember(input: unknown): Observable<ApiTeamMember> {
    return this.client.post<ApiTeamMember>(`/team-members`, input);
  }
  updateTeamMember(id: string, input: unknown): Observable<ApiTeamMember> {
    return this.client.put<ApiTeamMember>(`/team-members/${encodeURIComponent(id)}`, input);
  }
  deleteTeamMember(id: string): Observable<void> {
    return this.client.delete<void>(`/team-members/${encodeURIComponent(id)}`);
  }

  trainingPrograms(params: {
    search?: string;
    modality?: string;
    sortBy?: string;
    sortDir?: string;
    page?: number;
    pageSize?: number;
  }): Observable<ApiPagedResult<ApiTrainingProgram>> {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.modality) query.set('modality', params.modality);
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.sortDir) query.set('sortDir', params.sortDir);
    if (params.page) query.set('page', String(params.page));
    if (params.pageSize) query.set('pageSize', String(params.pageSize));
    const qs = query.toString();
    return this.client.getPublic<ApiPagedResult<ApiTrainingProgram>>(
      `/training-programs${qs ? `?${qs}` : ''}`,
    );
  }
  trainingProgram(id: string): Observable<ApiTrainingProgram> {
    return this.client.getPublic<ApiTrainingProgram>(`/training-programs/${encodeURIComponent(id)}`);
  }
  trainingProgramsAll(): Observable<ApiTrainingProgram[]> {
    return this.client.get<ApiTrainingProgram[]>(`/training-programs/all`);
  }
  createTrainingProgram(input: unknown): Observable<ApiTrainingProgram> {
    return this.client.post<ApiTrainingProgram>(`/training-programs`, input);
  }
  updateTrainingProgram(id: string, input: unknown): Observable<ApiTrainingProgram> {
    return this.client.put<ApiTrainingProgram>(
      `/training-programs/${encodeURIComponent(id)}`,
      input,
    );
  }
  deleteTrainingProgram(id: string): Observable<void> {
    return this.client.delete<void>(`/training-programs/${encodeURIComponent(id)}`);
  }

  courses(): Observable<ApiCourse[]> {
    return this.client.getPublic<ApiCourse[]>(`/courses`);
  }
  course(id: string): Observable<ApiCourse> {
    return this.client.getPublic<ApiCourse>(`/courses/${encodeURIComponent(id)}`);
  }
  coursesAll(): Observable<ApiCourseAdmin[]> {
    return this.client.get<ApiCourseAdmin[]>(`/courses/all`);
  }
  courseAdmin(id: string): Observable<ApiCourseAdmin> {
    return this.client.get<ApiCourseAdmin>(`/courses/admin/${encodeURIComponent(id)}`);
  }
  createCourse(input: unknown): Observable<ApiCourseAdmin> {
    return this.client.post<ApiCourseAdmin>(`/courses`, input);
  }
  updateCourse(id: string, input: unknown): Observable<ApiCourseAdmin> {
    return this.client.put<ApiCourseAdmin>(`/courses/${encodeURIComponent(id)}`, input);
  }
  deleteCourse(id: string): Observable<void> {
    return this.client.delete<void>(`/courses/${encodeURIComponent(id)}`);
  }
  checkoutCart(input: {
    courseIds: string[];
    token: string;
    email: string;
    name: string;
    provider: string;
  }): Observable<{ success: boolean }> {
    return this.client.post<{ success: boolean }>(`/courses/checkout`, input);
  }
  startMercadoPagoCheckout(input: {
    courseIds: string[];
    email: string;
    name: string;
  }): Observable<{ redirectUrl: string }> {
    return this.client.post<{ redirectUrl: string }>(`/courses/checkout/mercadopago/start`, input);
  }
  startNiubizSession(input: { courseIds: string[] }): Observable<{
    sessionKey: string;
    merchantId: string;
    purchaseNumber: string;
    amount: number;
    scriptUrl: string;
  }> {
    return this.client.post<{
      sessionKey: string;
      merchantId: string;
      purchaseNumber: string;
      amount: number;
      scriptUrl: string;
    }>(`/courses/checkout/niubiz/session`, input);
  }
  confirmMercadoPagoCheckout(ref: string, paymentId: string): Observable<{ success: boolean }> {
    const query = new URLSearchParams({ ref, paymentId }).toString();
    return this.client.post<{ success: boolean }>(
      `/courses/checkout/mercadopago/confirm?${query}`,
      {},
    );
  }
  myCoursePurchases(): Observable<ApiCoursePurchase[]> {
    return this.client.get<ApiCoursePurchase[]>(`/courses/my-purchases`);
  }

  updateHeader(input: unknown): Observable<ApiHeader> {
    return this.client.put<ApiHeader>(`/site-settings/header`, input);
  }
  updateFooter(input: unknown): Observable<ApiFooter> {
    return this.client.put<ApiFooter>(`/site-settings/footer`, input);
  }

  adminUsers(): Observable<ApiAdminUser[]> {
    return this.client.get<ApiAdminUser[]>(`/users`);
  }
  adminUser(id: string): Observable<ApiAdminUser> {
    return this.client.get<ApiAdminUser>(`/users/${encodeURIComponent(id)}`);
  }
  createAdminUser(
    input: {
      name: string;
      email: string;
      password: string;
      role: string;
    } & Partial<PersonalProfileInput>,
  ): Observable<ApiAdminUser> {
    return this.client.post<ApiAdminUser>(`/users`, input);
  }
  updateAdminUser(
    id: string,
    input: { name: string; email: string; role: string } & Partial<PersonalProfileInput>,
  ): Observable<ApiAdminUser> {
    return this.client.put<ApiAdminUser>(`/users/${encodeURIComponent(id)}`, input);
  }
  deleteAdminUser(id: string): Observable<ApiAdminUser> {
    return this.client.delete<ApiAdminUser>(`/users/${encodeURIComponent(id)}`);
  }
  activateAdminUser(id: string): Observable<ApiAdminUser> {
    return this.client.patch<ApiAdminUser>(`/users/${encodeURIComponent(id)}/activate`, {});
  }
}
