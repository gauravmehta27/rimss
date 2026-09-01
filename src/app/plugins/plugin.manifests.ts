import type { PluginManifest } from '../core/plugin/plugin.model';

/**
 * The application's module manifest.
 *
 * This array is the *only* place the shell learns about functional modules.
 * Adding a feature to RIMSS means dropping a folder under `features/` and
 * appending one entry here — no shell, routing or navigation code changes.
 */
export const PLUGIN_MANIFESTS: readonly PluginManifest[] = [
  {
    id: 'home',
    title: 'Home',
    description: 'Landing experience with featured products and live offers.',
    version: '1.0.0',
    route: 'home',
    icon: 'bi-house-door',
    navGroup: 'Storefront',
    order: 10,
    showInNav: true,
    requiredFlags: [],
    loadRoutes: () => import('../features/home/home.routes').then((m) => m.default),
  },
  {
    id: 'catalog',
    title: 'Shop',
    description: 'Product search, faceted filtering and the product showcase screen.',
    version: '1.0.0',
    route: 'catalog',
    icon: 'bi-grid',
    navGroup: 'Storefront',
    order: 20,
    showInNav: true,
    requiredFlags: ['catalog', 'search'],
    loadRoutes: () => import('../features/catalog/catalog.routes').then((m) => m.default),
  },
  {
    id: 'cart',
    title: 'Bag',
    description: 'Basket, pricing rules and order placement.',
    version: '1.0.0',
    route: 'cart',
    icon: 'bi-bag',
    navGroup: 'Storefront',
    order: 30,
    showInNav: true,
    requiredFlags: ['cart'],
    loadRoutes: () => import('../features/cart/cart.routes').then((m) => m.default),
  },
  {
    id: 'inventory',
    title: 'Stock control',
    description: 'Sample operational task: SKU level stock monitoring and adjustment.',
    version: '1.0.0',
    route: 'inventory',
    icon: 'bi-box-seam',
    navGroup: 'Operations',
    order: 40,
    showInNav: true,
    requiredFlags: ['inventory'],
    loadRoutes: () => import('../features/inventory/inventory.routes').then((m) => m.default),
  },
];
