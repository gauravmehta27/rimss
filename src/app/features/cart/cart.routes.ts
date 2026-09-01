import type { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    title: 'Your bag — RIMSS',
    loadComponent: () => import('./cart.component').then((m) => m.CartComponent),
  },
];

export default routes;
