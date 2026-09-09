import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { environment } from '../../../environments/environment';
import { APP_CONFIG, type AppConfig } from '../config/app-config';
import { PluginRegistryService } from './plugin-registry.service';
import { PLUGIN_MANIFEST, type PluginManifest } from './plugin.model';
import { toPluginRoutes } from './plugin.providers';

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
    loadRoutes: () => Promise.resolve([]),
    ...overrides,
  };
}

function configure(
  manifests: PluginManifest[],
  config: AppConfig = environment,
): PluginRegistryService {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      { provide: APP_CONFIG, useValue: config },
      ...manifests.map((value) => ({ provide: PLUGIN_MANIFEST, multi: true, useValue: value })),
    ],
  });
  return TestBed.inject(PluginRegistryService);
}

describe('PluginRegistryService', () => {
  it('mounts every module whose feature flags are satisfied', () => {
    const registry = configure([
      manifest(),
      manifest({ id: 'inventory', route: 'inventory', requiredFlags: ['inventory'] }),
    ]);

    expect(registry.activePlugins().map((plugin) => plugin.id)).toEqual(['catalog', 'inventory']);
  });

  it('excludes a module when one of its required flags is off', () => {
    const config: AppConfig = {
      ...environment,
      featureFlags: { ...environment.featureFlags, inventory: false },
    };
    const registry = configure(
      [manifest(), manifest({ id: 'inventory', route: 'inventory', requiredFlags: ['inventory'] })],
      config,
    );

    expect(registry.activePlugins().map((plugin) => plugin.id)).toEqual(['catalog']);
    expect(registry.byId('inventory')).toBeDefined();
  });

  it('orders navigation entries by the declared order and skips hidden modules', () => {
    const registry = configure([
      manifest({
        id: 'inventory',
        route: 'inventory',
        title: 'Stock',
        order: 40,
        requiredFlags: ['inventory'],
      }),
      manifest({ id: 'home', route: 'home', title: 'Home', order: 10, requiredFlags: [] }),
      manifest({
        id: 'admin',
        route: 'admin',
        title: 'Admin',
        order: 5,
        showInNav: false,
        requiredFlags: [],
      }),
    ]);

    expect(registry.navItems().map((item) => item.title)).toEqual(['Home', 'Stock']);
  });

  it('groups navigation entries by section', () => {
    const registry = configure([
      manifest({
        id: 'home',
        route: 'home',
        title: 'Home',
        navGroup: 'Storefront',
        order: 10,
        requiredFlags: [],
      }),
      manifest({
        id: 'inventory',
        route: 'inventory',
        title: 'Stock',
        navGroup: 'Operations',
        order: 40,
        requiredFlags: ['inventory'],
      }),
    ]);

    expect(registry.navGroups().map((group) => group.name)).toEqual(['Storefront', 'Operations']);
    expect(registry.navGroups()[0].items).toHaveLength(1);
  });

  it('ignores a duplicate module id registered at runtime', () => {
    const registry = configure([manifest()]);
    registry.register(manifest({ title: 'Impostor' }));

    expect(registry.activePlugins()).toHaveLength(1);
    expect(registry.activePlugins()[0].title).toBe('Shop');
  });
});

describe('toPluginRoutes', () => {
  it('produces one lazily loaded route per enabled module', () => {
    const routes = toPluginRoutes(
      [
        manifest(),
        manifest({ id: 'inventory', route: 'inventory', order: 40, requiredFlags: ['inventory'] }),
      ],
      environment.featureFlags,
    );

    expect(routes.map((route) => route.path)).toEqual(['catalog', 'inventory']);
    expect(routes.every((route) => typeof route.loadChildren === 'function')).toBe(true);
    expect(routes[0].data).toEqual({ pluginId: 'catalog', title: 'Shop', preload: false });
  });

  it('does not emit a route for a disabled module, so the bundle is never requested', () => {
    const routes = toPluginRoutes([manifest()], { ...environment.featureFlags, catalog: false });

    expect(routes).toEqual([]);
  });
});
