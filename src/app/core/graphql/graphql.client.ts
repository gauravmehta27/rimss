import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';
import { CACHE_KEY, CACHE_TTL } from '../interceptors/cache.interceptor';
import { SILENT_REQUEST } from '../interceptors/loading.interceptor';
import type { ApiError } from '../models/api.model';
import { NotificationService } from '../services/notification.service';

export interface GraphQlError {
  message: string;
  path?: (string | number)[];
  extensions?: { code?: string };
}

export interface GraphQlResponse<T> {
  data?: T | null;
  errors?: GraphQlError[];
}

export interface GraphQlOptions {
  /** Enables the in-memory response cache for idempotent reads. */
  cacheTtlMs?: number;
  /** Suppresses the global progress bar for background reads. */
  silent?: boolean;
}

const OPERATION_NAME = /\b(?:query|mutation)\s+(\w+)/;

/**
 * Single transport for the whole app: every read and write is one POST to
 * `/products`. Callers get a plain `Observable<T>` of the `data` payload, so the
 * feature layer never sees GraphQL envelopes.
 */
@Injectable({ providedIn: 'root' })
export class GraphQlClient {
  private readonly http = inject(HttpClient);
  private readonly notifications = inject(NotificationService);
  private readonly endpoint = `${inject(APP_CONFIG).apiBaseUrl}/products`;

  query<T>(
    document: string,
    variables: Record<string, unknown> = {},
    options: GraphQlOptions = {},
  ): Observable<T> {
    const operationName = OPERATION_NAME.exec(document)?.[1];

    let context = new HttpContext();
    if (options.cacheTtlMs) {
      context = context
        .set(CACHE_TTL, options.cacheTtlMs)
        .set(CACHE_KEY, `${operationName}(${JSON.stringify(variables)})`);
    }
    if (options.silent) context = context.set(SILENT_REQUEST, true);

    return this.http
      .post<GraphQlResponse<T>>(
        this.endpoint,
        { query: document, variables, operationName },
        { context },
      )
      .pipe(map((response) => this.unwrap(response)));
  }

  mutate<T>(document: string, variables: Record<string, unknown> = {}): Observable<T> {
    return this.query<T>(document, variables);
  }

  /**
   * GraphQL reports execution failures inside a 200 response, so errors are
   * normalised here into the same `ApiError` the HTTP interceptor produces.
   */
  private unwrap<T>(response: GraphQlResponse<T>): T {
    const [failure] = response.errors ?? [];

    if (failure) {
      const error: ApiError = {
        code: failure.extensions?.code ?? 'GRAPHQL_ERROR',
        message: failure.message,
      };
      // "Not found" is a legitimate outcome the screen renders itself.
      if (!error.code.endsWith('NOT_FOUND')) {
        this.notifications.error('Request failed', error.message);
      }
      throw error;
    }

    if (response.data == null) {
      const error: ApiError = {
        code: 'GRAPHQL_EMPTY_RESPONSE',
        message: 'The server returned no data.',
      };
      this.notifications.error('Request failed', error.message);
      throw error;
    }

    return response.data;
  }
}
