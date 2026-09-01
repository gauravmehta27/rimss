import { HttpEventType, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { tap } from 'rxjs';
import { LoggerService } from '../services/logger.service';

/**
 * Stamps every outbound call with a correlation id and records round-trip time,
 * giving the "enough logging to debug any error condition" design requirement a
 * single, consistent implementation.
 */
export const correlationLoggingInterceptor: HttpInterceptorFn = (req, next) => {
  const logger = inject(LoggerService).forContext('Http');
  const correlationId = crypto.randomUUID();
  const startedAt = performance.now();

  const tracked = req.clone({ setHeaders: { 'X-Correlation-Id': correlationId } });
  logger.debug(`→ ${req.method} ${req.urlWithParams}`, { correlationId });

  return next(tracked).pipe(
    tap({
      next: (event) => {
        if (event.type !== HttpEventType.Response) return;
        const elapsed = Math.round(performance.now() - startedAt);
        logger.debug(`← ${event.status} ${req.method} ${req.urlWithParams} (${elapsed}ms)`, {
          correlationId,
        });
      },
      error: (error: unknown) => {
        const elapsed = Math.round(performance.now() - startedAt);
        logger.error(`✖ ${req.method} ${req.urlWithParams} failed after ${elapsed}ms`, {
          correlationId,
          error,
        });
      },
    }),
  );
};
