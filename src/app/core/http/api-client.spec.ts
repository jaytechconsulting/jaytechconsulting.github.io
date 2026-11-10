import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL, ApiClient } from './api-client';

describe('Shared API transport', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'https://api.example.test/api/' },
      ],
    }),
  );
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  it('unwraps data and encodes query values without losing zero or false', () => {
    let result: unknown;
    TestBed.inject(ApiClient)
      .get('/items', { page: 0, active: false, search: 'Perú & más', omit: undefined })
      .subscribe((value) => (result = value));
    const request = TestBed.inject(HttpTestingController).expectOne(
      (r) => r.url === 'https://api.example.test/api/items',
    );
    expect(request.request.params.get('page')).toBe('0');
    expect(request.request.params.get('active')).toBe('false');
    expect(request.request.params.get('search')).toBe('Perú & más');
    expect(request.request.params.has('omit')).toBe(false);
    request.flush({ data: ['real'] });
    expect(result).toEqual(['real']);
  });
  it('keeps mutation bodies and propagates HTTP errors to feature services', () => {
    let status = 0;
    TestBed.inject(ApiClient)
      .post('/items', { name: 'Item' })
      .subscribe({ error: (error) => (status = error.status) });
    const request = TestBed.inject(HttpTestingController).expectOne(
      'https://api.example.test/api/items',
    );
    expect(request.request.body).toEqual({ name: 'Item' });
    request.flush({ message: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });
    expect(status).toBe(403);
  });
  it('accepts empty delete responses', () => {
    let completed = false;
    TestBed.inject(ApiClient)
      .delete<void>('/items/1')
      .subscribe(() => (completed = true));
    TestBed.inject(HttpTestingController)
      .expectOne('https://api.example.test/api/items/1')
      .flush(null, { status: 204, statusText: 'No Content' });
    expect(completed).toBe(true);
  });
});
