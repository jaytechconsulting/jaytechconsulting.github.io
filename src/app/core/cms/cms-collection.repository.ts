import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { ApiService } from '../api.service';
import type { CmsCollectionKey, CmsEntityItem } from './cms.models';
import { slugify } from './cms.mappers';

/** Converts editor drafts into existing API contracts; holds no view state. */
@Injectable({ providedIn: 'root' })
export class CmsCollectionRepository {
  private readonly api = inject(ApiService);
  save(
    key: CmsCollectionKey,
    item: CmsEntityItem,
    isNew: boolean,
    displayOrder: number,
  ): Observable<unknown> {
    let request$: Observable<unknown>;
    const id = item['id'];
    switch (key) {
      case 'companies': {
        const input = {
          name: item['name'],
          sector: item['sector'],
          description: '',
          result: item['result'],
          logoUrl: item['logo'] || null,
          websiteUrl: null,
          glyph: item['glyph'],
          accentColor: item['color'],
          isPublished: item['isPublished'] !== 'false',
          displayOrder,
        };
        request$ = isNew ? this.api.createCompany(input) : this.api.updateCompany(id, input);
        break;
      }
      case 'reviews': {
        const input = {
          authorName: item['name'],
          role: item['role'],
          companyName: item['company'],
          body: item['quote'],
          rating: Number(item['rating']) || 5,
          photoUrl: item['photo'] || null,
          accentColor: item['color'],
          status: Number(item['status'] ?? 1),
          displayOrder,
        };
        request$ = isNew ? this.api.createReview(input) : this.api.updateReview(id, input);
        break;
      }
      case 'services': {
        const input = {
          title: item['title'],
          body: item['body'],
          glyph: item['glyph'],
          accentColor: item['color'],
          isPublished: item['isPublished'] !== 'false',
          displayOrder,
        };
        request$ = isNew ? this.api.createService(input) : this.api.updateService(id, input);
        break;
      }
      case 'projects': {
        const input = {
          slug: item['slug'] || slugify(`${item['client']}-${item['title']}`),
          title: item['title'],
          clientName: item['client'],
          category: item['cat'],
          year: Number(item['year']) || new Date().getFullYear(),
          progress: Number(item['progress']) || 0,
          status: item['status'] || 'En desarrollo',
          description: item['summary'],
          metric: item['metric'],
          imageUrl: item['logo'] || null,
          challenge: item['challenge'],
          solution: item['solution'],
          accentColor: item['color'],
          tags: (item['tags'] || '')
            .split('\n')
            .map((tag) => tag.trim())
            .filter(Boolean),
          isPublished: item['isPublished'] !== 'false',
          displayOrder,
        };
        request$ = isNew ? this.api.createProject(input) : this.api.updateProject(id, input);
        break;
      }
      case 'plans': {
        const input = {
          name: item['name'],
          price: item['price'],
          description: item['description'],
          features: (item['features'] || '')
            .split('\n')
            .map((feature) => feature.trim())
            .filter(Boolean),
          isFeatured: item['featured'] === 'Sí',
          cta: item['cta'],
          isPublished: item['isPublished'] !== 'false',
          displayOrder,
        };
        request$ = isNew ? this.api.createPlan(input) : this.api.updatePlan(id, input);
        break;
      }
      case 'sections': {
        const contentKey = `home.${item['id']}`;
        request$ = this.api.updateSiteContent(contentKey, {
          key: contentKey,
          title: item['title'],
          body: item['description'],
          imageUrl: item['image'] || null,
          status: 1,
        });
        break;
      }
      case 'teamMembers': {
        const input = {
          name: item['name'],
          role: item['role'],
          bio: item['bio'],
          photoUrl: item['photo'] || null,
          linkedinUrl: item['linkedin'] || null,
          accentColor: item['color'],
          isPublished: item['isPublished'] !== 'false',
          displayOrder,
        };
        request$ = isNew ? this.api.createTeamMember(input) : this.api.updateTeamMember(id, input);
        break;
      }
    }
    return request$;
  }

  remove(key: Exclude<CmsCollectionKey, 'sections'>, id: string): Observable<unknown> {
    const requests: Record<Exclude<CmsCollectionKey, 'sections'>, () => Observable<unknown>> = {
      companies: () => this.api.deleteCompany(id),
      reviews: () => this.api.deleteReview(id),
      services: () => this.api.deleteService(id),
      projects: () => this.api.deleteProject(id),
      plans: () => this.api.deletePlan(id),
      teamMembers: () => this.api.deleteTeamMember(id),
    };
    return requests[key]();
  }
}
