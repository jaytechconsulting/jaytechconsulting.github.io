import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withPreloading } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideClientHydration, withIncrementalHydration } from '@angular/platform-browser';
import { authInterceptor } from './core/auth/auth.interceptor';

import { AdminPreloading } from './core/access/admin-preloading';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withPreloading(AdminPreloading)),
    provideHttpClient(withInterceptors([authInterceptor])),
    // Public pages are prerendered on each publish: the browser adopts that HTML and reuses the
    // API responses captured at build time instead of calling the CMS again while it boots.
    provideClientHydration(withIncrementalHydration()),
  ],
};
