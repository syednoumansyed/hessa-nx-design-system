import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from '@auth/auth.service';

export const AuthGuard: CanActivateFn = (
  _next: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const authService: AuthService = inject(AuthService);
  const router: Router = inject(Router);

  const redirectUri = state.url;

  // Navigate the user to the login page if not authenticated.
  if (!authService.isUserLoggedIn()) {
    authService.updateRedirectUri(redirectUri);
    router.navigate(['/login']);
    return false;
  }
  // Get the roles required from the route.
  // const requiredRoles = next.data['roles'];

  // Allow the user to proceed if no additional roles are required to access the route.
  // if (!Array.isArray(requiredRoles) || requiredRoles.length === 0) {
  //   return true;
  // }

  // Allow the user to proceed if all the required roles are present.
  // return requiredRoles.every((role) =>
  //   authService.getUserRoles().includes(role),
  // )
  //   ? true
  //   : router.navigate(['/home']);
  else return true;
};

export const RedirectFromLoginPageGuard: CanActivateFn = (
  _next: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const authService: AuthService = inject(AuthService);
  const router: Router = inject(Router);

  if (authService.isUserLoggedIn()) {
    return router.createUrlTree(['/home']);
  }
  return true;
};
