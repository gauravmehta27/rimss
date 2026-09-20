import { Injectable, computed, inject, signal } from '@angular/core';
import { APP_CONFIG, type FeatureFlags } from '../config/app-config';
import { LoggerService } from '../services/logger.service';
import { PLUGIN_MANIFEST, type NavItem, type PluginManifest } from './plugin.model';

/**
 * Runtime registry of functional plugins.
 *
 * Plugins are contributed through the `PLUGIN_MANIFEST` multi-provider, filtered
 * against the active feature flags, and exposed to the shell as navigation
 * metadata. Loading and rendering strategies do not affect the registry.
 */
@Injectable({ providedIn: 'root' })
export class PluginRegistryService {
  private readonly config = inject(APP_CONFIG);
  private readonly logger = inject(LoggerService).forContext('PluginRegistry');
  private readonly contributed = inject(PLUGIN_MANIFEST, { optional: true }) ?? [];

  private readonly manifests = signal<readonly PluginManifest[]>(dedupe(this.contributed));

  /** Plugins whose feature flags are all satisfied, in declared display order. */
  readonly activePlugins = computed(() =>
    this.manifests()
      .filter((plugin) => isEnabled(plugin, this.config.featureFlags))
      .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title)),
  );

  readonly navItems = computed<NavItem[]>(() =>
    this.activePlugins()
      .filter((plugin) => plugin.showInNav)
      .map(({ id, title, route, icon, navGroup, order }) => ({
        id,
        title,
        route,
        icon,
        navGroup,
        order,
      })),
  );

  /** Navigation grouped by section, ready for the AdminLTE sidebar. */
  readonly navGroups = computed(() => {
    const groups = new Map<string, NavItem[]>();
    for (const item of this.navItems()) {
      const bucket = groups.get(item.navGroup) ?? [];
      bucket.push(item);
      groups.set(item.navGroup, bucket);
    }
    return [...groups.entries()].map(([name, items]) => ({ name, items }));
  });

  constructor() {
    const skipped = this.manifests().filter((p) => !isEnabled(p, this.config.featureFlags));
    this.logger.info(
      `${this.activePlugins().length} plugin(s) mounted`,
      this.activePlugins().map((p) => p.id),
    );
    if (skipped.length) {
      this.logger.warn(
        'plugin(s) skipped by feature flags',
        skipped.map((p) => p.id),
      );
    }
  }

  /** Late registration hook for additional plugin manifests. */
  register(plugin: PluginManifest): void {
    if (this.manifests().some((existing) => existing.id === plugin.id)) {
      this.logger.warn(`duplicate plugin id ignored: ${plugin.id}`);
      return;
    }
    this.manifests.update((list) => [...list, plugin]);
  }

  byId(id: string): PluginManifest | undefined {
    return this.manifests().find((plugin) => plugin.id === id);
  }
}

function isEnabled(plugin: PluginManifest, flags: FeatureFlags): boolean {
  return plugin.requiredFlags.every((flag) => flags[flag] === true);
}

function dedupe(plugins: readonly PluginManifest[]): PluginManifest[] {
  const seen = new Map<string, PluginManifest>();
  for (const plugin of plugins) if (!seen.has(plugin.id)) seen.set(plugin.id, plugin);
  return [...seen.values()];
}
