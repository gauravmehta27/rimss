import { RenderMode } from '@angular/ssr';
import { describe, expect, it } from 'vitest';
import { environment } from '../../../environments/environment';
import type { PluginManifest } from './plugin.model';
import {
  DEFAULT_PLUGIN_RENDER_MODE,
  toAngularRenderMode,
  toPluginServerRoutes,
} from './plugin.server-routes';

function manifest(overrides: Partial<PluginManifest> = {}): PluginManifest {
  return {
    id: 'catalog',
    title: 'Shop',
    description: 'Catalogue module',
    version: '1.0.0',
    route: 'catalog',
    icon: 'bi-grid',
    navGroup: 'Storefront',
    order: 20,
    showInNav: true,
    requiredFlags: ['catalog'],
    loader: { kind: 'children', loadChildren: () => Promise.resolve([]) },
    ...overrides,
  };
}

describe('plugin server routes', () => {
  it.each([
    ['client', RenderMode.Client],
    ['server', RenderMode.Server],
    ['prerender', RenderMode.Prerender],
  ] as const)('maps %s rendering to the Angular RenderMode', (mode, expected) => {
    expect(toAngularRenderMode(mode)).toBe(expected);
  });

  it('uses server rendering when a plugin has no explicit render mode', () => {
    expect(DEFAULT_PLUGIN_RENDER_MODE).toBe('server');
    expect(toAngularRenderMode()).toBe(RenderMode.Server);

    const routes = toPluginServerRoutes([manifest()], environment.featureFlags);
    expect(routes[0]).toEqual({ path: 'catalog/**', renderMode: RenderMode.Server });
    expect(routes.at(-1)).toEqual({ path: '**', renderMode: RenderMode.Server });
  });

  it('keeps loading and rendering strategies independent', () => {
    const componentPlugin = manifest({
      renderMode: 'client',
      loader: {
        kind: 'component',
        loadComponent: () =>
          import('../../layout/not-found/not-found.component').then(
            (module) => module.NotFoundComponent,
          ),
      },
    });

    expect(toPluginServerRoutes([componentPlugin], environment.featureFlags)[0]).toEqual({
      path: 'catalog/**',
      renderMode: RenderMode.Client,
    });
  });
});
