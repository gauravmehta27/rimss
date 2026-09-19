import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { LoadingService } from '../../core/services/loading.service';
import { LoadingBarComponent } from './loading-bar.component';

describe('LoadingBarComponent', () => {
  it('is hidden while idle', () => {
    TestBed.configureTestingModule({ imports: [LoadingBarComponent] });
    const fixture = TestBed.createComponent(LoadingBarComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.loading-bar')).toBeNull();
  });

  it('shows once a request starts and hides once it settles', () => {
    TestBed.configureTestingModule({ imports: [LoadingBarComponent] });
    const fixture = TestBed.createComponent(LoadingBarComponent);
    const loading = TestBed.inject(LoadingService);

    loading.start();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.loading-bar')).not.toBeNull();

    loading.stop();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.loading-bar')).toBeNull();
  });
});
