import { HttpContextToken, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { of, tap } from 'rxjs';
import { HttpResponse } from '@angular/common/http';
import { LoggerService } from '../services/logger.service';

/** TTL (ms) for a cacheable GET; `0` disables caching for that call. */
export const CACHE_TTL = new HttpContextToken<number>(() => 0);

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
  if (req.method !== 'GET' || ttl <= 0) return next(req);

  const logger = inject(LoggerService).forContext('HttpCache');
  const key = req.urlWithParams;
  const hit = cache.get(key);

  if (hit && hit.expiresAt > Date.now()) {
    logger.debug(`cache hit ${key}`);
    return of(hit.response.clone());
  }

  return next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse) {
        cache.set(key, { expiresAt: Date.now() + ttl, response: event.clone() });
      }
    }),
  );
};

export function clearHttpCache(): void {
  cache.clear();
}
