import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { RatingStarsComponent } from './rating-stars.component';

describe('RatingStarsComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [RatingStarsComponent] });
  });

  function render(value: number, reviewCount: number | null = null) {
    const fixture = TestBed.createComponent(RatingStarsComponent);
    fixture.componentRef.setInput('value', value);
    fixture.componentRef.setInput('reviewCount', reviewCount);
    fixture.detectChanges();
    return fixture;
  }

  it('renders full stars for a whole rating', () => {
    const fixture = render(4);
    const icons: HTMLElement[] = fixture.nativeElement.querySelectorAll('i');
    expect([...icons].filter((icon) => icon.classList.contains('bi-star-fill'))).toHaveLength(4);
    expect([...icons].filter((icon) => icon.classList.contains('bi-star'))).toHaveLength(1);
  });

  it('rounds to the nearest half star', () => {
    const fixture = render(3.25);
    const icons: HTMLElement[] = fixture.nativeElement.querySelectorAll('i');
    expect([...icons].filter((icon) => icon.classList.contains('bi-star-fill'))).toHaveLength(3);
    expect([...icons].filter((icon) => icon.classList.contains('bi-star-half'))).toHaveLength(1);
  });

  it('exposes the rating in an accessible label', () => {
    const fixture = render(4.5);
    const span: HTMLElement = fixture.nativeElement.querySelector('.rating');
    expect(span.getAttribute('aria-label')).toBe('4.5 out of 5 stars');
  });

  it('shows the review count only when provided', () => {
    expect(render(4).nativeElement.querySelector('small')).toBeNull();
    expect(render(4, 12).nativeElement.querySelector('small')?.textContent).toContain('12');
  });
});
