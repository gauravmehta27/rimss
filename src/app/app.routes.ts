import { Routes } from '@angular/router';
import { environment } from '../environments/environment';
import { toPluginRoutes } from './core/plugin/plugin.providers';
import { ShellComponent } from './layout/shell/shell.component';
import { PLUGIN_MANIFESTS } from './plugins/plugin.manifests';

/**
 * The shell owns exactly three routes: a default redirect, the plugin mount
 * point and a catch-all. Every screen is contributed by a feature module.
 */
export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      ...toPluginRoutes(PLUGIN_MANIFESTS, environment.featureFlags),
      {
        path: '**',
        title: 'Page not found — RIMSS',
        loadComponent: () =>
          import('./layout/not-found/not-found.component').then((m) => m.NotFoundComponent),
      },
    ],
  },
];
