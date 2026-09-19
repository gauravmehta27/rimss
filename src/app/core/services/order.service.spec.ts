import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../../environments/environment';
import { APP_CONFIG } from '../config/app-config';
import type { CartLine } from '../models/cart.model';
import { OrderService } from './order.service';

function line(overrides: Partial<CartLine> = {}): CartLine {
  return {
    productId: 'p-1',
    sku: 'SWE-1-NAV-M',
    name: 'Cable Knit Jumper',
    size: 'M',
    color: 'navy',
    price: 100,
    quantity: 2,
    imageSeed: 1,
    ...overrides,
  };
}

describe('OrderService', () => {
  let service: OrderService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: environment },
      ],
    });
    service = TestBed.inject(OrderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('lists orders unwrapped from the data payload', () => {
    let received: unknown;
    service.list().subscribe((orders) => (received = orders));

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/products`);
    expect(request.request.body.operationName).toBe('Orders');
    request.flush({ data: { orders: [{ id: 'o-1' }] } });

    expect(received).toEqual([{ id: 'o-1' }]);
  });

  it('places an order with only the fields the API needs', () => {
    let received: unknown;
    service.place([line()]).subscribe((order) => (received = order));

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/products`);
    expect(request.request.body.variables.lines).toEqual([
      { sku: 'SWE-1-NAV-M', name: 'Cable Knit Jumper', price: 100, quantity: 2 },
    ]);

    request.flush({ data: { placeOrder: { id: 'o-2' } } });
    expect(received).toEqual({ id: 'o-2' });
  });
});
