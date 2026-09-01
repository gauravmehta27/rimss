import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-rating-stars',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="rating" [attr.aria-label]="value() + ' out of 5 stars'">
      @for (star of stars(); track $index) {
        <i
          class="bi"
          [class.bi-star-fill]="star === 1"
          [class.bi-star-half]="star === 0.5"
          [class.bi-star]="star === 0"
        ></i>
      }
      @if (reviewCount() !== null) {
        <small class="text-body-secondary ms-1">({{ reviewCount() }})</small>
      }
    </span>
  `,
  styles: `
    .rating {
      color: #f0a202;
      white-space: nowrap;
      font-size: 0.85rem;
    }
  `,
})
export class RatingStarsComponent {
  readonly value = input.required<number>();
  readonly reviewCount = input<number | null>(null);

  protected readonly stars = computed(() => {
    const rounded = Math.round(this.value() * 2) / 2;
    return Array.from({ length: 5 }, (_, index) => {
      const filled = rounded - index;
      return filled >= 1 ? 1 : filled >= 0.5 ? 0.5 : 0;
    });
  });
}
