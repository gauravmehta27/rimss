import { InjectionToken } from '@angular/core';
import type { Route } from '@angular/router';
import type { FeatureFlags } from '../config/app-config';

export type PluginLoadStrategy =
  | {
      readonly kind: 'children';
      readonly loadChildren: NonNullable<Route['loadChildren']>;
    }
  | {
      readonly kind: 'component';
      readonly loadComponent: NonNullable<Route['loadComponent']>;
    };

export type PluginRenderMode = 'client' | 'server' | 'prerender';

/**
 * Contract every functional plugin must satisfy to be plugged into the shell.
 *
 * A plugin owns its loading strategy, navigation metadata and feature flags.
 * Rendering is configured independently so the shell remains unaware of both
 * feature implementations and server-rendering details.
 */
export interface PluginManifest {
  /** Stable machine id, also used as the lazy-loading chunk hint. */
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly version: string;
  /** Top-level route segment owned by the plugin. */
  readonly route: string;
  /** Bootstrap Icons class rendered in the sidebar. */
  readonly icon: string;
  readonly navGroup: string;
  readonly order: number;
  readonly showInNav: boolean;
  /** Plugin is only mounted when every listed flag is enabled. */
  readonly requiredFlags: readonly (keyof FeatureFlags)[];
  /** Lazily loaded route children/module or standalone component. */
  readonly loader: PluginLoadStrategy;
  /** Initial rendering policy. Defaults to server rendering when omitted. */
  readonly renderMode?: PluginRenderMode;
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
