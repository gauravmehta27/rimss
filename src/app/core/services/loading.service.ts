import { Injectable, computed, signal } from '@angular/core';

/**
 * Tracks in-flight HTTP work so the shell can render a progress indicator
 * within the 100ms interaction budget required by the NFRs.
 */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly pending = signal(0);

  readonly isLoading = computed(() => this.pending() > 0);
  readonly pendingCount = this.pending.asReadonly();

  start(): void {
    this.pending.update((count) => count + 1);
  }

  stop(): void {
    this.pending.update((count) => Math.max(0, count - 1));
  }
}
