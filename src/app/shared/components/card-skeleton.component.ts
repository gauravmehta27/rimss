import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Content placeholder shown while data is in flight, avoiding layout shift. */
@Component({
  selector: 'app-card-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (item of placeholders(); track $index) {
      <div class="col">
        <div class="card h-100" aria-hidden="true">
          <div class="skeleton skeleton--media"></div>
          <div class="card-body">
            <div class="skeleton skeleton--line w-50 mb-2"></div>
            <div class="skeleton skeleton--line w-75 mb-2"></div>
            <div class="skeleton skeleton--line w-25"></div>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .skeleton {
      background: linear-gradient(
        90deg,
        var(--bs-tertiary-bg) 25%,
        var(--bs-secondary-bg) 37%,
        var(--bs-tertiary-bg) 63%
      );
      background-size: 400% 100%;
      animation: shimmer 1.2s ease infinite;
      border-radius: 0.25rem;
    }
    .skeleton--media {
      aspect-ratio: 4 / 3;
      border-radius: 0.375rem 0.375rem 0 0;
    }
    .skeleton--line {
      height: 0.85rem;
    }
    @keyframes shimmer {
      0% {
        background-position: 100% 50%;
      }
      100% {
        background-position: 0 50%;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .skeleton {
        animation: none;
      }
    }
  `,
})
export class CardSkeletonComponent {
  readonly count = input(8);

  protected placeholders(): number[] {
    return Array.from({ length: this.count() }, (_, index) => index);
  }
}
