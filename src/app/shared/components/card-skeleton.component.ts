import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Content placeholder shown while data is in flight, avoiding layout shift. */
@Component({
  selector: 'app-card-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './card-skeleton.component.html',
  styleUrl: './card-skeleton.component.scss',
})
export class CardSkeletonComponent {
  readonly count = input(8);

  protected placeholders(): number[] {
    return Array.from({ length: this.count() }, (_, index) => index);
  }
}
