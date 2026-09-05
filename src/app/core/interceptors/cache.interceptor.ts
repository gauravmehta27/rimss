import { HttpContextToken, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { of, tap } from 'rxjs';
import { HttpResponse } from '@angular/common/http';
import { LoggerService } from '../services/logger.service';

/** TTL (ms) for a cacheable read; `0` disables caching for that call. */
export const CACHE_TTL = new HttpContextToken<number>(() => 0);

/**
 * Cache identity for calls that cannot be identified by URL. GraphQL reads are
 * all POSTs to the same endpoint, so the operation name and variables are used
 * instead.
 */
export const CACHE_KEY = new HttpContextToken<string>(() => '');

interface CacheEntry {
  expiresAt: number;
  response: HttpResponse<unknown>;
}

const cache = new Map<string, CacheEntry>();

/**
 * Short-lived in-memory cache for idempotent reads (facets, offers, featured
 * products). Repeat navigations render from memory, which keeps interaction
 * feedback inside the 100ms budget.
 */
export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  const ttl = req.context.get(CACHE_TTL);
  const explicitKey = req.context.get(CACHE_KEY);
  if (ttl <= 0 || (req.method !== 'GET' && !explicitKey)) return next(req);

  const logger = inject(LoggerService).forContext('HttpCache');
  const key = explicitKey || req.urlWithParams;
  const hit = cache.get(key);

  if (hit && hit.expiresAt > Date.now()) {
    logger.debug(`cache hit ${key}`);
    return of(hit.response.clone());
  }

  return next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse && !hasGraphQlErrors(event.body)) {
        cache.set(key, { expiresAt: Date.now() + ttl, response: event.clone() });
      }
    }),
  );
};

/** A GraphQL failure still arrives as a 200, and must never be cached. */
function hasGraphQlErrors(body: unknown): boolean {
  const errors = (body as { errors?: unknown[] } | null)?.errors;
  return Array.isArray(errors) && errors.length > 0;
}

export function clearHttpCache(): void {
  cache.clear();
}
