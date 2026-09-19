import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../../environments/environment';
import { APP_CONFIG } from '../config/app-config';
import { CACHE_KEY, CACHE_TTL, cacheInterceptor, clearHttpCache } from './cache.interceptor';

describe('cacheInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    clearHttpCache();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([cacheInterceptor])),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: environment },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('passes requests through untouched when no TTL is set', () => {
    http.get('/api/products').subscribe();
    httpMock.expectOne('/api/products').flush({});
  });

  it('caches a response for the given TTL and serves the second call from memory', () => {
    const context = new HttpContext().set(CACHE_TTL, 60_000).set(CACHE_KEY, 'Featured()');

    let first: unknown;
    let second: unknown;
    http.get('/api/products', { context }).subscribe((response) => (first = response));
    httpMock.expectOne('/api/products').flush({ data: { featuredProducts: [] } });

    http.get('/api/products', { context }).subscribe((response) => (second = response));
    httpMock.expectNone('/api/products');

    expect(first).toEqual(second);
  });

  it('never caches a response that carries GraphQL errors', () => {
    const context = new HttpContext().set(CACHE_TTL, 60_000).set(CACHE_KEY, 'Featured()');

    http.get('/api/products', { context }).subscribe();
    httpMock.expectOne('/api/products').flush({ errors: [{ message: 'boom' }] });

    http.get('/api/products', { context }).subscribe();
    httpMock.expectOne('/api/products').flush({ data: { featuredProducts: [] } });
  });
});
