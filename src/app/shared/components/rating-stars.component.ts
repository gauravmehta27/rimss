import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-rating-stars',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './rating-stars.component.html',
  styleUrl: './rating-stars.component.scss',
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
