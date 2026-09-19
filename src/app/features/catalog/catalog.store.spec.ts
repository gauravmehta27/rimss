import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../../environments/environment';
import { APP_CONFIG } from '../../core/config/app-config';
import { CatalogStore } from './catalog.store';

describe('CatalogStore', () => {
  let store: CatalogStore;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: environment },
        CatalogStore,
      ],
    });
    store = TestBed.inject(CatalogStore);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('issues exactly one request per load and starts busy', () => {
    expect(store.loading()).toBe(true);
    expect(store.items()).toEqual([]);

    store.load({ search: 'jumper', page: 1 });
    TestBed.inject(ApplicationRef).tick();
    const request = httpMock.expectOne(`${environment.apiBaseUrl}/products`);

    const products = {
      items: [{ id: 'p-1' }],
      page: 1,
      pageSize: 12,
      totalCount: 1,
      totalPages: 1,
    };
    request.flush({ data: { products, productFacets: null } });

    expect(store.loading()).toBe(false);
    expect(store.items()).toEqual(products.items);
    expect(store.totalCount()).toBe(1);
    expect(store.hasResults()).toBe(true);
  });

  it('captures the failure and clears the busy flag on error', () => {
    store.load({ page: 1 });
    TestBed.inject(ApplicationRef).tick();
    httpMock
      .expectOne(`${environment.apiBaseUrl}/products`)
      .flush({ errors: [{ message: 'boom', extensions: { code: 'CATALOG_ERROR' } }] });

    expect(store.loading()).toBe(false);
    expect(store.error()).toEqual({ code: 'CATALOG_ERROR', message: 'boom' });
    expect(store.hasResults()).toBe(false);
  });

  it('derives the active filter count from the current query', () => {
    store.load({ page: 1, colors: ['navy'], onSale: true });
    TestBed.inject(ApplicationRef).tick();
    httpMock.expectOne(`${environment.apiBaseUrl}/products`).flush({
      data: {
        products: { items: [], page: 1, pageSize: 12, totalCount: 0, totalPages: 0 },
        productFacets: null,
      },
    });

    expect(store.filterCount()).toBe(2);
  });
});
