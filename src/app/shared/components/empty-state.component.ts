import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="text-center py-5 px-3">
      <i class="bi {{ icon() }} display-5 text-body-secondary"></i>
      <h3 class="h5 mt-3">{{ title() }}</h3>
      <p class="text-body-secondary mb-0">{{ message() }}</p>
      <ng-content />
    </div>
  `,
})
export class EmptyStateComponent {
  readonly icon = input('bi-inbox');
  readonly title = input('Nothing to show');
  readonly message = input('Try adjusting your filters or search term.');
}
