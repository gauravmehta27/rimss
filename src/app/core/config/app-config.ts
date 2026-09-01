import { InjectionToken } from '@angular/core';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'off';

/** Every pluggable module is gated behind a flag so modules can ship dark. */
export interface FeatureFlags {
  catalog: boolean;
  search: boolean;
  inventory: boolean;
  cart: boolean;
  wishlist: boolean;
  offers: boolean;
  darkMode: boolean;
}

export interface AppConfig {
  production: boolean;
  appName: string;
  apiBaseUrl: string;
  defaultCurrency: string;
  defaultLocale: string;
  pageSize: number;
  searchDebounceMs: number;
  logLevel: LogLevel;
  featureFlags: FeatureFlags;
}

export const APP_CONFIG = new InjectionToken<AppConfig>('RIMSS_APP_CONFIG');
