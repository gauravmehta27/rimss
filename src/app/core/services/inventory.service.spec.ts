import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../../environments/environment';
import { APP_CONFIG } from '../config/app-config';
import { InventoryService } from './inventory.service';

describe('InventoryService', () => {
  let service: InventoryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: environment },
      ],
    });
    service = TestBed.inject(InventoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('normalises the query before sending it to the API', () => {
    service.list({ search: '  boot  ', page: -1 }).subscribe();

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/products`);
    expect(request.request.body.variables).toEqual({
      search: 'boot',
      status: 'all',
      page: 1,
      pageSize: 10,
    });
    request.flush({
      data: { inventory: { items: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 0 } },
    });
  });

  it('unwraps the summary payload', () => {
    let received: unknown;
    service.summary().subscribe((summary) => (received = summary));

    httpMock
      .expectOne(`${environment.apiBaseUrl}/products`)
      .flush({ data: { inventorySummary: { skuCount: 4 } } });

    expect(received).toEqual({ skuCount: 4 });
  });

  it('sends a stock delta on adjust', () => {
    service.adjust('SKU-1', -2).subscribe();

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/products`);
    expect(request.request.body.variables).toEqual({ sku: 'SKU-1', delta: -2 });
    request.flush({ data: { adjustStock: { sku: 'SKU-1', quantity: 3 } } });
  });

  it('sends an absolute quantity on setQuantity', () => {
    service.setQuantity('SKU-1', 20).subscribe();

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/products`);
    expect(request.request.body.variables).toEqual({ sku: 'SKU-1', quantity: 20 });
    request.flush({ data: { setStockQuantity: { sku: 'SKU-1', quantity: 20 } } });
  });
});
