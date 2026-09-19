import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { CardSkeletonComponent } from './card-skeleton.component';

describe('CardSkeletonComponent', () => {
  it('renders the default number of placeholder cards', () => {
    TestBed.configureTestingModule({ imports: [CardSkeletonComponent] });
    const fixture = TestBed.createComponent(CardSkeletonComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.card')).toHaveLength(8);
  });

  it('renders the requested number of placeholder cards', () => {
    TestBed.configureTestingModule({ imports: [CardSkeletonComponent] });
    const fixture = TestBed.createComponent(CardSkeletonComponent);
    fixture.componentRef.setInput('count', 3);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.card')).toHaveLength(3);
    expect(fixture.nativeElement.querySelectorAll('[aria-hidden="true"]')).toHaveLength(3);
  });
});
