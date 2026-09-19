import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { environment } from '../../../environments/environment';
import { APP_CONFIG } from '../config/app-config';
import { NotificationService } from '../services/notification.service';
import { GraphQlClient } from './graphql.client';

describe('GraphQlClient', () => {
  let client: GraphQlClient;
  let httpMock: HttpTestingController;
  const notifyError = vi.fn();

  beforeEach(() => {
    notifyError.mockClear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: environment },
        { provide: NotificationService, useValue: { error: notifyError } },
      ],
    });
    client = TestBed.inject(GraphQlClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('posts the document, variables and derived operation name', () => {
    client
      .query('query Featured($limit: Int) { featuredProducts(limit: $limit) { id } }', {
        limit: 4,
      })
      .subscribe();

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/products`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body.operationName).toBe('Featured');
    expect(request.request.body.variables).toEqual({ limit: 4 });
    request.flush({ data: { featuredProducts: [] } });
  });

  it('unwraps the data payload for the caller', () => {
    let received: unknown;
    client.query<{ offers: unknown[] }>('query Offers { offers { id } }').subscribe((data) => {
      received = data;
    });

    httpMock.expectOne(`${environment.apiBaseUrl}/products`).flush({ data: { offers: [] } });
    expect(received).toEqual({ offers: [] });
  });

  it('throws a normalised ApiError and notifies on a GraphQL error', () => {
    let failure: unknown;
    client
      .query('query Product { product { id } }')
      .subscribe({ error: (error) => (failure = error) });

    httpMock.expectOne(`${environment.apiBaseUrl}/products`).flush({
      errors: [{ message: 'Product does not exist.', extensions: { code: 'PRODUCT_NOT_FOUND' } }],
    });

    expect(failure).toEqual({ code: 'PRODUCT_NOT_FOUND', message: 'Product does not exist.' });
    expect(notifyError).not.toHaveBeenCalled();
  });

  it('notifies for a GraphQL error that is not a not-found', () => {
    client.query('query Product { product { id } }').subscribe({ error: () => {} });

    httpMock.expectOne(`${environment.apiBaseUrl}/products`).flush({
      errors: [{ message: 'Server exploded.' }],
    });

    expect(notifyError).toHaveBeenCalledWith('Request failed', 'Server exploded.');
  });

  it('treats a null data payload as an empty-response error', () => {
    let failure: unknown;
    client
      .query('query Product { product { id } }')
      .subscribe({ error: (error) => (failure = error) });

    httpMock.expectOne(`${environment.apiBaseUrl}/products`).flush({ data: null });

    expect(failure).toEqual({
      code: 'GRAPHQL_EMPTY_RESPONSE',
      message: 'The server returned no data.',
    });
    expect(notifyError).toHaveBeenCalled();
  });

  it('mutate delegates to query with the same document contract', () => {
    client
      .mutate(
        'mutation PlaceOrder($lines: [OrderLineInput!]!) { placeOrder(lines: $lines) { id } }',
        {
          lines: [],
        },
      )
      .subscribe();

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/products`);
    expect(request.request.body.operationName).toBe('PlaceOrder');
    request.flush({ data: { placeOrder: { id: 'o-1' } } });
  });
});
