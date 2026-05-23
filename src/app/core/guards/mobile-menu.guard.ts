import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { LayoutService } from '@layout/layout.service';
import { isMobile } from '@shared/utils/platform';

export const MobileMenuGuard: CanActivateFn = (
  _next: ActivatedRouteSnapshot,
  _state: RouterStateSnapshot,
) => {
  const layoutService = inject(LayoutService);
  const showMenuPage = layoutService.isMobileOrTablet();

  // Allow the user to proceed if all the required roles are present.
  return showMenuPage ? true : inject(Router).navigate(['/home']);
};
