import type { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    title: 'Stock control — RIMSS',
    loadComponent: () => import('./inventory.component').then((m) => m.InventoryComponent),
  },
];

export default routes;
