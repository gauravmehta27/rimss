import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';
import type { ItemsEnvelope } from '../models/api.model';
import type { CartLine, Order } from '../models/cart.model';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(APP_CONFIG).apiBaseUrl}/orders`;

  list(): Observable<ItemsEnvelope<Order>> {
    return this.http.get<ItemsEnvelope<Order>>(this.baseUrl);
  }

  place(lines: readonly CartLine[]): Observable<Order> {
    return this.http.post<Order>(this.baseUrl, {
      lines: lines.map(({ sku, name, price, quantity }) => ({ sku, name, price, quantity })),
    });
  }
}
