import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../../environments/environment';
import { APP_CONFIG } from '../config/app-config';
import type { Paged } from '../models/api.model';
import type { ProductQuery, ProductSummary } from '../models/product.model';
import { ProductService, buildProductParams } from './product.service';

describe('buildProductParams (query translation)', () => {
  it('always sends page, pageSize and sort so the API contract is stable', () => {
    const params = buildProductParams({}, 12);

    expect(params.get('page')).toBe('1');
    expect(params.get('pageSize')).toBe('12');
    expect(params.get('sort')).toBe('relevance');
  });

  it('omits empty facets instead of sending blank values', () => {
    const params = buildProductParams({ search: '   ', categoryIds: [], colors: [] }, 12);

    expect(params.has('search')).toBe(false);
    expect(params.has('categoryIds')).toBe(false);
    expect(params.has('colors')).toBe(false);
  });

  it('serialises multi-select facets as comma separated values', () => {
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

    const params = buildProductParams(query, 12);

    expect(params.get('search')).toBe('cable knit');
    expect(params.get('categoryIds')).toBe('sweaters,shirts');
    expect(params.get('sizes')).toBe('M,L');
    expect(params.get('minPrice')).toBe('100');
    expect(params.get('maxPrice')).toBe('400');
    expect(params.get('onSale')).toBe('true');
    expect(params.has('inStock')).toBe(false);
    expect(params.get('sort')).toBe('priceAsc');
    expect(params.get('page')).toBe('3');
    expect(params.get('pageSize')).toBe('24');
  });

  it('clamps a non-positive page number to the first page', () => {
    expect(buildProductParams({ page: -4 }, 12).get('page')).toBe('1');
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

  it('issues a GET against the configured catalogue endpoint', () => {
    const expected: Paged<ProductSummary> = {
      items: [],
      page: 1,
      pageSize: 12,
      totalCount: 0,
      totalPages: 1,
    };
    let received: Paged<ProductSummary> | undefined;

    service
      .search({ search: 'moleskin', sort: 'newest' })
      .subscribe((result) => (received = result));

    const request = httpMock.expectOne(
      (req) =>
        req.url === `${environment.apiBaseUrl}/products` && req.params.get('search') === 'moleskin',
    );
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('sort')).toBe('newest');

    request.flush(expected);
    expect(received).toEqual(expected);
  });

  it('URL-encodes the product identifier on detail lookups', () => {
    service.byId('p 0001/x').subscribe();

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/products/p%200001%2Fx`);
    expect(request.request.method).toBe('GET');
    request.flush({});
  });
});
