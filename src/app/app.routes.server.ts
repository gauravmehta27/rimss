import type { ServerRoute } from '@angular/ssr';
import { environment } from '../environments/environment';
import { toPluginServerRoutes } from './core/plugin/plugin.server-routes';
import { PLUGIN_MANIFESTS } from './plugins/plugin.manifests';

export const serverRoutes: ServerRoute[] = toPluginServerRoutes(
  PLUGIN_MANIFESTS,
  environment.featureFlags,
);
