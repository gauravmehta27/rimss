import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NotificationService } from '../services/notification.service';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let errorSpy: (title: string, message?: string) => void;
  const calls: unknown[][] = [];

  beforeEach(() => {
    calls.length = 0;
    errorSpy = (...args: unknown[]) => {
      calls.push(args);
    };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: NotificationService, useValue: { error: errorSpy } },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('normalises a server error into an ApiError and notifies the user', () => {
    let failure: unknown;
    http.get('/api/products').subscribe({ error: (error) => (failure = error) });

    httpMock
      .expectOne('/api/products')
      .flush(
        { code: 'PRODUCT_INVALID', message: 'Bad input' },
        { status: 400, statusText: 'Bad Request' },
      );

    expect(failure).toEqual({
      code: 'PRODUCT_INVALID',
      message: 'Bad input',
      correlationId: undefined,
      status: 400,
    });
    expect(calls).toHaveLength(1);
  });

  it('falls back to a friendly message when the server sends none', () => {
    let failure: { message: string } | undefined;
    http.get('/api/products').subscribe({ error: (error) => (failure = error) });

    httpMock.expectOne('/api/products').flush(null, { status: 500, statusText: 'Server Error' });

    expect(failure?.message).toBe('Something went wrong on our side. Please try again shortly.');
  });

  it('does not notify for a 404, since screens render that state themselves', () => {
    http.get('/api/products/missing').subscribe({ error: () => {} });
    httpMock
      .expectOne('/api/products/missing')
      .flush(null, { status: 404, statusText: 'Not Found' });

    expect(calls).toHaveLength(0);
  });
});
