export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: unknown;
  timestamp: string;
}

export interface ApiProject {
  id: string;
  slug: string;
  title: string;
  clientName: string;
  category: string;
  year: number;
  progress: number;
  status: string;
  description: string;
  metric?: string | null;
  imageUrl?: string | null;
  challenge?: string | null;
  solution?: string | null;
  accentColor?: string | null;
  tags: string[];
  isPublished?: boolean;
  displayOrder?: number;
}

export interface ApiReview {
  id: string;
  authorName: string;
  companyName?: string | null;
  role?: string | null;
  body: string;
  rating: number;
  photoUrl?: string | null;
  accentColor?: string | null;
  status: number;
  displayOrder: number;
  createdAt: string;
  updatedAt?: string;
}
export interface ApiCompany {
  id: string;
  name: string;
  sector?: string | null;
  description?: string | null;
  result?: string | null;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  glyph?: string | null;
  accentColor?: string | null;
  isPublished: boolean;
  displayOrder: number;
}
export interface ApiServiceItem {
  id: string;
  title: string;
  body: string;
  glyph?: string | null;
  accentColor?: string | null;
  isPublished: boolean;
  displayOrder: number;
}
export interface ApiPlan {
  id: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  isFeatured: boolean;
  cta: string;
  isPublished: boolean;
  displayOrder: number;
}
export interface ApiTrainingProgram {
  id: string;
  title: string;
  description: string;
  modality: string;
  duration: string;
  imageUrl?: string | null;
  accentColor?: string | null;
  isPublished: boolean;
  displayOrder: number;
}
export interface ApiCourseMaterial {
  id?: string;
  title: string;
  type: 'video' | 'pdf' | 'archivo';
  url: string;
  displayOrder: number;
}
export interface ApiCourseSyllabusItem {
  id?: string;
  title: string;
  description: string;
  displayOrder: number;
}
export interface ApiCourseReview {
  id?: string;
  authorName: string;
  rating: number;
  body: string;
  displayOrder: number;
}
export interface ApiCourseMaterialCounts {
  videos: number;
  pdfs: number;
  files: number;
}
export interface ApiCourse {
  id: string;
  title: string;
  description: string;
  glyph?: string | null;
  accentColor?: string | null;
  imageUrl?: string | null;
  price: number;
  isPublished: boolean;
  /** Featured in the home best-sellers block; chosen by hand in the admin. */
  isBestSeller?: boolean;
  displayOrder: number;
  syllabus: ApiCourseSyllabusItem[];
  reviews: ApiCourseReview[];
  materialCounts: ApiCourseMaterialCounts;
}
export interface ApiCourseAdmin extends ApiCourse {
  materials: ApiCourseMaterial[];
}
export interface ApiCoursePurchase {
  courseId: string;
  courseTitle: string;
  imageUrl?: string | null;
  purchasedAt: string;
  materials: ApiCourseMaterial[];
}
export interface ApiPagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
export interface ApiHeaderLink {
  label: string;
  href: string;
  variant?: string | null;
}
export interface ApiFooterColumn {
  title: string;
  links: string[];
}
export interface ApiHeader {
  cta: string;
  links: ApiHeaderLink[];
}
export interface ApiFooter {
  about: string;
  email: string;
  phone: string;
  columns: ApiFooterColumn[];
}
export interface ApiTeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  photoUrl?: string | null;
  linkedinUrl?: string | null;
  accentColor?: string | null;
  isPublished: boolean;
  displayOrder: number;
}
export interface ApiCms {
  companies: ApiCompany[];
  reviews: ApiReview[];
  services: ApiServiceItem[];
  projects: ApiProject[];
  plans: ApiPlan[];
  teamMembers: ApiTeamMember[];
  header: ApiHeader;
  footer: ApiFooter;
}
export interface ApiSiteContent {
  id: string;
  key: string;
  title: string;
  body: string;
  imageUrl?: string | null;
  status: number;
  updatedAt: string;
}
export interface ApiTicket {
  id: string;
  code: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}
export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
  avatarZoom?: number;
  avatarX?: number;
  avatarY?: number;
}
export interface ApiAdminUser extends PersonalProfileFields {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface PersonalProfileFields {
  avatarUrl?: string | null;
  avatarZoom?: number;
  avatarX?: number;
  avatarY?: number;
  givenNames?: string | null;
  paternalSurname?: string | null;
  maternalSurname?: string | null;
  documentType?: string | null;
  documentNumber?: string | null;
  phone?: string | null;
  contactEmail?: string | null;
  sex?: string | null;
}
export interface PersonalProfileInput {
  avatarUrl?: string;
  avatarZoom?: number;
  avatarX?: number;
  avatarY?: number;
  givenNames: string;
  paternalSurname: string;
  maternalSurname: string;
  documentType: string;
  documentNumber: string;
  phone: string;
  contactEmail: string;
  sex: string;
}
export type ApiProfile = ApiUser & PersonalProfileFields;

export interface DocumentLookupResult {
  givenNames?: string | null;
  paternalSurname?: string | null;
  maternalSurname?: string | null;
  legalName?: string | null;
  fullName?: string | null;
  source: string;
}

export interface ApiPublicSite {
  cms: ApiCms;
  content: ApiSiteContent[];
}

export interface ApiComplaintInput {
  fullName: string;
  documentType: string;
  documentNumber: string;
  email: string;
  phone: string;
  address: string;
  isMinor: boolean;
  guardianName: string | null;
  itemType: 'producto' | 'servicio';
  itemDescription: string;
  amount: number | null;
  orderReference: string | null;
  claimType: 'reclamo' | 'queja';
  detail: string;
  request: string;
  acceptsTerms: boolean;
}
export interface ApiComplaintReceipt {
  id: string;
  code: string;
  createdAt: string;
  responseDays: number;
  emailSent: boolean;
}
export interface ApiComplaintBookInfo {
  businessName: string;
  businessRuc: string;
  businessAddress: string;
  responseDays: number;
}
export interface ApiComplaint extends Omit<ApiComplaintInput, 'acceptsTerms'> {
  id: string;
  code: string;
  status: 'pendiente' | 'atendido';
  providerResponse: string | null;
  respondedAt: string | null;
  customerEmailSent: boolean;
  ownerEmailSent: boolean;
  createdAt: string;
}
export interface ApiComplaintSettings {
  notifyCustomer: boolean;
  notifyOwner: boolean;
  ownerEmails: string;
  businessName: string;
  businessRuc: string;
  businessAddress: string;
  responseDays: number;
  smtpEnabled: boolean;
  updatedAt: string;
}

export interface ApiPublishRun {
  id: number;
  number: number;
  /** GitHub Actions run status: queued, in_progress, completed… */
  status: string;
  conclusion: string | null;
  event: string;
  title: string;
  createdAt: string;
  startedAt: string | null;
  updatedAt: string;
  url: string;
}
export interface ApiPublishStatus {
  configured: boolean;
  repository: string | null;
  autoPublish: boolean;
  contentChangedAt: string | null;
  contentChangedBy: string | null;
  dispatchedAt: string | null;
  dispatchedBy: string | null;
  /** Saved CMS changes that the published website does not show yet. */
  pendingChanges: boolean;
  publishing: boolean;
  lastPublishedAt: string | null;
  /** Set when the history could not be read from the host. */
  error: string | null;
  runs: ApiPublishRun[];
}
