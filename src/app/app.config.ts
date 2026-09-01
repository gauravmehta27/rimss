import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeEnIn from '@angular/common/locales/en-IN';
import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  PreloadAllModules,
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withPreloading,
  withRouterConfig,
} from '@angular/router';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { APP_CONFIG } from './core/config/app-config';
import { cacheInterceptor } from './core/interceptors/cache.interceptor';
import { correlationLoggingInterceptor } from './core/interceptors/correlation-logging.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { providePlugins } from './core/plugin/plugin.providers';
import { PLUGIN_MANIFESTS } from './plugins/plugin.manifests';

registerLocaleData(localeEnIn);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: APP_CONFIG, useValue: environment },
    { provide: LOCALE_ID, useValue: 'en-IN' },

    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }),
      // Feature bundles are prefetched once the app is idle, so navigation feels
      // instant while the initial payload stays minimal.
      withPreloading(PreloadAllModules),
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
  ],
};
