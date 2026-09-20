import { Injectable, computed, effect, inject, signal } from '@angular/core';
import type { CartLine, CartTotals } from '../models/cart.model';
import { LoggerService } from './logger.service';

// v2: baskets stored before the switch to INR hold dollar prices, so they are dropped.
export const CART_STORAGE_KEY = 'rimss.cart.v2';
export const FREE_SHIPPING_THRESHOLD = 20000;
export const SHIPPING_FEE = 249;
export const TAX_RATE = 0.08;
export const BULK_DISCOUNT_THRESHOLD = 6;
export const BULK_DISCOUNT_RATE = 0.1;
export const MAX_LINE_QUANTITY = 10;

const round = (value: number) => Math.round(value * 100) / 100;

/**
 * Pricing rules for the basket, kept as a pure function so the business
 * behaviour is verifiable without Angular, DOM or storage.
 *
 * - orders of {@link BULK_DISCOUNT_THRESHOLD}+ units earn a bulk discount
 * - shipping is free once the discounted subtotal clears the threshold
 * - tax applies to the discounted subtotal only
 */
export function calculateTotals(lines: readonly CartLine[]): CartTotals {
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const subTotal = round(lines.reduce((sum, line) => sum + line.price * line.quantity, 0));

  if (itemCount === 0) {
    return { itemCount: 0, subTotal: 0, discount: 0, shipping: 0, tax: 0, grandTotal: 0 };
  }

  const discount = itemCount >= BULK_DISCOUNT_THRESHOLD ? round(subTotal * BULK_DISCOUNT_RATE) : 0;
  const netTotal = round(subTotal - discount);
  const shipping = netTotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const tax = round(netTotal * TAX_RATE);

  return {
    itemCount,
    subTotal,
    discount,
    shipping,
    tax,
    grandTotal: round(netTotal + shipping + tax),
  };
}

/** Merges a line into the basket, clamping quantity to the per-line ceiling. */
export function mergeLine(lines: readonly CartLine[], incoming: CartLine): CartLine[] {
  const quantity = Math.max(1, Math.trunc(incoming.quantity));
  const existing = lines.find((line) => line.sku === incoming.sku);

  if (!existing) {
    return [...lines, { ...incoming, quantity: Math.min(quantity, MAX_LINE_QUANTITY) }];
  }
  return lines.map((line) =>
    line.sku === incoming.sku
      ? { ...line, quantity: Math.min(line.quantity + quantity, MAX_LINE_QUANTITY) }
      : line,
  );
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly logger = inject(LoggerService).forContext('Cart');
  private readonly items = signal<CartLine[]>(readStoredLines());

  readonly lines = this.items.asReadonly();
  readonly totals = computed(() => calculateTotals(this.items()));
  readonly itemCount = computed(() => this.totals().itemCount);
  readonly isEmpty = computed(() => this.items().length === 0);

  constructor() {
    effect(() => persist(this.items()));
  }

  add(line: CartLine): void {
    this.items.update((lines) => mergeLine(lines, line));
    this.logger.debug(`added ${line.sku}`);
  }

  setQuantity(sku: string, quantity: number): void {
    const next = Math.trunc(quantity);
    if (next <= 0) {
      this.remove(sku);
      return;
    }
    this.items.update((lines) =>
      lines.map((line) =>
        line.sku === sku ? { ...line, quantity: Math.min(next, MAX_LINE_QUANTITY) } : line,
      ),
    );
  }

  remove(sku: string): void {
    this.items.update((lines) => lines.filter((line) => line.sku !== sku));
  }

  clear(): void {
    this.items.set([]);
  }
}

function readStoredLines(): CartLine[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as CartLine[]) : [];
  } catch {
    return [];
  }
}

function persist(lines: readonly CartLine[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
  } catch {
    /* storage full or blocked - the basket simply becomes session-only */
  }
}
