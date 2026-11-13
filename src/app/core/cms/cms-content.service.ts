import type { SocialLink } from './social-links';
import { CmsCollectionRepository } from './cms-collection.repository';
import { normalizeAnnouncement } from '../models/announcement';
import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';
import {
  Observable,
  forkJoin,
  map,
  switchMap,
  tap,
  catchError,
  throwError,
  finalize,
  shareReplay,
  timeout,
  Subject,
  takeUntil,
} from 'rxjs';
import { ApiService } from '../api.service';
import type { ApiCms } from '../models/api.models';

import type {
  CmsSectionId,
  CmsAnnouncement,
  CmsPageDesignId,
  CmsPageDesign,
  CmsLoaderConfig,
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
  private readonly cancelPublic = new Subject<void>();
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
  readonly homeSectionOrder = computed(() => this.state().homeSectionOrder);
  readonly footer = computed(() => this.state().footer);
  readonly socialLinks = computed(() => this.state().socialLinks);

  constructor() {
    if (!/^\/admin(?:[\/;]|$)/.test(inject(DOCUMENT).location.pathname)) this.retryPublic();
  }

  load(includeUnpublished: boolean): Observable<CmsContentState> {
    if (!includeUnpublished) return this.loadPublic();
    // A public response started before entering the CMS must not overwrite its draft state.
    this.cancelPublic.next();
    const statuses = [this.contentStatus, this.headerStatus, this.collectionsStatus];
    for (const status of statuses) if (status() !== 'ready') status.set('loading');
    const content$ = this.api.siteContent(true).pipe(
      tap((content) => {
        const next = stateFromApi({} as ApiCms, content);
        this.state.update((state) => ({
          ...state,
          sections: next.sections,
          homeSectionOrder: next.homeSectionOrder,
          pages: next.pages,
          announcement: next.announcement,
          socialLinks: next.socialLinks,
          loader: next.loader,
          heroAnimation: next.heroAnimation,
        }));
        this.contentStatus.set('ready');
      }),
    );
    const collections$ = this.api.cms(true).pipe(
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
          header: next.header,
          footer: next.footer,
        }));
        this.headerStatus.set('ready');
        this.collectionsStatus.set('ready');
      }),
    );
    return forkJoin({ content: content$, cms: collections$ }).pipe(
      map(() => this.state()),
      tap({
        error: () => {
          for (const status of statuses) if (status() !== 'ready') status.set('error');
        },
      }),
    );
  }

  /** One coherent published snapshot; never persist stale content in browser storage. */
  private loadPublic(): Observable<CmsContentState> {
    if (this.pendingPublic) return this.pendingPublic;
    const statuses = [this.contentStatus, this.headerStatus, this.collectionsStatus];
    for (const status of statuses) if (status() !== 'ready') status.set('loading');
    this.pendingPublic = this.api.publicSite().pipe(
      timeout(15000),
      takeUntil(this.cancelPublic),
      map((snapshot) => stateFromApi(snapshot.cms, snapshot.content)),
      tap((state) => {
        this.state.set(state);
        for (const status of statuses) status.set('ready');
      }),
      catchError((error) => {
        for (const status of statuses) if (status() !== 'ready') status.set('error');
        return throwError(() => error);
      }),
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

  saveSocialLinks(links: SocialLink[]): Observable<CmsContentState> {
    return this.api
      .updateSiteContent('site.social-links', {
        key: 'site.social-links',
        title: 'Redes sociales',
        body: JSON.stringify(links),
        imageUrl: null,
        status: 1,
      })
      .pipe(switchMap(() => this.load(true)));
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
      ...(value.content !== undefined ? { content: value.content } : {}),
      ...(value.faqs !== undefined ? { faqs: value.faqs } : {}),
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

  saveHomeSectionOrder(order: CmsContentState['homeSectionOrder']): Observable<CmsContentState> {
    const key = 'home.section-order';
    return this.api
      .updateSiteContent(key, {
        key,
        title: 'Orden de Inicio',
        body: JSON.stringify(order),
        imageUrl: null,
        status: 1,
      })
      .pipe(
        tap(() => this.state.update((state) => ({ ...state, homeSectionOrder: [...order] }))),
        map(() => this.state()),
      );
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
}
