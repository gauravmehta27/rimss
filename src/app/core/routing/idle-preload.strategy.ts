import { Injectable } from '@angular/core';
import type { PreloadingStrategy, Route } from '@angular/router';
import { EMPTY, Observable, timer } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

const IDLE_TIMEOUT_MS = 2500;

/**
 * Warms lazy routes only once the browser is idle.
 *
 * Routes opt into preloading explicitly. Feature bundles stay lazy by default:
 * downloading every screen after the first paint still competes with the home
 * route's data and images, especially on mobile connections.
 */
@Injectable({ providedIn: 'root' })
export class IdlePreloadStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    if (route.data?.['preload'] !== true) return EMPTY;
    return whenIdle().pipe(mergeMap(() => load()));
  }
}

function whenIdle(): Observable<unknown> {
  const idle = typeof window !== 'undefined' ? window.requestIdleCallback : undefined;
  if (!idle) return timer(IDLE_TIMEOUT_MS);

  return new Observable<void>((subscriber) => {
    const handle = idle(
      () => {
        subscriber.next();
        subscriber.complete();
      },
      { timeout: IDLE_TIMEOUT_MS },
    );
    return () => window.cancelIdleCallback?.(handle);
  });
}
