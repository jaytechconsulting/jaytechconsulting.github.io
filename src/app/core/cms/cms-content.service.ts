import { CmsCollectionRepository } from './cms-collection.repository';
import { normalizeAnnouncement } from '../models/announcement';
import { Injectable, computed, inject, signal } from '@angular/core';
import {
  Observable,
  forkJoin,
  map,
  switchMap,
  tap,
  catchError,
  of,
  throwError,
  finalize,
  shareReplay,
  timeout,
} from 'rxjs';
import { ApiService } from '../api.service';
import type { ApiCms } from '../models/api.models';

import type {
  CmsSectionId,
  CmsAnnouncement,
  CmsPageDesignId,
  CmsPageDesign,
  CmsLoaderConfig,
  CmsHeroAnimation,
  CmsContentState,
  CmsCollectionKey,
  CmsEntityItem,
} from './cms.models';
import { emptyState } from './cms.defaults';
import { stateFromApi } from './cms.mappers';
export type * from './cms.models';

@Injectable({ providedIn: 'root' })
export class CmsContentService {
  private readonly api = inject(ApiService);
  private readonly collectionsRepository = inject(CmsCollectionRepository);
  private readonly state = signal<CmsContentState>(emptyState());
  private pendingPublic?: Observable<CmsContentState>;
  readonly headerStatus = signal<'loading' | 'ready' | 'error'>('loading');
  readonly contentStatus = signal<'loading' | 'ready' | 'error'>('loading');
  readonly collectionsStatus = signal<'loading' | 'ready' | 'error'>('loading');

  readonly companies = computed(() => this.state().companies);
  readonly reviews = computed(() => this.state().reviews);
  readonly services = computed(() => this.state().services);
  readonly projects = computed(() => this.state().projects);
  readonly plans = computed(() => this.state().plans);
  readonly teamMembers = computed(() => this.state().teamMembers);
  readonly sections = computed(() => this.state().sections);
  readonly announcement = computed(() => this.state().announcement);
  readonly pages = computed(() => this.state().pages);
  readonly loader = computed(() => this.state().loader);
  readonly heroAnimation = computed(() => this.state().heroAnimation);
  readonly header = computed(() => this.state().header);
  readonly footer = computed(() => this.state().footer);

  constructor() {
    this.load(false).subscribe({ error: () => undefined });
  }

  load(includeUnpublished: boolean): Observable<CmsContentState> {
    if (!includeUnpublished && this.pendingPublic) return this.pendingPublic;
    const markLoading = (status: typeof this.contentStatus) => {
      if (status() !== 'ready') status.set('loading');
    };
    markLoading(this.contentStatus);
    markLoading(this.collectionsStatus);
    markLoading(this.headerStatus);
    const failure = (status: typeof this.contentStatus) => (error: unknown) => {
      if (status() !== 'ready') status.set('error');
      return includeUnpublished ? throwError(() => error) : of(null);
    };
    const deadline = <T>(source: Observable<T>) =>
      includeUnpublished ? source : source.pipe(timeout(15000));
    const content$ = deadline(this.api.siteContent(includeUnpublished)).pipe(
      tap((content) => {
        const next = stateFromApi({} as ApiCms, content);
        this.state.update((state) => ({
          ...state,
          sections: next.sections,
          pages: next.pages,
          announcement: next.announcement,
          loader: next.loader,
          heroAnimation: next.heroAnimation,
        }));
        this.contentStatus.set('ready');
      }),
      catchError(failure(this.contentStatus)),
    );
    const collections$ = deadline(this.api.cms(includeUnpublished)).pipe(
      tap((cms) => {
        const next = stateFromApi(cms, []);
        this.state.update((state) => ({
          ...state,
          companies: next.companies,
          reviews: next.reviews,
          services: next.services,
          projects: next.projects,
          plans: next.plans,
          teamMembers: next.teamMembers,
          ...(includeUnpublished ? { header: next.header, footer: next.footer } : {}),
        }));
        if (includeUnpublished) this.headerStatus.set('ready');
        this.collectionsStatus.set('ready');
      }),
      catchError(failure(this.collectionsStatus)),
    );
    // First-screen settings take one DB read, rather than waiting for all collections.
    const layout$ = includeUnpublished
      ? of(null)
      : deadline(this.api.siteSettings()).pipe(
          tap((settings) => {
            const next = stateFromApi(settings as ApiCms, []);
            this.state.update((state) => ({ ...state, header: next.header, footer: next.footer }));
            this.headerStatus.set('ready');
          }),
          catchError(failure(this.headerStatus)),
        );
    const result = forkJoin({ content: content$, cms: collections$, layout: layout$ }).pipe(
      map(() => this.state()),
      tap({
        error: () => {
          for (const status of [this.contentStatus, this.collectionsStatus, this.headerStatus])
            if (status() !== 'ready') status.set('error');
        },
      }),
    );
    if (includeUnpublished) return result;
    this.pendingPublic = result.pipe(
      finalize(() => (this.pendingPublic = undefined)),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.pendingPublic;
  }
  retryPublic(): void {
    if (this.pendingPublic) return;
    this.load(false).subscribe({ error: () => undefined });
  }

  section(id: CmsSectionId) {
    return computed(
      () =>
        this.state().sections.find((section) => section.id === id) ??
        emptyState().sections.find((section) => section.id === id)!,
    );
  }

  saveCollection(
    key: CmsCollectionKey,
    item: CmsEntityItem,
    isNew: boolean,
    displayOrder: number,
  ): Observable<CmsContentState> {
    return this.collectionsRepository
      .save(key, item, isNew, displayOrder)
      .pipe(switchMap(() => this.load(true)));
  }
  deleteCollection(
    key: Exclude<CmsCollectionKey, 'sections'>,
    id: string,
  ): Observable<CmsContentState> {
    return this.collectionsRepository.remove(key, id).pipe(switchMap(() => this.load(true)));
  }

  saveHeader(value: CmsContentState['header']): Observable<CmsContentState> {
    return this.api.updateHeader(value).pipe(switchMap(() => this.load(true)));
  }

  saveFooter(value: CmsContentState['footer']): Observable<CmsContentState> {
    const input = {
      ...value,
      columns: value.columns.map((column) => ({
        title: column.title,
        links: column.links
          .split('\n')
          .map((link) => link.trim())
          .filter(Boolean),
      })),
    };
    return this.api.updateFooter(input).pipe(switchMap(() => this.load(true)));
  }

  saveAnnouncement(value: CmsAnnouncement): Observable<CmsContentState> {
    const design = normalizeAnnouncement(value);
    const details = JSON.stringify({
      ...design,
      message: undefined,
      active: undefined,
      backgroundImage: undefined,
      linkLabel: design.buttons[0]?.label || '',
      linkHref: design.buttons[0]?.href || '',
    });
    const input = {
      key: 'site.announcement',
      title: value.message,
      body: details,
      imageUrl: value.backgroundImage || null,
      status: value.active ? 1 : 0,
    };
    return this.api
      .updateSiteContent('site.announcement', input)
      .pipe(switchMap(() => this.load(true)));
  }

  savePageDesign(id: CmsPageDesignId, value: CmsPageDesign): Observable<CmsContentState> {
    const key = `page.${id}`;
    const details = JSON.stringify({
      description: value.description,
      backgroundColor: value.backgroundColor,
    });
    const input = {
      key,
      title: value.heading,
      body: details,
      imageUrl: value.backgroundImage || null,
      status: 1,
    };
    return this.api.updateSiteContent(key, input).pipe(switchMap(() => this.load(true)));
  }

  saveLoaderConfig(value: CmsLoaderConfig): Observable<CmsContentState> {
    const details = JSON.stringify({ color: value.color });
    const input = {
      key: 'site.loader',
      title: '',
      body: details,
      imageUrl: null,
      status: value.enabled ? 1 : 0,
    };
    return this.api.updateSiteContent('site.loader', input).pipe(switchMap(() => this.load(true)));
  }

  saveHeroAnimation(value: CmsHeroAnimation): Observable<CmsContentState> {
    const details = JSON.stringify({ videoUrl: value.videoUrl });
    const input = {
      key: 'home.heroAnimation',
      title: '',
      body: details,
      imageUrl: null,
      status: value.enabled ? 1 : 0,
    };
    return this.api
      .updateSiteContent('home.heroAnimation', input)
      .pipe(switchMap(() => this.load(true)));
  }
}
