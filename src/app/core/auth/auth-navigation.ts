import { Router, UrlTree } from '@angular/router';

/** Only private, same-application destinations may be restored after sign-in. */
export function privateReturnUrl(value: string | null | undefined): string | null {
  if (!value || /[\\\s]/.test(value) || !value.startsWith('/') || value.startsWith('//'))
    return null;
  try {
    const path = decodeURIComponent(value.split(/[?#]/)[0]);
    if (/[\\\s]/.test(path) || path.includes('//')) return null;
    return /^\/(admin|panel-cliente)(\/|$)/.test(path) ? value : null;
  } catch {
    return null;
  }
}

export function loginRedirect(router: Router, destination: string): UrlTree {
  const redirectTo = privateReturnUrl(destination);
  return router.createUrlTree(['/login'], { queryParams: redirectTo ? { redirectTo } : {} });
}
