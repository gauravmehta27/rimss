import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import type { ApiError } from '../models/api.model';
import { NotificationService } from '../services/notification.service';

const FRIENDLY: Record<number, string> = {
  0: 'We could not reach the RIMMS services. Check that the mock API is running.',
  400: 'That request was not valid. Please review the highlighted fields.',
  404: 'We could not find what you were looking for.',
  409: 'Someone else changed this record. Refresh and try again.',
  500: 'Something went wrong on our side. Please try again shortly.',
};

/** Normalises every transport failure into a single `ApiError` shape. */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notifications = inject(NotificationService);

  return next(req).pipe(
    catchError((response: HttpErrorResponse) => {
      const apiError: ApiError = {
        code: response.error?.code ?? `HTTP_${response.status}`,
        message: response.error?.message ?? FRIENDLY[response.status] ?? 'Unexpected error.',
        correlationId: response.headers?.get('X-Correlation-Id') ?? undefined,
        status: response.status,
      };

      if (response.status !== 404) {
        notifications.error('Request failed', apiError.message);
      }
      return throwError(() => apiError);
    }),
  );
};
