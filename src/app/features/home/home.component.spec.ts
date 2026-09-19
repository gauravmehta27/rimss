import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../../environments/environment';
import { APP_CONFIG } from '../../core/config/app-config';
import { CART_STORAGE_KEY } from '../../core/services/cart.service';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.removeItem(CART_STORAGE_KEY);
    TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: APP_CONFIG, useValue: environment },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('requests featured products and offers, then renders the fallback hero slide', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();

    const requests = httpMock.match(`${environment.apiBaseUrl}/products`);
    expect(requests).toHaveLength(2);
    requests.forEach((request) => {
      const isOffers = request.request.body.operationName === 'Offers';
      request.flush({ data: isOffers ? { offers: [] } : { featuredProducts: [] } });
    });
    fixture.detectChanges();

    expect((fixture.componentInstance as any).slides()).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('Heritage tailoring');
  });

  it('advances and jumps between hero slides', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    httpMock.match(`${environment.apiBaseUrl}/products`).forEach((request) => {
      const isOffers = request.request.body.operationName === 'Offers';
      request.flush({
        data: isOffers
          ? {
              offers: [
                {
                  id: 'o-1',
                  title: 'Winter sale',
                  subtitle: '20% off',
                  discountPercent: 20,
                  categoryId: 'sweaters',
                  code: 'WINTER20',
                  validTill: '2026-12-01',
                },
              ],
            }
          : { featuredProducts: [] },
      });
    });
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as {
      move: (delta: number) => void;
      goTo: (index: number) => void;
      current: () => number;
    };
    component.move(1);
    expect(component.current()).toBe(1);

    component.goTo(0);
    expect(component.current()).toBe(0);
  });

  it('adds a featured product to the bag', () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    httpMock.match(`${environment.apiBaseUrl}/products`).forEach((request) => {
      const isOffers = request.request.body.operationName === 'Offers';
      request.flush({
        data: isOffers
          ? { offers: [] }
          : {
              featuredProducts: [
                {
                  id: 'p-1',
                  name: 'Cable Knit Jumper',
                  sizes: ['M'],
                  colors: ['navy'],
                  price: 100,
                  imageSeed: 1,
                  categoryId: 'sweaters',
                },
              ],
            },
      });
    });
    fixture.detectChanges();

    (fixture.componentInstance as unknown as { addToCart: (p: unknown) => void }).addToCart({
      id: 'p-1',
      name: 'Cable Knit Jumper',
      sizes: ['M'],
      colors: ['navy'],
      price: 100,
      imageSeed: 1,
      categoryId: 'sweaters',
    });

    expect((fixture.componentInstance as any).cart.lines()).toHaveLength(1);
  });
});
