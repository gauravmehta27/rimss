import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { catchError, debounceTime, distinctUntilChanged, of, switchMap, tap } from 'rxjs';
import type { Paged } from '../../core/models/api.model';
import type {
  InventoryQuery,
  InventoryRow,
  InventorySummary,
  StockStatus,
} from '../../core/models/inventory.model';
import { InventoryService } from '../../core/services/inventory.service';
import { NotificationService } from '../../core/services/notification.service';
import { SeoService } from '../../core/services/seo.service';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { PaginationComponent } from '../../shared/components/pagination.component';

const STATUS_FILTERS: readonly { value: StockStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All SKUs' },
  { value: 'low', label: 'Low stock' },
  { value: 'out-of-stock', label: 'Out of stock' },
  { value: 'healthy', label: 'Healthy' },
];

/**
 * Sample operational task: stock control desk.
 *
 * Demonstrates the full n-tier round trip — component → service → HTTP layer →
 * API — including optimistic-free write-back and derived KPI state.
 */
@Component({
  selector: 'app-inventory',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    CurrencyPipe,
    DecimalPipe,
    DatePipe,
    PaginationComponent,
    EmptyStateComponent,
  ],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss',
})
export class InventoryComponent {
  private readonly inventory = inject(InventoryService);
  private readonly notifications = inject(NotificationService);
  private readonly seo = inject(SeoService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly statusFilters = STATUS_FILTERS;
  protected readonly searchTerm = signal('');
  protected readonly status = signal<StockStatus | 'all'>('all');
  protected readonly page = signal(1);
  protected readonly busySku = signal<string | null>(null);
  protected readonly loading = signal(true);

  protected readonly result = signal<Paged<InventoryRow> | null>(null);
  protected readonly summary = signal<InventorySummary | null>(null);

  protected readonly rows = computed(() => this.result()?.items ?? []);
  protected readonly totalPages = computed(() => this.result()?.totalPages ?? 0);
  protected readonly healthPercent = computed(() => {
    const data = this.summary();
    if (!data || data.skuCount === 0) return 0;
    return Math.round(((data.skuCount - data.lowStock - data.outOfStock) / data.skuCount) * 100);
  });

  private readonly query = computed<InventoryQuery>(() => ({
    search: this.searchTerm(),
    status: this.status(),
    page: this.page(),
    pageSize: 10,
  }));

  constructor() {
    this.seo.apply({
      title: 'Stock control',
      description:
        'Monitor SKU level stock, low-stock alerts and inventory value across the YCompany range.',
      canonicalPath: '/inventory',
    });

    toObservable(this.query)
      .pipe(
        debounceTime(250),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        tap(() => this.loading.set(true)),
        switchMap((query) => this.inventory.list(query).pipe(catchError(() => of(null)))),
        takeUntilDestroyed(),
      )
      .subscribe((page) => {
        this.loading.set(false);
        if (page) this.result.set(page);
      });

    this.refreshSummary();
  }

  protected setStatus(status: StockStatus | 'all'): void {
    this.status.set(status);
    this.page.set(1);
  }

  protected onSearch(term: string): void {
    this.searchTerm.set(term);
    this.page.set(1);
  }

  protected adjust(row: InventoryRow, delta: number): void {
    if (row.quantity + delta < 0) return;
    this.busySku.set(row.sku);

    this.inventory
      .adjust(row.sku, delta)
      .pipe(catchError(() => of(null)))
      .subscribe((updated) => {
        this.busySku.set(null);
        if (!updated) return;
        this.result.update((page) =>
          page
            ? {
                ...page,
                items: page.items.map((item) => (item.sku === updated.sku ? updated : item)),
              }
            : page,
        );
        this.notifications.success('Stock updated', `${updated.sku} → ${updated.quantity} units`);
        this.refreshSummary();
      });
  }

  protected trackBySku(_index: number, row: InventoryRow): string {
    return row.sku;
  }

  private refreshSummary(): void {
    this.inventory
      .summary()
      .pipe(
        catchError(() => of(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((summary) => summary && this.summary.set(summary));
  }
}
