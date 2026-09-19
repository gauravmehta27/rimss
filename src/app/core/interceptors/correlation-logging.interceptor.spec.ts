import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../../environments/environment';
import { APP_CONFIG } from '../config/app-config';
import { correlationLoggingInterceptor } from './correlation-logging.interceptor';

describe('correlationLoggingInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([correlationLoggingInterceptor])),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: environment },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('stamps every outbound request with a correlation id header', () => {
    http.get('/api/products').subscribe();

    const request = httpMock.expectOne('/api/products');
    expect(request.request.headers.has('X-Correlation-Id')).toBe(true);
    request.flush({});
  });

  it('lets a failing request propagate its error after logging', () => {
    let failure: unknown;
    http.get('/api/products').subscribe({ error: (error) => (failure = error) });

    httpMock.expectOne('/api/products').flush(null, { status: 500, statusText: 'Server Error' });

    expect(failure).toBeTruthy();
  });
});
