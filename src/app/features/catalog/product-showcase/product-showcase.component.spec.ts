import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../../../environments/environment';
import { APP_CONFIG } from '../../../core/config/app-config';
import { ProductShowcaseComponent } from './product-showcase.component';

describe('ProductShowcaseComponent', () => {
  let httpMock: HttpTestingController;
  let paramMap$: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  function detail() {
    return {
      id: 'p-1',
      name: 'Cable Knit Jumper',
      categoryName: 'Sweaters',
      categoryId: 'sweaters',
      imageSeed: 1,
      price: 100,
      colors: ['navy'],
      sizes: ['M'],
      variants: [{ sku: 'SWE-1-NAV-M', colorId: 'navy', size: 'M', quantity: 3, reorderLevel: 1 }],
      related: [],
    };
  }

  beforeEach(() => {
    paramMap$ = new BehaviorSubject(convertToParamMap({ id: 'p-1' }));
    TestBed.configureTestingModule({
      imports: [ProductShowcaseComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: APP_CONFIG, useValue: environment },
        { provide: ActivatedRoute, useValue: { paramMap: paramMap$ } },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('loads the product, pre-selects the first variant and enables adding to bag', () => {
    const fixture = TestBed.createComponent(ProductShowcaseComponent);
    fixture.detectChanges();

    httpMock.expectOne(`${environment.apiBaseUrl}/products`).flush({ data: { product: detail() } });
    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    expect(component.product().name).toBe('Cable Knit Jumper');
    expect(component.selectedColor()).toBe('navy');
    expect(component.canAdd()).toBe(true);
  });

  it('adds the selected variant to the bag', () => {
    const fixture = TestBed.createComponent(ProductShowcaseComponent);
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiBaseUrl}/products`).flush({ data: { product: detail() } });
    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    component.addToBag();

    expect(component.cart.lines()).toHaveLength(1);
    expect(component.cart.lines()[0].sku).toBe('SWE-1-NAV-M');
  });

  it('surfaces a not-found error without throwing', () => {
    const fixture = TestBed.createComponent(ProductShowcaseComponent);
    fixture.detectChanges();

    httpMock.expectOne(`${environment.apiBaseUrl}/products`).flush({
      errors: [{ message: 'Product does not exist.', extensions: { code: 'PRODUCT_NOT_FOUND' } }],
    });
    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    expect(component.error()?.code).toBe('PRODUCT_NOT_FOUND');
    expect(component.product()).toBeNull();
  });

  it('clamps quantity changes to the variant stock', () => {
    const fixture = TestBed.createComponent(ProductShowcaseComponent);
    fixture.detectChanges();
    httpMock.expectOne(`${environment.apiBaseUrl}/products`).flush({ data: { product: detail() } });
    fixture.detectChanges();

    const component = fixture.componentInstance as any;
    component.changeQuantity(10);
    expect(component.quantity()).toBe(3);
    component.changeQuantity(-10);
    expect(component.quantity()).toBe(1);
  });
});
