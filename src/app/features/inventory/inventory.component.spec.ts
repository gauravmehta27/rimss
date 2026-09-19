import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../../environments/environment';
import { APP_CONFIG } from '../../core/config/app-config';
import { InventoryComponent } from './inventory.component';

const settle = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

describe('InventoryComponent', () => {
  let httpMock: HttpTestingController;

  function flushAll(
    rows: unknown[] = [],
    summary: Record<string, unknown> = { skuCount: 1, lowStock: 0, outOfStock: 0 },
  ) {
    httpMock.match(`${environment.apiBaseUrl}/products`).forEach((request) => {
      const isSummary = request.request.body.operationName === 'InventorySummary';
      request.flush({
        data: isSummary
          ? { inventorySummary: summary }
          : {
              inventory: {
                items: rows,
                page: 1,
                pageSize: 10,
                totalCount: rows.length,
                totalPages: 1,
              },
            },
      });
    });
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [InventoryComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: APP_CONFIG, useValue: environment },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('loads the summary and the first page of stock rows', async () => {
    const fixture = TestBed.createComponent(InventoryComponent);
    fixture.detectChanges();
    TestBed.inject(ApplicationRef).tick();
    await settle();
    flushAll([{ sku: 'SKU-1', productName: 'Jumper', quantity: 5, status: 'healthy' }]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Jumper');
  });

  it('adjusts stock and refreshes the summary on success', async () => {
    const fixture = TestBed.createComponent(InventoryComponent);
    fixture.detectChanges();
    TestBed.inject(ApplicationRef).tick();
    await settle();
    flushAll([{ sku: 'SKU-1', productName: 'Jumper', quantity: 5, status: 'healthy' }]);
    fixture.detectChanges();

    (fixture.componentInstance as any).adjust({ sku: 'SKU-1', quantity: 5 }, 1);

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/products`);
    expect(request.request.body.variables).toEqual({ sku: 'SKU-1', delta: 1 });
    request.flush({ data: { adjustStock: { sku: 'SKU-1', quantity: 6, status: 'healthy' } } });

    httpMock.expectOne(`${environment.apiBaseUrl}/products`).flush({
      data: { inventorySummary: { skuCount: 1, lowStock: 0, outOfStock: 0 } },
    });

    expect((fixture.componentInstance as any).rows()[0].quantity).toBe(6);
  });

  it('does not adjust below zero quantity', async () => {
    const fixture = TestBed.createComponent(InventoryComponent);
    fixture.detectChanges();
    flushAll();
    fixture.detectChanges();

    (fixture.componentInstance as any).adjust({ sku: 'SKU-1', quantity: 0 }, -1);
    httpMock.expectNone(() => true);
  });
});
