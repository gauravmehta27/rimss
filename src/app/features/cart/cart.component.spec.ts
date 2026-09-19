import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../../environments/environment';
import { APP_CONFIG } from '../../core/config/app-config';
import { CART_STORAGE_KEY, CartService } from '../../core/services/cart.service';
import { CartComponent } from './cart.component';

describe('CartComponent', () => {
  let httpMock: HttpTestingController;
  let cart: CartService;

  beforeEach(() => {
    localStorage.removeItem(CART_STORAGE_KEY);
    TestBed.configureTestingModule({
      imports: [CartComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: APP_CONFIG, useValue: environment },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    cart = TestBed.inject(CartService);
    cart.clear();
  });

  it('shows the empty state with a link back to the collection', () => {
    const fixture = TestBed.createComponent(CartComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-empty-state')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('a[routerLink="/catalog"]').textContent).toContain(
      'Shop the collection',
    );
  });

  it('lists basket lines and updates the quantity from the stepper', () => {
    cart.add({
      productId: 'p-1',
      sku: 'SWE-1-NAV-M',
      name: 'Cable Knit Jumper',
      size: 'M',
      color: 'navy',
      price: 100,
      quantity: 1,
      imageSeed: 1,
    });
    const fixture = TestBed.createComponent(CartComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Cable Knit Jumper');
    fixture.nativeElement.querySelector('[aria-label^="Increase quantity"]').click();
    fixture.detectChanges();

    expect(cart.lines()[0].quantity).toBe(2);
  });

  it('places an order and clears the basket on success', () => {
    cart.add({
      productId: 'p-1',
      sku: 'SWE-1-NAV-M',
      name: 'Cable Knit Jumper',
      size: 'M',
      color: 'navy',
      price: 100,
      quantity: 1,
      imageSeed: 1,
    });
    const fixture = TestBed.createComponent(CartComponent);
    fixture.detectChanges();

    const checkoutButton = [...fixture.nativeElement.querySelectorAll('button')].find(
      (button: HTMLButtonElement) => /place order/i.test(button.textContent ?? ''),
    ) as HTMLButtonElement;
    checkoutButton.click();

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/products`);
    request.flush({ data: { placeOrder: { id: 'o-1', lines: [{ sku: 'SWE-1-NAV-M' }] } } });
    fixture.detectChanges();

    expect(cart.isEmpty()).toBe(true);
  });
});
