import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeEnIn from '@angular/common/locales/en-IN';
import {
  ApplicationConfig,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withPreloading,
  withRouterConfig,
} from '@angular/router';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { APP_CONFIG } from './core/config/app-config';
import { IdlePreloadStrategy } from './core/routing/idle-preload.strategy';
import { cacheInterceptor } from './core/interceptors/cache.interceptor';
import { correlationLoggingInterceptor } from './core/interceptors/correlation-logging.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { providePlugins } from './core/plugin/plugin.providers';
import { PLUGIN_MANIFESTS } from './plugins/plugin.manifests';
import { provideClientHydration } from '@angular/platform-browser';

registerLocaleData(localeEnIn);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    { provide: APP_CONFIG, useValue: environment },
    { provide: LOCALE_ID, useValue: 'en-IN' },

    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }),
      // Feature bundles are prefetched once the browser is idle, so navigation
      // feels instant without competing with the first paint.
      withPreloading(IdlePreloadStrategy),
      withRouterConfig({ paramsInheritanceStrategy: 'always' }),
    ),

    provideHttpClient(
      withFetch(),
      // Order matters: logging wraps everything, the cache short-circuits before
      // the network, and errors are normalised closest to the transport.
      withInterceptors([
        correlationLoggingInterceptor,
        loadingInterceptor,
        cacheInterceptor,
        errorInterceptor,
      ]),
    ),

    providePlugins(PLUGIN_MANIFESTS),
    provideClientHydration(),
  ],
};
