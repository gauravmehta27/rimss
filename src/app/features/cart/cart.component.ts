import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import type { CartLine } from '../../core/models/cart.model';
import {
  BULK_DISCOUNT_THRESHOLD,
  CartService,
  FREE_SHIPPING_THRESHOLD,
} from '../../core/services/cart.service';
import { NotificationService } from '../../core/services/notification.service';
import { OrderService } from '../../core/services/order.service';
import { SeoService } from '../../core/services/seo.service';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { productImage } from '../../shared/utils/product-artwork';

@Component({
  selector: 'app-cart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, RouterLink, EmptyStateComponent],
  templateUrl: './cart.component.html',
})
export class CartComponent {
  private readonly orders = inject(OrderService);
  private readonly notifications = inject(NotificationService);
  private readonly seo = inject(SeoService);

  protected readonly cart = inject(CartService);
  protected readonly placing = signal(false);
  protected readonly freeShippingThreshold = FREE_SHIPPING_THRESHOLD;
  protected readonly bulkThreshold = BULK_DISCOUNT_THRESHOLD;

  protected readonly amountToFreeShipping = computed(() =>
    Math.max(
      0,
      FREE_SHIPPING_THRESHOLD - (this.cart.totals().subTotal - this.cart.totals().discount),
    ),
  );

  constructor() {
    this.seo.apply({
      title: 'Your bag',
      description: 'Review the pieces in your YCompany bag and check out securely.',
      canonicalPath: '/cart',
    });
  }

  protected photo(line: CartLine): string {
    return productImage(line.imageSeed, line.categoryId, 176, 132);
  }

  protected checkout(): void {
    if (this.cart.isEmpty()) return;
    this.placing.set(true);

    this.orders
      .place(this.cart.lines())
      .pipe(catchError(() => of(null)))
      .subscribe((order) => {
        this.placing.set(false);
        if (!order) return;
        this.notifications.success(
          'Order confirmed',
          `${order.id} · ${order.lines.length} line(s)`,
        );
        this.cart.clear();
      });
  }
}
