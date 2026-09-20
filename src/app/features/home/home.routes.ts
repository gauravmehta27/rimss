import type { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    title: 'RIMSS — Luxury countryside fashion',
    loadComponent: () => import('./home.component').then((m) => m.HomeComponent),
  },
];

export default routes;
