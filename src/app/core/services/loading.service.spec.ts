import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { LoadingService } from './loading.service';

describe('LoadingService', () => {
  it('reports idle when there is no in-flight request', () => {
    const service = TestBed.inject(LoadingService);
    expect(service.isLoading()).toBe(false);
    expect(service.pendingCount()).toBe(0);
  });

  it('stays loading while concurrent requests are outstanding', () => {
    const service = TestBed.inject(LoadingService);
    service.start();
    service.start();
    expect(service.isLoading()).toBe(true);
    expect(service.pendingCount()).toBe(2);

    service.stop();
    expect(service.isLoading()).toBe(true);

    service.stop();
    expect(service.isLoading()).toBe(false);
  });

  it('never drops the counter below zero', () => {
    const service = TestBed.inject(LoadingService);
    service.stop();
    expect(service.pendingCount()).toBe(0);
  });
});
