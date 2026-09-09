import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProductSummary } from '../../core/models/product.model';
import { ProductCardComponent } from './product-card.component';

const product: ProductSummary = {
  id: 'p-1',
  slug: 'country-brogue',
  name: 'Country Brogue',
  brand: 'YCompany',
  categoryId: 'shoes',
  categoryName: 'Shoes',
  department: 'Footwear',
  audience: 'Adults',
  material: 'Leather',
  shortDescription: 'Country shoes',
  price: 85,
  listPrice: 100,
  discountPercent: 15,
  currency: 'GBP',
  rating: 4,
  reviewCount: 10,
  colors: ['brown'],
  sizes: ['8'],
  stock: 3,
  inStock: true,
  featured: true,
  isNew: true,
  tags: [],
  imageSeed: 1,
  createdAt: '2026-01-01',
};

describe('ProductCardComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ProductCardComponent],
      providers: [provideRouter([])],
    });
  });

  function render(overrides: Partial<ProductSummary> = {}) {
    const fixture = TestBed.createComponent(ProductCardComponent);
    fixture.componentRef.setInput('product', { ...product, ...overrides });
    fixture.detectChanges();
    return fixture;
  }

  it('derives the media link name from image alt text and all visible badges', () => {
    const fixture = render({ inStock: false });
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('.product-card__media');

    // Explicit naming would override the child badges and fail label-in-name.
    expect(link.hasAttribute('aria-label')).toBe(false);
    expect(link.hasAttribute('aria-labelledby')).toBe(false);
    expect(link.querySelector('img')?.alt).toBe('Country Brogue — Shoes');
    expect(link.textContent).toContain('-15%');
    expect(link.textContent).toContain('New');
    expect(link.textContent).toContain('Sold out');
    expect(link.getAttribute('href')).toBe('/catalog/p-1');
  });

  it('keeps the image-only link named when there are no badges', () => {
    const fixture = render({ discountPercent: 0, isNew: false });
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('.product-card__media');
    expect(link.querySelectorAll('.badge')).toHaveLength(0);
    expect(link.querySelector('img')?.alt).toContain(product.name);
  });

  it('uses automatic lazy-image sizing with a closer 450px source', () => {
    const fixture = render();
    const image: HTMLImageElement = fixture.nativeElement.querySelector('img');
    expect(image.getAttribute('loading')).toBe('lazy');
    expect(image.getAttribute('fetchpriority')).toBe('low');
    expect(image.sizes).toMatch(/^auto, /);
    expect(image.srcset).toContain('fm=webp');
    expect(image.srcset).toContain('w=450&h=338&q=60 450w');
    expect(image.width).toBe(400);
    expect(image.height).toBe(300);
  });

  it('emits the product when adding an available item to the bag', () => {
    const fixture = render();
    const added = vi.fn();
    fixture.componentInstance.addToCart.subscribe(added);
    fixture.nativeElement.querySelector('button').click();
    expect(added).toHaveBeenCalledWith(product);
  });

  it('disables the bag action for sold-out products', () => {
    const fixture = render({ inStock: false });
    const added = vi.fn();
    fixture.componentInstance.addToCart.subscribe(added);
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    button.click();
    expect(button.disabled).toBe(true);
    expect(added).not.toHaveBeenCalled();
  });
});
