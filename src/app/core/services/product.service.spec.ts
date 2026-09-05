import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../../environments/environment';
import { APP_CONFIG } from '../config/app-config';
import type { ProductQuery } from '../models/product.model';
import { ProductService, buildProductVariables } from './product.service';

describe('buildProductVariables (query translation)', () => {
  it('always sends page, pageSize and sort so the API contract is stable', () => {
    const variables = buildProductVariables({}, 12);

    expect(variables.page).toBe(1);
    expect(variables.pageSize).toBe(12);
    expect(variables.sort).toBe('relevance');
  });

  it('omits empty facets instead of sending blank values', () => {
    const { filter } = buildProductVariables({ search: '   ', categoryIds: [], colors: [] }, 12);

    expect(filter).toEqual({});
  });

  it('maps multi-select facets onto the filter input', () => {
    const query: ProductQuery = {
      search: '  cable knit ',
      categoryIds: ['sweaters', 'shirts'],
      colors: ['forest'],
      sizes: ['M', 'L'],
      minPrice: 100,
      maxPrice: 400,
      onSale: true,
      inStock: false,
      sort: 'priceAsc',
      page: 3,
      pageSize: 24,
    };

    const variables = buildProductVariables(query, 12);

    expect(variables.filter).toEqual({
      search: 'cable knit',
      categoryIds: ['sweaters', 'shirts'],
      colors: ['forest'],
      sizes: ['M', 'L'],
      minPrice: 100,
      maxPrice: 400,
      onSale: true,
    });
    expect(variables.sort).toBe('priceAsc');
    expect(variables.page).toBe(3);
    expect(variables.pageSize).toBe(24);
  });

  it('clamps a non-positive page number to the first page', () => {
    expect(buildProductVariables({ page: -4 }, 12).page).toBe(1);
  });
});

describe('ProductService', () => {
  let service: ProductService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: environment },
      ],
    });
    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('resolves results and facets with a single CatalogPage operation', () => {
    const products = { items: [], page: 1, pageSize: 12, totalCount: 0, totalPages: 1 };
    let received: unknown;

    service.catalogPage({ search: 'moleskin', sort: 'newest' }).subscribe((page) => {
      received = page;
    });

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/products`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body.operationName).toBe('CatalogPage');
    expect(request.request.body.variables.filter.search).toBe('moleskin');
    expect(request.request.body.variables.sort).toBe('newest');

    request.flush({ data: { products, productFacets: null } });
    expect(received).toEqual({ products, productFacets: null });
  });

  it('unwraps the requested field from the data payload', () => {
    let received: unknown;
    service.byId('p-0001').subscribe((product) => (received = product));

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/products`);
    expect(request.request.body.variables).toEqual({ id: 'p-0001' });

    request.flush({ data: { product: { id: 'p-0001' } } });
    expect(received).toEqual({ id: 'p-0001' });
  });

  it('surfaces a GraphQL error returned inside a 200 response', () => {
    let failure: unknown;
    service.byId('nope').subscribe({ error: (error) => (failure = error) });

    httpMock.expectOne(`${environment.apiBaseUrl}/products`).flush({
      data: { product: null },
      errors: [{ message: 'Product does not exist.', extensions: { code: 'PRODUCT_NOT_FOUND' } }],
    });

    expect(failure).toEqual({ code: 'PRODUCT_NOT_FOUND', message: 'Product does not exist.' });
  });
});
