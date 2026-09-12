import type { AppConfig } from '../app/core/config/app-config';

export const environment: AppConfig = {
  production: true,
  appName: 'RIMMS',
  apiBaseUrl: 'http://localhost:3000/api',
  defaultCurrency: 'INR',
  defaultLocale: 'en-US',
  pageSize: 12,
  searchDebounceMs: 250,
  logLevel: 'warn',
  featureFlags: {
    catalog: true,
    search: true,
    inventory: true,
    cart: true,
    wishlist: true,
    offers: true,
    darkMode: true,
  },
};
