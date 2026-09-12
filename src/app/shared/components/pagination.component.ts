import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

/**
 * Builds a compact, fixed-width page window (`1 … 4 5 6 … 20`) so the control
 * never reflows as the result count changes.
 */
export function pageWindow(current: number, total: number, span = 2): (number | 'gap')[] {
  if (total <= 1) return total === 1 ? [1] : [];

  const pages = new Set<number>([1, total]);
  for (let page = current - span; page <= current + span; page++) {
    if (page >= 1 && page <= total) pages.add(page);
  }

  const ordered = [...pages].sort((a, b) => a - b);
  const result: (number | 'gap')[] = [];
  ordered.forEach((page, index) => {
    if (index > 0 && page - ordered[index - 1] > 1) result.push('gap');
    result.push(page);
  });
  return result;
}

@Component({
  selector: 'app-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss',
})
export class PaginationComponent {
  readonly page = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly pageChange = output<number>();

  protected readonly window = computed(() => pageWindow(this.page(), this.totalPages()));

  protected go(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.page()) return;
    this.pageChange.emit(page);
  }
}
