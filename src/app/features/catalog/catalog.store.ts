import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { catchError, filter, of, switchMap, tap } from 'rxjs';
import { APP_CONFIG } from '../../core/config/app-config';
import type { ApiError, Paged } from '../../core/models/api.model';
import type { ProductFacets, ProductQuery, ProductSummary } from '../../core/models/product.model';
import { LoggerService } from '../../core/services/logger.service';
import { ProductService } from '../../core/services/product.service';
import { activeFilterCount } from './catalog-query';

/**
 * Presentation-layer state for the search screen.
 *
 * Provided by the catalog route (not root), so its lifetime matches the module
 * and the feature stays self-contained — a requirement for pluggability.
 */
@Injectable()
export class CatalogStore {
  private readonly products = inject(ProductService);
  private readonly logger = inject(LoggerService).forContext('CatalogStore');
  private readonly config = inject(APP_CONFIG);

  // `null` until the route reports the first query, so exactly one request is
  // issued per navigation instead of a throwaway default fetch on construction.
  private readonly currentQuery = signal<ProductQuery | null>(null);
  private readonly page = signal<Paged<ProductSummary> | null>(null);
  private readonly facetData = signal<ProductFacets | null>(null);
  private readonly busy = signal(true);
  private readonly failure = signal<ApiError | null>(null);

  readonly query = computed<ProductQuery>(
    () => this.currentQuery() ?? { page: 1, pageSize: this.config.pageSize },
  );
  readonly result = this.page.asReadonly();
  readonly facets = this.facetData.asReadonly();
  readonly loading = this.busy.asReadonly();
  readonly error = this.failure.asReadonly();

  readonly items = computed(() => this.page()?.items ?? []);
  readonly totalCount = computed(() => this.page()?.totalCount ?? 0);
  readonly totalPages = computed(() => this.page()?.totalPages ?? 0);
  readonly hasResults = computed(() => this.items().length > 0);
  readonly filterCount = computed(() => activeFilterCount(this.query()));

  constructor() {
    toObservable(this.currentQuery)
      .pipe(
        filter((query): query is ProductQuery => query !== null),
        tap(() => this.busy.set(true)),
        // Results and facets arrive together, so the grid and the filter rail
        // can never render two different states of the same query.
        switchMap((query) =>
          this.products.catalogPage(query).pipe(
            catchError((error: ApiError) => {
              this.logger.error('catalogue load failed', error);
              this.failure.set(error);
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((response) => {
        this.busy.set(false);
        if (!response) return;
        this.failure.set(null);
        this.page.set(response.products);
        this.facetData.set(response.productFacets);
      });
  }

  load(query: ProductQuery): void {
    this.currentQuery.set({ ...query, pageSize: query.pageSize ?? this.config.pageSize });
  }
}
