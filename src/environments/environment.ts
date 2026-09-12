import type { AppConfig } from '../app/core/config/app-config';

export const environment: AppConfig = {
  production: false,
  appName: 'RIMMS',
  apiBaseUrl: 'http://localhost:3000/api',
  defaultCurrency: 'INR',
  defaultLocale: 'en-US',
  pageSize: 12,
  searchDebounceMs: 250,
  logLevel: 'debug',
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
