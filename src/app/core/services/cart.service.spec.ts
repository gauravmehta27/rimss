import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import type { CartLine } from '../models/cart.model';
import {
  BULK_DISCOUNT_THRESHOLD,
  CART_STORAGE_KEY,
  CartService,
  FREE_SHIPPING_THRESHOLD,
  MAX_LINE_QUANTITY,
  SHIPPING_FEE,
  calculateTotals,
  mergeLine,
} from './cart.service';
import { APP_CONFIG } from '../config/app-config';
import { environment } from '../../../environments/environment';

function line(overrides: Partial<CartLine> = {}): CartLine {
  return {
    productId: 'p-0001',
    sku: 'SWE-0001-FOR-M',
    name: 'Ashcombe Cable Knit Jumper',
    size: 'M',
    color: 'forest',
    price: 9999,
    quantity: 1,
    imageSeed: 3,
    ...overrides,
  };
}

describe('calculateTotals (pricing rules)', () => {
  it('returns a zeroed total for an empty basket', () => {
    expect(calculateTotals([])).toEqual({
      itemCount: 0,
      subTotal: 0,
      discount: 0,
      shipping: 0,
      tax: 0,
      grandTotal: 0,
    });
  });

  it('charges shipping and tax below the free-shipping threshold', () => {
    const totals = calculateTotals([line({ price: 8000, quantity: 1 })]);

    expect(totals.subTotal).toBe(8000);
    expect(totals.discount).toBe(0);
    expect(totals.shipping).toBe(SHIPPING_FEE);
    expect(totals.tax).toBeCloseTo(640, 2);
    expect(totals.grandTotal).toBeCloseTo(8889, 2);
  });

  it('waives shipping once the net total clears the threshold', () => {
    const totals = calculateTotals([line({ price: FREE_SHIPPING_THRESHOLD, quantity: 1 })]);

    expect(totals.shipping).toBe(0);
    expect(totals.grandTotal).toBeCloseTo(FREE_SHIPPING_THRESHOLD * 1.08, 2);
  });

  it('applies the 10% bulk discount before shipping and tax are computed', () => {
    const totals = calculateTotals([line({ price: 5000, quantity: BULK_DISCOUNT_THRESHOLD })]);

    expect(totals.itemCount).toBe(BULK_DISCOUNT_THRESHOLD);
    expect(totals.subTotal).toBe(30000);
    expect(totals.discount).toBe(3000);
    expect(totals.shipping).toBe(0); // net 27,000 >= 20,000
    expect(totals.tax).toBeCloseTo(2160, 2);
    expect(totals.grandTotal).toBeCloseTo(29160, 2);
  });

  it('does not discount an order one unit short of the bulk threshold', () => {
    const totals = calculateTotals([line({ price: 5000, quantity: BULK_DISCOUNT_THRESHOLD - 1 })]);
    expect(totals.discount).toBe(0);
  });
});

describe('mergeLine', () => {
  it('appends a new SKU', () => {
    const result = mergeLine([line()], line({ sku: 'SWE-0002-NAV-L', quantity: 2 }));

    expect(result).toHaveLength(2);
    expect(result[1].quantity).toBe(2);
  });

  it('accumulates the quantity of an existing SKU without mutating the input', () => {
    const original = [line({ quantity: 2 })];
    const result = mergeLine(original, line({ quantity: 3 }));

    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(5);
    expect(original[0].quantity).toBe(2);
  });

  it('clamps a line to the maximum permitted quantity', () => {
    const result = mergeLine([line({ quantity: MAX_LINE_QUANTITY })], line({ quantity: 5 }));
    expect(result[0].quantity).toBe(MAX_LINE_QUANTITY);
  });
});

describe('CartService', () => {
  let service: CartService;

  beforeEach(() => {
    localStorage.removeItem(CART_STORAGE_KEY);
    TestBed.configureTestingModule({
      providers: [{ provide: APP_CONFIG, useValue: environment }],
    });
    service = TestBed.inject(CartService);
    service.clear();
  });

  it('starts empty', () => {
    expect(service.isEmpty()).toBe(true);
    expect(service.itemCount()).toBe(0);
  });

  it('exposes derived totals that react to basket changes', () => {
    service.add(line({ price: 120, quantity: 2 }));

    expect(service.itemCount()).toBe(2);
    expect(service.totals().subTotal).toBe(240);
    expect(service.totals().shipping).toBe(SHIPPING_FEE);
  });

  it('removes a line when its quantity drops to zero', () => {
    service.add(line());
    service.setQuantity(line().sku, 0);

    expect(service.isEmpty()).toBe(true);
  });

  it('never exceeds the per-line ceiling', () => {
    service.add(line({ quantity: 4 }));
    service.setQuantity(line().sku, 99);

    expect(service.lines()[0].quantity).toBe(MAX_LINE_QUANTITY);
  });
});
