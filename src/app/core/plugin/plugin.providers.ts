import { makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';
import type { Route, Routes } from '@angular/router';
import type { FeatureFlags } from '../config/app-config';
import { PLUGIN_MANIFEST, type PluginManifest } from './plugin.model';

/** Registers functional plugins with the shell. */
export function providePlugins(manifests: readonly PluginManifest[]): EnvironmentProviders {
  return makeEnvironmentProviders(
    manifests.map((manifest) => ({ provide: PLUGIN_MANIFEST, multi: true, useValue: manifest })),
  );
}

/**
 * Projects manifests into lazy browser routes. Each plugin remains on-demand,
 * so visiting Home never evaluates other feature implementations.
 */
export function toPluginRoutes(manifests: readonly PluginManifest[], flags: FeatureFlags): Routes {
  return manifests
    .filter((manifest) => manifest.requiredFlags.every((flag) => flags[flag] === true))
    .sort((a, b) => a.order - b.order)
    .map(toPluginRoute);
}

function toPluginRoute(manifest: PluginManifest): Route {
  const route: Route = {
    path: manifest.route,
    data: { pluginId: manifest.id, title: manifest.title, preload: false },
  };

  switch (manifest.loader.kind) {
    case 'children':
      return { ...route, loadChildren: manifest.loader.loadChildren };
    case 'component':
      return { ...route, loadComponent: manifest.loader.loadComponent };
  }
}
