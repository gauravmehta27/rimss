import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { PaginationComponent, pageWindow } from './pagination.component';

describe('pageWindow', () => {
  it('returns an empty window when there is nothing to paginate', () => {
    expect(pageWindow(1, 0)).toEqual([]);
  });

  it('returns a single page when there is only one', () => {
    expect(pageWindow(1, 1)).toEqual([1]);
  });

  it('inserts gaps around a page window in the middle of a long list', () => {
    expect(pageWindow(10, 20)).toEqual([1, 'gap', 8, 9, 10, 11, 12, 'gap', 20]);
  });

  it('has no leading gap when the current page is near the start', () => {
    expect(pageWindow(1, 10)).toEqual([1, 2, 3, 'gap', 10]);
  });
});

describe('PaginationComponent', () => {
  function render(page: number, totalPages: number) {
    TestBed.configureTestingModule({ imports: [PaginationComponent] });
    const fixture = TestBed.createComponent(PaginationComponent);
    fixture.componentRef.setInput('page', page);
    fixture.componentRef.setInput('totalPages', totalPages);
    fixture.detectChanges();
    return fixture;
  }

  it('renders nothing when there is only one page', () => {
    const fixture = render(1, 1);
    expect(fixture.nativeElement.querySelector('nav')).toBeNull();
  });

  it('emits the target page when a page button is clicked', () => {
    const fixture = render(1, 5);
    const changed = vi.fn();
    fixture.componentInstance.pageChange.subscribe(changed);

    const buttons: HTMLButtonElement[] = fixture.nativeElement.querySelectorAll('.page-link');
    const pageTwo = [...buttons].find((button) => button.textContent?.trim() === '2')!;
    pageTwo.click();

    expect(changed).toHaveBeenCalledWith(2);
  });

  it('does not emit for the previous button on the first page', () => {
    const fixture = render(1, 5);
    const changed = vi.fn();
    fixture.componentInstance.pageChange.subscribe(changed);

    fixture.nativeElement.querySelector('[aria-label="Previous page"]').click();

    expect(changed).not.toHaveBeenCalled();
  });
});
