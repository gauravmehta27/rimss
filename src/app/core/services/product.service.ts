import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';
import { CACHE_TTL } from '../interceptors/cache.interceptor';
import type { ItemsEnvelope, Paged } from '../models/api.model';
import type {
  Offer,
  ProductDetail,
  ProductFacets,
  ProductQuery,
  ProductSummary,
  Suggestion,
} from '../models/product.model';

/**
 * Pure query → transport mapping. Extracted from the service so it can be unit
 * tested without an HTTP stack, and reused by any future transport (GraphQL,
 * BFF, worker) without change.
 */
export function buildProductParams(query: ProductQuery, defaultPageSize: number): HttpParams {
  let params = new HttpParams()
    .set('page', String(Math.max(1, query.page ?? 1)))
    .set('pageSize', String(query.pageSize ?? defaultPageSize))
    .set('sort', query.sort ?? 'relevance');

  const term = query.search?.trim();
  if (term) params = params.set('search', term);
  if (query.categoryIds?.length) params = params.set('categoryIds', query.categoryIds.join(','));
  if (query.colors?.length) params = params.set('colors', query.colors.join(','));
  if (query.sizes?.length) params = params.set('sizes', query.sizes.join(','));
  if (query.audiences?.length) params = params.set('audiences', query.audiences.join(','));
  if (query.minPrice != null) params = params.set('minPrice', String(query.minPrice));
  if (query.maxPrice != null) params = params.set('maxPrice', String(query.maxPrice));
  if (query.minRating != null) params = params.set('minRating', String(query.minRating));
  if (query.onSale) params = params.set('onSale', 'true');
  if (query.inStock) params = params.set('inStock', 'true');

  return params;
}

/** Data-access boundary for the catalogue. Components never call HttpClient. */
@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);
  private readonly baseUrl = `${this.config.apiBaseUrl}/products`;

  search(query: ProductQuery): Observable<Paged<ProductSummary>> {
    return this.http.get<Paged<ProductSummary>>(this.baseUrl, {
      params: buildProductParams(query, this.config.pageSize),
    });
  }

  featured(limit = 8): Observable<ItemsEnvelope<ProductSummary>> {
    return this.http.get<ItemsEnvelope<ProductSummary>>(`${this.baseUrl}/featured`, {
      params: new HttpParams().set('limit', String(limit)),
      context: new HttpContext().set(CACHE_TTL, 60_000),
    });
  }

  facets(query: ProductQuery = {}): Observable<ProductFacets> {
    return this.http.get<ProductFacets>(`${this.baseUrl}/facets`, {
      params: buildProductParams(query, this.config.pageSize),
      context: new HttpContext().set(CACHE_TTL, 30_000),
    });
  }

  suggestions(term: string): Observable<ItemsEnvelope<Suggestion>> {
    return this.http.get<ItemsEnvelope<Suggestion>>(`${this.baseUrl}/suggestions`, {
      params: new HttpParams().set('q', term),
    });
  }

  byId(id: string): Observable<ProductDetail> {
    return this.http.get<ProductDetail>(`${this.baseUrl}/${encodeURIComponent(id)}`);
  }

  offers(): Observable<ItemsEnvelope<Offer>> {
    return this.http.get<ItemsEnvelope<Offer>>(`${this.config.apiBaseUrl}/offers`, {
      context: new HttpContext().set(CACHE_TTL, 120_000),
    });
  }
}
