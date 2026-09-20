import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { PLUGIN_MANIFEST, type PluginManifest } from './plugin.model';
import { providePlugins } from './plugin.providers';

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

describe('providePlugins', () => {
  it('registers each manifest as a multi-provider for PLUGIN_MANIFEST', () => {
    TestBed.configureTestingModule({
      providers: [providePlugins([manifest(), manifest({ id: 'inventory' })])],
    });

    const manifests = TestBed.inject(PLUGIN_MANIFEST);
    expect(manifests.map((item) => item.id)).toEqual(['catalog', 'inventory']);
  });
});
