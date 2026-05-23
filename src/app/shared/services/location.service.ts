// location.service.ts
import { Injectable, signal } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private _currentPosition = signal<[number, number]>([0, 0]);
  public currentPosition = this._currentPosition.asReadonly();
  private _hasPermission = signal<boolean>(false);
  public hasPermission = this._hasPermission.asReadonly();
  private watchId: string | null = null;

  async requestLocationPermission(): Promise<boolean> {
    try {
      // Use Capacitor Geolocation permission API on all platforms
      const status = await Geolocation.checkPermissions().catch(() => ({
        location: 'prompt' as const,
      }));

      if (status.location === 'granted') {
        this._hasPermission.set(true);
        return true;
      }

      if (status.location === 'denied') {
        this._hasPermission.set(false);
        return false;
      }

      try {
        // On web/Safari, calling with a timeout prevents hanging.
        await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
        this._hasPermission.set(true);
        return true;
      } catch {
        // Fallback to explicit request
        const req = await Geolocation.requestPermissions().catch(() => ({
          location: 'denied' as const,
        }));
        const granted = (req as any).location === 'granted';
        this._hasPermission.set(granted);
        return granted;
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      this._hasPermission.set(false);
      return false;
    }
  }

  async startWatching() {
    if (this.watchId) {
      console.log('Already watching position');
      await this.stopWatching();
    }

    try {
      // Initial position with timeout to avoid hang on web
      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });

      console.log('Current position:', coordinates);

      this._currentPosition.set([
        coordinates.coords.latitude,
        coordinates.coords.longitude,
      ]);

      // Start watching position
      this.watchId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        },
        (position, err) => {
          if (err) {
            console.error('Error watching position:', err);
            return;
          }
          if (position) {
            const newPosition: [number, number] = [
              position.coords.latitude,
              position.coords.longitude,
            ];
            this._currentPosition.set(newPosition);
          }
        },
      );
    } catch (error) {
      console.error('Error getting location:', error);
    }
  }

  async stopWatching() {
    if (this.watchId) {
      await Geolocation.clearWatch({ id: this.watchId });
      this.watchId = null;
    }
  }
}
