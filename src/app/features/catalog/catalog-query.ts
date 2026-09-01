import type { Params } from '@angular/router';
import type { ProductQuery, ProductSort } from '../../core/models/product.model';

const SORTS: readonly ProductSort[] = [
  'relevance',
  'priceAsc',
  'priceDesc',
  'rating',
  'newest',
  'discount',
];

const list = (value: unknown): string[] =>
  typeof value === 'string' && value.length ? value.split(',').filter(Boolean) : [];

const num = (value: unknown): number | null => {
  const parsed = Number(value);
  return value === undefined || value === null || value === '' || Number.isNaN(parsed)
    ? null
    : parsed;
};

/**
 * The URL is the single source of truth for the search screen: every filter is
 * shareable, back/forward works, and crawlers can index facet combinations.
 * These two pure functions are the only place that contract is encoded.
 */
export function parseProductQuery(params: Params, pageSize: number): ProductQuery {
  const sort = params['sort'] as ProductSort;
  return {
    search: typeof params['search'] === 'string' ? params['search'] : '',
    categoryIds: list(params['categories']),
    colors: list(params['colors']),
    sizes: list(params['sizes']),
    audiences: list(params['audiences']),
    minPrice: num(params['minPrice']),
    maxPrice: num(params['maxPrice']),
    minRating: num(params['minRating']),
    onSale: params['onSale'] === 'true',
    inStock: params['inStock'] === 'true',
    sort: SORTS.includes(sort) ? sort : 'relevance',
    page: Math.max(1, num(params['page']) ?? 1),
    pageSize,
  };
}

/** Inverse of {@link parseProductQuery}; empty values are dropped from the URL. */
export function toQueryParams(query: ProductQuery): Params {
  return {
    search: query.search?.trim() || null,
    categories: query.categoryIds?.length ? query.categoryIds.join(',') : null,
    colors: query.colors?.length ? query.colors.join(',') : null,
    sizes: query.sizes?.length ? query.sizes.join(',') : null,
    audiences: query.audiences?.length ? query.audiences.join(',') : null,
    minPrice: query.minPrice ?? null,
    maxPrice: query.maxPrice ?? null,
    minRating: query.minRating ?? null,
    onSale: query.onSale ? 'true' : null,
    inStock: query.inStock ? 'true' : null,
    sort: query.sort && query.sort !== 'relevance' ? query.sort : null,
    page: query.page && query.page > 1 ? query.page : null,
  };
}

/** Toggles a value inside a facet selection without mutating the input. */
export function toggleFacet(selected: readonly string[] | undefined, value: string): string[] {
  const current = selected ?? [];
  return current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
}

export function activeFilterCount(query: ProductQuery): number {
  return (
    (query.categoryIds?.length ?? 0) +
    (query.colors?.length ?? 0) +
    (query.sizes?.length ?? 0) +
    (query.audiences?.length ?? 0) +
    (query.minPrice != null ? 1 : 0) +
    (query.maxPrice != null ? 1 : 0) +
    (query.minRating != null ? 1 : 0) +
    (query.onSale ? 1 : 0) +
    (query.inStock ? 1 : 0)
  );
}
