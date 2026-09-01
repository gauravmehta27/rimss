import type { Routes } from '@angular/router';
import { CatalogStore } from './catalog.store';

/** Route table contributed by the catalog module. */
const routes: Routes = [
  {
    path: '',
    providers: [CatalogStore],
    children: [
      {
        path: '',
        title: 'Shop the collection',
        loadComponent: () =>
          import('./product-search/product-search.component').then((m) => m.ProductSearchComponent),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./product-showcase/product-showcase.component').then(
            (m) => m.ProductShowcaseComponent,
          ),
      },
    ],
  },
];

export default routes;
