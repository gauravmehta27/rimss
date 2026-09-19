import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { NotificationService } from '../../core/services/notification.service';
import { ToastHostComponent } from './toast-host.component';

describe('ToastHostComponent', () => {
  it('renders a toast per notification and forwards dismissal', () => {
    const dismiss = vi.fn();
    TestBed.configureTestingModule({
      imports: [ToastHostComponent],
      providers: [
        {
          provide: NotificationService,
          useValue: {
            toasts: () => [{ id: 1, level: 'success', title: 'Added to bag', message: 'Jumper' }],
            dismiss,
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(ToastHostComponent);
    fixture.detectChanges();

    const toast: HTMLElement = fixture.nativeElement.querySelector('.toast');
    expect(toast.className).toContain('text-bg-success');
    expect(toast.textContent).toContain('Added to bag');
    expect(toast.textContent).toContain('Jumper');

    fixture.nativeElement.querySelector('.btn-close').click();
    expect(dismiss).toHaveBeenCalledWith(1);
  });
});
