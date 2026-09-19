import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { environment } from '../../../environments/environment';
import { APP_CONFIG } from '../../core/config/app-config';
import { HeaderComponent } from './header.component';

const settle = (ms = 50) => new Promise((resolve) => setTimeout(resolve, ms));

describe('HeaderComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'catalog', children: [] }]),
        { provide: APP_CONFIG, useValue: { ...environment, searchDebounceMs: 0 } },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('does not query suggestions for a short term', async () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();

    (fixture.componentInstance as any).term.set('a');
    await settle();

    httpMock.expectNone(`${environment.apiBaseUrl}/products`);
  });

  it('fetches and renders suggestions once the term is long enough', async () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();

    (fixture.componentInstance as any).term.set('jumper');
    (fixture.componentInstance as any).showSuggestions.set(true);
    await settle();

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/products`);
    request.flush({
      data: { productSuggestions: [{ id: 'p-1', name: 'Jumper', categoryName: 'Sweaters' }] },
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Jumper');
  });

  it('navigates to the catalog with the search term on submit', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    (fixture.componentInstance as any).term.set('moleskin');
    (fixture.componentInstance as any).submit();

    expect(navigateSpy).toHaveBeenCalledWith(['/catalog'], {
      queryParams: { search: 'moleskin', page: 1 },
    });
  });
});
