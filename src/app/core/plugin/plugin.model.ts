import { InjectionToken } from '@angular/core';
import type { Routes } from '@angular/router';
import type { FeatureFlags } from '../config/app-config';

/**
 * Contract every functional module must satisfy to be plugged into the shell.
 *
 * A module owns its routes, its navigation metadata and its own feature flag.
 * The shell knows nothing about a module beyond this manifest, which keeps the
 * application open for extension and closed for modification.
 */
export interface PluginManifest {
  /** Stable machine id, also used as the lazy-loading chunk hint. */
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly version: string;
  /** Top-level route segment owned by the module. */
  readonly route: string;
  /** Bootstrap Icons class rendered in the sidebar. */
  readonly icon: string;
  readonly navGroup: string;
  readonly order: number;
  readonly showInNav: boolean;
  /** Module is only mounted when every listed flag is enabled. */
  readonly requiredFlags: readonly (keyof FeatureFlags)[];
  /** Lazily loaded route table contributed by the module. */
  readonly loadRoutes: () => Promise<Routes>;
}

export interface NavItem {
  id: string;
  title: string;
  route: string;
  icon: string;
  navGroup: string;
  order: number;
}

export const PLUGIN_MANIFEST = new InjectionToken<PluginManifest[]>('RIMSS_PLUGIN_MANIFEST');
