import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';
import type { ApiError } from '../../../core/models/api.model';
import type { ProductDetail, ProductSummary } from '../../../core/models/product.model';
import { CartService } from '../../../core/services/cart.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ProductService } from '../../../core/services/product.service';
import { SeoService } from '../../../core/services/seo.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state.component';
import { ProductCardComponent } from '../../../shared/components/product-card.component';
import { RatingStarsComponent } from '../../../shared/components/rating-stars.component';
import { productArtwork, productImage } from '../../../shared/utils/product-artwork';

@Component({
  selector: 'app-product-showcase',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CurrencyPipe,
    DatePipe,
    RouterLink,
    RatingStarsComponent,
    ProductCardComponent,
    EmptyStateComponent,
  ],
  templateUrl: './product-showcase.component.html',
  styleUrl: './product-showcase.component.scss',
})
export class ProductShowcaseComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly products = inject(ProductService);
  private readonly cart = inject(CartService);
  private readonly notifications = inject(NotificationService);
  private readonly seo = inject(SeoService);

  protected readonly product = signal<ProductDetail | null>(null);
  protected readonly error = signal<ApiError | null>(null);
  protected readonly loading = signal(true);
  protected readonly selectedColor = signal<string | null>(null);
  protected readonly selectedSize = signal<string | null>(null);
  protected readonly quantity = signal(1);

  protected readonly artwork = computed(() => {
    const product = this.product();
    return product ? productArtwork(product.imageSeed, product.name, product.categoryName) : '';
  });

  protected readonly photo = computed(() => {
    const product = this.product();
    return product ? productImage(product.imageSeed, product.categoryId, 800, 600) : '';
  });

  /** Stock for the currently chosen colour/size combination. */
  protected readonly selectedVariant = computed(() => {
    const product = this.product();
    if (!product) return null;
    return (
      product.variants.find(
        (variant) =>
          variant.colorId === this.selectedColor() && variant.size === this.selectedSize(),
      ) ?? null
    );
  });

  protected readonly canAdd = computed(() => (this.selectedVariant()?.quantity ?? 0) > 0);

  constructor() {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          this.loading.set(true);
          return this.products.byId(params.get('id') ?? '').pipe(
            catchError((error: ApiError) => {
              this.error.set(error);
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((product) => {
        this.loading.set(false);
        this.product.set(product);
        if (!product) return;
        this.error.set(null);
        this.selectedColor.set(product.colors[0] ?? null);
        this.selectedSize.set(product.sizes[0] ?? null);
        this.quantity.set(1);
        this.publishSeo(product);
      });
  }

  protected changeQuantity(delta: number): void {
    const max = Math.min(10, this.selectedVariant()?.quantity ?? 10);
    this.quantity.update((value) => Math.min(Math.max(1, value + delta), Math.max(1, max)));
  }

  protected addToBag(): void {
    const product = this.product();
    const variant = this.selectedVariant();
    if (!product || !variant) return;

    this.cart.add({
      productId: product.id,
      sku: variant.sku,
      name: product.name,
      size: variant.size,
      color: variant.colorId,
      price: product.price,
      quantity: this.quantity(),
      imageSeed: product.imageSeed,
      categoryId: product.categoryId,
    });
    this.notifications.success('Added to bag', `${product.name} · ${variant.size}`);
  }

  protected addRelatedToBag(related: ProductSummary): void {
    this.cart.add({
      productId: related.id,
      sku: `${related.id}-${related.sizes[0]}-${related.colors[0]}`,
      name: related.name,
      size: related.sizes[0],
      color: related.colors[0],
      price: related.price,
      quantity: 1,
      imageSeed: related.imageSeed,
      categoryId: related.categoryId,
    });
    this.notifications.success('Added to bag', related.name);
  }

  private publishSeo(product: ProductDetail): void {
    this.seo.apply({
      title: product.name,
      description: product.shortDescription,
      keywords: [product.name, product.categoryName, product.material, product.brand],
      type: 'product',
      canonicalPath: `/catalog/${product.id}`,
    });
    this.seo.setStructuredData('product', {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      brand: { '@type': 'Brand', name: product.brand },
      category: product.categoryName,
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        reviewCount: product.reviewCount,
      },
      offers: {
        '@type': 'Offer',
        price: product.price,
        priceCurrency: product.currency,
        availability: product.inStock
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      },
    });
  }
}
