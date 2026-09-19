import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { EmptyStateComponent } from './empty-state.component';

describe('EmptyStateComponent', () => {
  it('renders default copy when no inputs are provided', () => {
    TestBed.configureTestingModule({ imports: [EmptyStateComponent] });
    const fixture = TestBed.createComponent(EmptyStateComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h3').textContent).toBe('Nothing to show');
    expect(fixture.nativeElement.querySelector('i').className).toContain('bi-inbox');
  });

  it('renders custom copy passed through inputs', () => {
    TestBed.configureTestingModule({ imports: [EmptyStateComponent] });
    const fixture = TestBed.createComponent(EmptyStateComponent);
    fixture.componentRef.setInput('icon', 'bi-compass');
    fixture.componentRef.setInput('title', 'Page not found');
    fixture.componentRef.setInput('message', 'It moved.');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h3').textContent).toBe('Page not found');
    expect(fixture.nativeElement.querySelector('p').textContent).toBe('It moved.');
    expect(fixture.nativeElement.querySelector('i').className).toContain('bi-compass');
  });
});
