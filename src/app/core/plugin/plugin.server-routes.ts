import { RenderMode, type ServerRoute } from '@angular/ssr';
import type { FeatureFlags } from '../config/app-config';
import type { PluginManifest, PluginRenderMode } from './plugin.model';

export const DEFAULT_PLUGIN_RENDER_MODE: PluginRenderMode = 'server';

export function toAngularRenderMode(
  renderMode: PluginRenderMode = DEFAULT_PLUGIN_RENDER_MODE,
): RenderMode {
  switch (renderMode) {
    case 'client':
      return RenderMode.Client;
    case 'server':
      return RenderMode.Server;
    case 'prerender':
      return RenderMode.Prerender;
  }
}

export function toPluginServerRoutes(
  manifests: readonly PluginManifest[],
  flags: FeatureFlags,
  fallback: PluginRenderMode = DEFAULT_PLUGIN_RENDER_MODE,
): ServerRoute[] {
  const pluginRoutes = manifests
    .filter((manifest) => manifest.requiredFlags.every((flag) => flags[flag] === true))
    .sort((a, b) => a.order - b.order)
    .map((manifest) => toServerRoute(`${manifest.route}/**`, manifest.renderMode));

  return [...pluginRoutes, toServerRoute('**', fallback)];
}

function toServerRoute(path: string, renderMode?: PluginRenderMode): ServerRoute {
  switch (toAngularRenderMode(renderMode)) {
    case RenderMode.Client:
      return { path, renderMode: RenderMode.Client };
    case RenderMode.Prerender:
      return { path, renderMode: RenderMode.Prerender };
    case RenderMode.Server:
      return { path, renderMode: RenderMode.Server };
  }
}
