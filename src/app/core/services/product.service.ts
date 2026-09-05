import { Injectable, inject } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';
import { GraphQlClient } from '../graphql/graphql.client';
import {
  CATALOG_PAGE_QUERY,
  FEATURED_PRODUCTS_QUERY,
  OFFERS_QUERY,
  PRODUCT_DETAIL_QUERY,
  PRODUCT_SUGGESTIONS_QUERY,
} from '../graphql/operations';
import type { Paged } from '../models/api.model';
import type {
  Offer,
  ProductDetail,
  ProductFacets,
  ProductQuery,
  ProductSummary,
  Suggestion,
} from '../models/product.model';

/** Mirrors `ProductFilterInput` in the schema; empty facets are simply absent. */
export type ProductFilterInput = {
  search?: string;
  categoryIds?: string[];
  colors?: string[];
  sizes?: string[];
  audiences?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  onSale?: boolean;
  inStock?: boolean;
};

export type ProductQueryVariables = {
  filter: ProductFilterInput;
  sort: string;
  page: number;
  pageSize: number;
};

export interface CatalogPage {
  products: Paged<ProductSummary>;
  productFacets: ProductFacets;
}

/**
 * Pure query → variables mapping. Extracted from the service so it can be unit
 * tested without a transport, and so the URL contract and the GraphQL contract
 * are translated in exactly one place.
 */
export function buildProductVariables(
  query: ProductQuery,
  defaultPageSize: number,
): ProductQueryVariables {
  const filter: ProductFilterInput = {};

  const term = query.search?.trim();
  if (term) filter.search = term;
  if (query.categoryIds?.length) filter.categoryIds = [...query.categoryIds];
  if (query.colors?.length) filter.colors = [...query.colors];
  if (query.sizes?.length) filter.sizes = [...query.sizes];
  if (query.audiences?.length) filter.audiences = [...query.audiences];
  if (query.minPrice != null) filter.minPrice = query.minPrice;
  if (query.maxPrice != null) filter.maxPrice = query.maxPrice;
  if (query.minRating != null) filter.minRating = query.minRating;
  if (query.onSale) filter.onSale = true;
  if (query.inStock) filter.inStock = true;

  return {
    filter,
    sort: query.sort ?? 'relevance',
    page: Math.max(1, query.page ?? 1),
    pageSize: query.pageSize ?? defaultPageSize,
  };
}

/** Data-access boundary for the catalogue. Components never call the transport. */
@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly graphql = inject(GraphQlClient);
  private readonly config = inject(APP_CONFIG);

  /** Results and facet counts for the search screen, resolved in one request. */
  catalogPage(query: ProductQuery): Observable<CatalogPage> {
    return this.graphql.query<CatalogPage>(
      CATALOG_PAGE_QUERY,
      buildProductVariables(query, this.config.pageSize),
    );
  }

  featured(limit = 8): Observable<ProductSummary[]> {
    return this.graphql
      .query<{ featuredProducts: ProductSummary[] }>(
        FEATURED_PRODUCTS_QUERY,
        { limit },
        { cacheTtlMs: 60_000 },
      )
      .pipe(map((data) => data.featuredProducts));
  }

  suggestions(term: string): Observable<Suggestion[]> {
    return this.graphql
      .query<{ productSuggestions: Suggestion[] }>(PRODUCT_SUGGESTIONS_QUERY, { term })
      .pipe(map((data) => data.productSuggestions));
  }

  byId(id: string): Observable<ProductDetail> {
    return this.graphql
      .query<{ product: ProductDetail }>(PRODUCT_DETAIL_QUERY, { id })
      .pipe(map((data) => data.product));
  }

  offers(): Observable<Offer[]> {
    return this.graphql
      .query<{ offers: Offer[] }>(OFFERS_QUERY, {}, { cacheTtlMs: 120_000 })
      .pipe(map((data) => data.offers));
  }
}
