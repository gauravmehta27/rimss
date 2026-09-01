import { makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';
import type { Route, Routes } from '@angular/router';
import type { FeatureFlags } from '../config/app-config';
import { PLUGIN_MANIFEST, type PluginManifest } from './plugin.model';

/** Registers functional modules with the shell. */
export function providePlugins(manifests: readonly PluginManifest[]): EnvironmentProviders {
  return makeEnvironmentProviders(
    manifests.map((manifest) => ({ provide: PLUGIN_MANIFEST, multi: true, useValue: manifest })),
  );
}

/**
 * Projects manifests into lazily loaded child routes. Each module is a separate
 * bundle, so the initial payload stays small no matter how many modules ship.
 */
export function toPluginRoutes(manifests: readonly PluginManifest[], flags: FeatureFlags): Routes {
  return manifests
    .filter((manifest) => manifest.requiredFlags.every((flag) => flags[flag] === true))
    .sort((a, b) => a.order - b.order)
    .map<Route>((manifest) => ({
      path: manifest.route,
      loadChildren: () => manifest.loadRoutes(),
      data: { pluginId: manifest.id, title: manifest.title },
    }));
}
