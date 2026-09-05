import { Injectable, inject } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { GraphQlClient } from '../graphql/graphql.client';
import {
  ADJUST_STOCK_MUTATION,
  INVENTORY_PAGE_QUERY,
  INVENTORY_SUMMARY_QUERY,
  SET_STOCK_QUANTITY_MUTATION,
} from '../graphql/operations';
import type { Paged } from '../models/api.model';
import type { InventoryQuery, InventoryRow, InventorySummary } from '../models/inventory.model';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly graphql = inject(GraphQlClient);

  list(query: InventoryQuery): Observable<Paged<InventoryRow>> {
    return this.graphql
      .query<{ inventory: Paged<InventoryRow> }>(INVENTORY_PAGE_QUERY, {
        search: query.search?.trim() || null,
        status: query.status ?? 'all',
        page: Math.max(1, query.page ?? 1),
        pageSize: query.pageSize ?? 10,
      })
      .pipe(map((data) => data.inventory));
  }

  summary(): Observable<InventorySummary> {
    return this.graphql
      .query<{ inventorySummary: InventorySummary }>(INVENTORY_SUMMARY_QUERY)
      .pipe(map((data) => data.inventorySummary));
  }

  adjust(sku: string, delta: number): Observable<InventoryRow> {
    return this.graphql
      .mutate<{ adjustStock: InventoryRow }>(ADJUST_STOCK_MUTATION, { sku, delta })
      .pipe(map((data) => data.adjustStock));
  }

  setQuantity(sku: string, quantity: number): Observable<InventoryRow> {
    return this.graphql
      .mutate<{ setStockQuantity: InventoryRow }>(SET_STOCK_QUANTITY_MUTATION, { sku, quantity })
      .pipe(map((data) => data.setStockQuantity));
  }
}
