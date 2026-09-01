import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';
import type { Paged } from '../models/api.model';
import type { InventoryQuery, InventoryRow, InventorySummary } from '../models/inventory.model';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);
  private readonly baseUrl = `${this.config.apiBaseUrl}/inventory`;

  list(query: InventoryQuery): Observable<Paged<InventoryRow>> {
    let params = new HttpParams()
      .set('page', String(Math.max(1, query.page ?? 1)))
      .set('pageSize', String(query.pageSize ?? 10))
      .set('status', query.status ?? 'all');

    const term = query.search?.trim();
    if (term) params = params.set('search', term);

    return this.http.get<Paged<InventoryRow>>(this.baseUrl, { params });
  }

  summary(): Observable<InventorySummary> {
    return this.http.get<InventorySummary>(`${this.baseUrl}/summary`);
  }

  adjust(sku: string, delta: number): Observable<InventoryRow> {
    return this.http.patch<InventoryRow>(`${this.baseUrl}/${encodeURIComponent(sku)}`, { delta });
  }

  setQuantity(sku: string, quantity: number): Observable<InventoryRow> {
    return this.http.patch<InventoryRow>(`${this.baseUrl}/${encodeURIComponent(sku)}`, {
      quantity,
    });
  }
}
