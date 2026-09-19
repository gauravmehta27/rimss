import { TestBed } from '@angular/core/testing';
import type { Route } from '@angular/router';
import { EMPTY, of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { IdlePreloadStrategy } from './idle-preload.strategy';

describe('IdlePreloadStrategy', () => {
  function route(preload: boolean): Route {
    return { path: 'catalog', data: { preload } };
  }

  it('never preloads a route that has not opted in', () => {
    const strategy = TestBed.inject(IdlePreloadStrategy);
    const load = vi.fn(() => of('loaded'));
    let result: unknown = 'not-called';

    strategy.preload(route(false), load).subscribe((value) => (result = value));

    expect(load).not.toHaveBeenCalled();
    expect(result).toBe('not-called');
  });

  it('loads an opted-in route once the browser reports idle', () => {
    const originalRequestIdleCallback = window.requestIdleCallback;
    window.requestIdleCallback = ((callback: IdleRequestCallback) => {
      callback({ didTimeout: false, timeRemaining: () => 50 } as IdleDeadline);
      return 1;
    }) as typeof window.requestIdleCallback;

    const strategy = TestBed.inject(IdlePreloadStrategy);
    const load = vi.fn(() => of('loaded'));
    let result: unknown;

    strategy.preload(route(true), load).subscribe((value) => (result = value));

    expect(load).toHaveBeenCalledOnce();
    expect(result).toBe('loaded');
    window.requestIdleCallback = originalRequestIdleCallback;
  });

  it('returns EMPTY (not the load observable) for a route without the preload flag', () => {
    const strategy = TestBed.inject(IdlePreloadStrategy);
    expect(strategy.preload({ path: 'home' }, () => EMPTY)).toBe(EMPTY);
  });
});
