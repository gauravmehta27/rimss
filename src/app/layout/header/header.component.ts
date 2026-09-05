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
  template: `
    <div class="container-fluid">
      <ul class="navbar-nav">
        <li class="nav-item">
          <button
            type="button"
            class="nav-link btn btn-link"
            (click)="layout.toggleSidebar()"
            aria-label="Toggle navigation"
          >
            <i class="bi bi-list fs-5"></i>
          </button>
        </li>
        <li class="nav-item d-none d-md-block"><a class="nav-link" routerLink="/home">Home</a></li>
        <li class="nav-item d-none d-md-block">
          <a class="nav-link" routerLink="/catalog">Shop</a>
        </li>
      </ul>

      <form
        class="app-header__search mx-auto position-relative"
        role="search"
        (ngSubmit)="submit()"
      >
        <div class="input-group input-group-sm">
          <span class="input-group-text bg-body-tertiary border-end-0"
            ><i class="bi bi-search"></i
          ></span>
          <input
            type="search"
            name="q"
            class="form-control border-start-0"
            placeholder="Search sweaters, moleskin, corduroy…"
            autocomplete="off"
            aria-label="Search products"
            [ngModel]="term()"
            (ngModelChange)="term.set($event)"
            (focus)="showSuggestions.set(true)"
            (blur)="hideSoon()"
          />
        </div>

        @if (showSuggestions() && suggestions().length) {
          <ul class="list-group shadow app-header__suggestions">
            @for (suggestion of suggestions(); track suggestion.id) {
              <li
                class="list-group-item list-group-item-action d-flex justify-content-between align-items-center py-2"
              >
                <button
                  type="button"
                  class="btn btn-link p-0 text-start text-decoration-none"
                  (mousedown)="open(suggestion)"
                >
                  <span class="d-block small fw-semibold">{{ suggestion.name }}</span>
                  <span class="d-block text-body-secondary" style="font-size: 0.75rem">{{
                    suggestion.categoryName
                  }}</span>
                </button>
                <span class="small text-body-secondary">{{
                  suggestion.price | currency: config.defaultCurrency
                }}</span>
              </li>
            }
          </ul>
        }
      </form>

      <ul class="navbar-nav ms-auto align-items-center">
        <li class="nav-item">
          <button
            type="button"
            class="nav-link btn btn-link"
            (click)="layout.toggleTheme()"
            [attr.aria-label]="layout.isDark() ? 'Switch to light theme' : 'Switch to dark theme'"
          >
            <i
              class="bi"
              [class.bi-moon-stars]="!layout.isDark()"
              [class.bi-sun]="layout.isDark()"
            ></i>
          </button>
        </li>
        <li class="nav-item">
          <a class="nav-link position-relative" routerLink="/cart" aria-label="Shopping bag">
            <i class="bi bi-bag fs-6"></i>
            @if (cart.itemCount() > 0) {
              <span class="badge rounded-pill text-bg-danger app-header__badge">{{
                cart.itemCount()
              }}</span>
            }
          </a>
        </li>
      </ul>
    </div>
  `,
  styles: `
    .app-header__search {
      max-width: 34rem;
      flex: 1 1 auto;
    }
    .app-header__suggestions {
      position: absolute;
      inset-inline: 0;
      z-index: 1050;
      margin-top: 0.25rem;
      max-height: 20rem;
      overflow-y: auto;
    }
    .app-header__badge {
      position: absolute;
      top: 0.25rem;
      inset-inline-start: 1.4rem;
      font-size: 0.65rem;
    }
  `,
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
