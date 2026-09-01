import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';
import { APP_CONFIG } from '../../../core/config/app-config';
import type { ProductQuery, ProductSort, ProductSummary } from '../../../core/models/product.model';
import { CartService } from '../../../core/services/cart.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SeoService } from '../../../core/services/seo.service';
import { CardSkeletonComponent } from '../../../shared/components/card-skeleton.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state.component';
import { PaginationComponent } from '../../../shared/components/pagination.component';
import { ProductCardComponent } from '../../../shared/components/product-card.component';
import { parseProductQuery, toQueryParams, toggleFacet } from '../catalog-query';
import { CatalogStore } from '../catalog.store';

const SORT_OPTIONS: readonly { value: ProductSort; label: string }[] = [
  { value: 'relevance', label: 'Most relevant' },
  { value: 'newest', label: 'Newest arrivals' },
  { value: 'priceAsc', label: 'Price: low to high' },
  { value: 'priceDesc', label: 'Price: high to low' },
  { value: 'rating', label: 'Top rated' },
  { value: 'discount', label: 'Biggest saving' },
];

@Component({
  selector: 'app-product-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ProductCardComponent,
    PaginationComponent,
    CardSkeletonComponent,
    EmptyStateComponent,
  ],
  templateUrl: './product-search.component.html',
  styleUrl: './product-search.component.scss',
})
export class ProductSearchComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cart = inject(CartService);
  private readonly notifications = inject(NotificationService);
  private readonly seo = inject(SeoService);
  private readonly config = inject(APP_CONFIG);

  protected readonly store = inject(CatalogStore);
  protected readonly sortOptions = SORT_OPTIONS;
  protected readonly searchTerm = signal('');
  protected readonly filtersOpen = signal(false);

  constructor() {
    this.route.queryParams
      .pipe(
        map((params) => parseProductQuery(params, this.config.pageSize)),
        debounceTime(0),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        takeUntilDestroyed(),
      )
      .subscribe((query) => {
        this.searchTerm.set(query.search ?? '');
        this.store.load(query);
        this.applySeo(query);
      });
  }

  protected patch(changes: Partial<ProductQuery>, resetPage = true): void {
    const next: ProductQuery = { ...this.store.query(), ...changes };
    if (resetPage) next.page = 1;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: toQueryParams(next),
      queryParamsHandling: 'merge',
    });
  }

  protected submitSearch(): void {
    this.patch({ search: this.searchTerm() });
  }

  protected toggle(facet: 'categoryIds' | 'colors' | 'sizes' | 'audiences', value: string): void {
    this.patch({ [facet]: toggleFacet(this.store.query()[facet], value) } as Partial<ProductQuery>);
  }

  protected isSelected(
    facet: 'categoryIds' | 'colors' | 'sizes' | 'audiences',
    value: string,
  ): boolean {
    return (this.store.query()[facet] ?? []).includes(value);
  }

  protected clearFilters(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { search: this.store.query().search || null },
    });
  }

  protected goToPage(page: number): void {
    this.patch({ page }, false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected addToCart(product: ProductSummary): void {
    if (!product.inStock) {
      this.notifications.info(
        'Back-in-stock alert set',
        `We will email you when ${product.name} returns.`,
      );
      return;
    }
    this.cart.add({
      productId: product.id,
      sku: `${product.id}-${product.sizes[0]}-${product.colors[0]}`,
      name: product.name,
      size: product.sizes[0],
      color: product.colors[0],
      price: product.price,
      quantity: 1,
      imageSeed: product.imageSeed,
      categoryId: product.categoryId,
    });
    this.notifications.success('Added to bag', product.name);
  }

  private applySeo(query: ProductQuery): void {
    const term = query.search?.trim();
    this.seo.apply({
      title: term ? `Search results for “${term}”` : 'Shop the collection',
      description: term
        ? `Browse YCompany luxury pieces matching “${term}” — sweaters, moleskin, corduroy and tattersall shirts.`
        : 'Browse the full YCompany collection of luxury sweaters, moleskin, corduroy, tattersall shirts, shoes and accessories.',
      keywords: [
        'luxury fashion',
        'sweaters',
        'moleskin',
        'corduroy',
        'tattersall shirts',
        term ?? '',
      ].filter(Boolean),
      canonicalPath: '/catalog',
    });
  }
}
