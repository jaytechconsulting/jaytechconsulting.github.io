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
export interface ApiPagedResult<T> { items: T[]; total: number; page: number; pageSize: number; }
export interface ApiHeaderLink { label: string; href: string; variant?: string | null; }
export interface ApiFooterColumn { title: string; links: string[]; }
export interface ApiHeader { cta: string; links: ApiHeaderLink[]; }
export interface ApiFooter { about: string; email: string; phone: string; columns: ApiFooterColumn[]; }
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
export interface ApiTicket { id: string; code: string; title: string; description: string; priority: string; status: string; createdAt: string; updatedAt?: string; }
export interface ApiUser { id: string; name: string; email: string; role: string; avatarUrl?: string | null; avatarZoom?:number; avatarX?:number; avatarY?:number; }
export interface ApiAdminUser extends PersonalProfileFields { id: string; name: string; email: string; role: string; isActive: boolean; createdAt: string; }

export interface PersonalProfileFields {
  avatarUrl?:string|null; avatarZoom?:number; avatarX?:number; avatarY?:number;
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
  avatarUrl?:string; avatarZoom?:number; avatarX?:number; avatarY?:number;
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
