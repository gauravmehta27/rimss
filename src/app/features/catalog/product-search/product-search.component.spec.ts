import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { environment } from '../../../../environments/environment';
import { APP_CONFIG } from '../../../core/config/app-config';
import { CatalogStore } from '../catalog.store';
import { ProductSearchComponent } from './product-search.component';

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('ProductSearchComponent', () => {
  let httpMock: HttpTestingController;
  let queryParams$: BehaviorSubject<Record<string, string>>;

  beforeEach(() => {
    queryParams$ = new BehaviorSubject<Record<string, string>>({});
    TestBed.configureTestingModule({
      imports: [ProductSearchComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: APP_CONFIG, useValue: environment },
        { provide: ActivatedRoute, useValue: { queryParams: queryParams$ } },
        CatalogStore,
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('loads the catalogue for the query parsed from the URL', async () => {
    const fixture = TestBed.createComponent(ProductSearchComponent);
    fixture.detectChanges();
    await settle();
    TestBed.inject(ApplicationRef).tick();

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/products`);
    request.flush({
      data: {
        products: { items: [], page: 1, pageSize: 12, totalCount: 0, totalPages: 0 },
        productFacets: null,
      },
    });
    fixture.detectChanges();

    expect((fixture.componentInstance as any).store.loading()).toBe(false);
  });

  it('navigates with merged query params when a filter is toggled', async () => {
    const fixture = TestBed.createComponent(ProductSearchComponent);
    fixture.detectChanges();
    await settle();
    TestBed.inject(ApplicationRef).tick();
    httpMock.expectOne(`${environment.apiBaseUrl}/products`).flush({
      data: {
        products: { items: [], page: 1, pageSize: 12, totalCount: 0, totalPages: 0 },
        productFacets: null,
      },
    });

    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    (fixture.componentInstance as any).toggle('colors', 'navy');

    expect(navigateSpy).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ queryParamsHandling: 'merge' }),
    );
  });

  it('shows a back-in-stock notice instead of adding an out-of-stock item', async () => {
    const fixture = TestBed.createComponent(ProductSearchComponent);
    fixture.detectChanges();
    await settle();
    TestBed.inject(ApplicationRef).tick();
    httpMock.expectOne(`${environment.apiBaseUrl}/products`).flush({
      data: {
        products: { items: [], page: 1, pageSize: 12, totalCount: 0, totalPages: 0 },
        productFacets: null,
      },
    });

    const component = fixture.componentInstance as any;
    component.addToCart({
      id: 'p-1',
      name: 'Sold out jumper',
      inStock: false,
      sizes: ['M'],
      colors: ['navy'],
      price: 10,
      imageSeed: 1,
      categoryId: 'sweaters',
    });

    expect(component.cart.lines()).toHaveLength(0);
  });
});
