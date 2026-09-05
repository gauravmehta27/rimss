import { Injectable, inject } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { GraphQlClient } from '../graphql/graphql.client';
import { ORDERS_QUERY, PLACE_ORDER_MUTATION } from '../graphql/operations';
import type { CartLine, Order } from '../models/cart.model';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly graphql = inject(GraphQlClient);

  list(): Observable<Order[]> {
    return this.graphql.query<{ orders: Order[] }>(ORDERS_QUERY).pipe(map((data) => data.orders));
  }

  place(lines: readonly CartLine[]): Observable<Order> {
    return this.graphql
      .mutate<{ placeOrder: Order }>(PLACE_ORDER_MUTATION, {
        lines: lines.map(({ sku, name, price, quantity }) => ({ sku, name, price, quantity })),
      })
      .pipe(map((data) => data.placeOrder));
  }
}
