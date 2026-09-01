import { Injectable, signal } from '@angular/core';

export type ToastLevel = 'success' | 'info' | 'warning' | 'danger';

export interface Toast {
  id: number;
  level: ToastLevel;
  title: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private nextId = 1;
  private readonly items = signal<Toast[]>([]);

  readonly toasts = this.items.asReadonly();

  success(title: string, message = ''): void {
    this.push('success', title, message);
  }

  info(title: string, message = ''): void {
    this.push('info', title, message);
  }

  warning(title: string, message = ''): void {
    this.push('warning', title, message);
  }

  error(title: string, message = ''): void {
    this.push('danger', title, message);
  }

  dismiss(id: number): void {
    this.items.update((list) => list.filter((toast) => toast.id !== id));
  }

  private push(level: ToastLevel, title: string, message: string): void {
    const toast: Toast = { id: this.nextId++, level, title, message };
    this.items.update((list) => [...list, toast].slice(-4));
    setTimeout(() => this.dismiss(toast.id), 5000);
  }
}
