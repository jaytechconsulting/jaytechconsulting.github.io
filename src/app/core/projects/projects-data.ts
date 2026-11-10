export interface Project {
  slug: string;
  title: string;
  client: string;
  cat: string;
  year: string;
  color: string;
  tags: string[];
  metric: string;
  glyph: string;
  logo: string;
  duration: string;
  desc: string;
  summary: string;
  challenge: string;
  solution: string;
  results: [string, string][];
  progress: number;
  status: string;
}

/** @deprecated Use ProjectsService for backend data. Kept for legacy admin view typing. */
export const PROJECTS: Project[] = [];
