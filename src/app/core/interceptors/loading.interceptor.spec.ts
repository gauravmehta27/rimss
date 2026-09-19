import { HttpRequest, HttpResponse } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { loadingInterceptor, SILENT_REQUEST } from './loading.interceptor';
import { LoadingService } from '../services/loading.service';
import { HttpContext } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';

describe('loadingInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let loading: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([loadingInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    loading = TestBed.inject(LoadingService);
  });

  afterEach(() => httpMock.verify());

  it('toggles the loading indicator around the request lifecycle', () => {
    http.get('/api/ping').subscribe();
    expect(loading.isLoading()).toBe(true);

    httpMock.expectOne('/api/ping').flush({});
    expect(loading.isLoading()).toBe(false);
  });

  it('skips the indicator for requests marked silent', () => {
    http.get('/api/ping', { context: new HttpContext().set(SILENT_REQUEST, true) }).subscribe();

    expect(loading.isLoading()).toBe(false);
    httpMock.expectOne('/api/ping').flush({});
  });
});
