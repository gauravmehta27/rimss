import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { NotFoundComponent } from './not-found.component';

describe('NotFoundComponent', () => {
  it('renders an empty-state pointing back to the storefront', () => {
    TestBed.configureTestingModule({
      imports: [NotFoundComponent],
      providers: [provideRouter([])],
    });
    const fixture = TestBed.createComponent(NotFoundComponent);
    fixture.detectChanges();

    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a');
    expect(fixture.nativeElement.querySelector('h3').textContent).toBe('Page not found');
    expect(link.textContent).toContain('Back to the storefront');
    expect(link.getAttribute('href')).toBe('/home');
  });
});
