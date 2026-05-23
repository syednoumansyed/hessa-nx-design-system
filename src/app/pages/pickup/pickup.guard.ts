import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Geolocation } from '@capacitor/geolocation';
import { LocationService } from '@shared/services/location.service';

export const locationGateGuard: CanActivateFn = async (): Promise<
  boolean | UrlTree
> => {
  const router = inject(Router);
  const locationService = inject(LocationService);
  const status = await Geolocation.checkPermissions();
  const state = (status.location ?? 'prompt') as
    | 'granted'
    | 'denied'
    | 'prompt';

  if (state === 'granted') {
    locationService.startWatching();
    return true;
  }

  return router.createUrlTree(['/no-location-permission']);
};
