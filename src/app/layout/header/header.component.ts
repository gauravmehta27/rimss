import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { APP_CONFIG } from '../../core/config/app-config';
import type { Suggestion } from '../../core/models/product.model';
import { CartService } from '../../core/services/cart.service';
import { LayoutService } from '../../core/services/layout.service';
import { ProductService } from '../../core/services/product.service';

/**
 * Global header with type-ahead search.
 *
 * Suggestions are debounced and switch-mapped so only the latest keystroke ever
 * reaches the API, keeping perceived response inside the 100ms NFR budget.
 */
@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, CurrencyPipe],
  host: { class: 'app-header navbar navbar-expand bg-body' },
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  protected readonly layout = inject(LayoutService);
  protected readonly cart = inject(CartService);
  protected readonly config = inject(APP_CONFIG);
  private readonly products = inject(ProductService);
  private readonly router = inject(Router);

  protected readonly term = signal('');
  protected readonly suggestions = signal<Suggestion[]>([]);
  protected readonly showSuggestions = signal(false);

  constructor() {
    toObservable(this.term)
      .pipe(
        debounceTime(this.config.searchDebounceMs),
        distinctUntilChanged(),
        switchMap((value) =>
          value.trim().length < 2
            ? of([])
            : this.products.suggestions(value.trim()).pipe(catchError(() => of([]))),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((suggestions) => this.suggestions.set(suggestions));
  }

  protected submit(): void {
    this.showSuggestions.set(false);
    void this.router.navigate(['/catalog'], {
      queryParams: { search: this.term().trim() || null, page: 1 },
    });
  }

  protected open(suggestion: Suggestion): void {
    this.showSuggestions.set(false);
    void this.router.navigate(['/catalog', suggestion.id]);
  }

  protected hideSoon(): void {
    setTimeout(() => this.showSuggestions.set(false), 150);
  }
}
