import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { ProductSummary } from '../../core/models/product.model';
import { productArtwork, productImage, productImageSrcset } from '../utils/product-artwork';
import { RatingStarsComponent } from './rating-stars.component';

@Component({
  selector: 'app-product-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, RouterLink, RatingStarsComponent],
  template: `
    <article class="card product-card h-100 shadow-sm">
      <a
        class="product-card__media"
        [routerLink]="['/catalog', product().id]"
        [style.background-image]="'url(' + artwork() + ')'"
      >
        <img
          [src]="photo()"
          [srcset]="photoSrcset()"
          sizes="auto, (min-width: 1400px) 22vw, (min-width: 768px) 30vw, 46vw"
          [alt]="product().name + ' — ' + product().categoryName"
          width="400"
          height="300"
          loading="lazy"
          decoding="async"
          fetchpriority="low"
        />
        <div class="product-card__badges">
          @if (product().discountPercent > 0) {
            <span class="badge text-bg-danger">-{{ product().discountPercent }}%</span>
          }
          @if (product().isNew) {
            <span class="badge text-bg-dark">New</span>
          }
          @if (!product().inStock) {
            <span class="badge text-bg-secondary">Sold out</span>
          }
        </div>
      </a>

      <div class="card-body d-flex flex-column">
        <p class="text-uppercase text-body-secondary small mb-1">
          {{ product().categoryName }} · {{ product().audience }}
        </p>
        <h3 class="h6 mb-1">
          <a
            class="stretched-none link-body-emphasis text-decoration-none"
            [routerLink]="['/catalog', product().id]"
          >
            {{ product().name }}
          </a>
        </h3>
        <app-rating-stars [value]="product().rating" [reviewCount]="product().reviewCount" />

        <div class="mt-2 mb-3">
          <span class="fw-semibold fs-6">{{ product().price | currency: product().currency }}</span>
          @if (product().discountPercent > 0) {
            <span class="text-body-secondary text-decoration-line-through ms-2 small">
              {{ product().listPrice | currency: product().currency }}
            </span>
          }
        </div>

        <button
          type="button"
          class="btn btn-sm btn-primary mt-auto"
          [disabled]="!product().inStock"
          (click)="addToCart.emit(product())"
        >
          <i class="bi bi-bag-plus me-1"></i>{{ product().inStock ? 'Add to bag' : 'Notify me' }}
        </button>
      </div>
    </article>
  `,
  styles: `
    .product-card {
      border: 1px solid var(--bs-border-color-translucent);
      transition:
        transform 0.18s ease,
        box-shadow 0.18s ease;
    }
    .product-card:hover,
    .product-card:focus-within {
      transform: translateY(-4px);
      box-shadow: 0 0.75rem 1.5rem rgba(0, 0, 0, 0.12) !important;
    }
    .product-card__media {
      position: relative;
      display: block;
      overflow: hidden;
      border-top-left-radius: inherit;
      border-top-right-radius: inherit;
      aspect-ratio: 4 / 3;
      background-color: var(--bs-tertiary-bg);
      background-size: cover;
      background-position: center;
    }
    .product-card__media img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .product-card__badges {
      position: absolute;
      inset-block-start: 0.5rem;
      inset-inline-start: 0.5rem;
      display: flex;
      gap: 0.25rem;
    }
    @media (prefers-reduced-motion: reduce) {
      .product-card {
        transition: none;
      }
    }
  `,
})
export class ProductCardComponent {
  readonly product = input.required<ProductSummary>();
  readonly addToCart = output<ProductSummary>();

  protected readonly artwork = computed(() =>
    productArtwork(this.product().imageSeed, this.product().name, this.product().categoryName),
  );

  protected readonly photo = computed(() =>
    productImage(this.product().imageSeed, this.product().categoryId),
  );

  protected readonly photoSrcset = computed(() =>
    productImageSrcset(
      this.product().imageSeed,
      this.product().categoryId,
      400,
      300,
      [0.5, 0.75, 1, 1.125, 1.5, 2],
    ),
  );
}
