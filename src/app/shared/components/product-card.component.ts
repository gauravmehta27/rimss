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
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.scss',
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
