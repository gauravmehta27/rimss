import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';

@Component({
  selector: 'app-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, EmptyStateComponent],
  template: `
    <app-empty-state
      icon="bi-compass"
      title="Page not found"
      message="The page you were looking for has moved or never existed."
    >
      <a class="btn btn-primary mt-3" routerLink="/home">Back to the storefront</a>
    </app-empty-state>
  `,
})
export class NotFoundComponent {}
