import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withPreloading } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/auth/auth.interceptor';
import { publicSiteBootstrapInterceptor } from './core/http/public-site-bootstrap.interceptor';

import { AdminPreloading } from './core/access/admin-preloading';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withPreloading(AdminPreloading)),
    provideHttpClient(withInterceptors([authInterceptor, publicSiteBootstrapInterceptor])),
  ],
};
