import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  signal,
  effect,
} from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import * as L from 'leaflet';
import { AuthService } from '@auth/auth.service';
import { GuardianService } from '@pages/user-management/guardians/guardians.service';
import { SchoolLocation } from '@shared/dto-transformation/pick-up/pickup.interface';
import { LocationService } from '@shared/services/location.service';
import { LayoutService } from '@layout/layout.service';
import { CAMPUS_MAP_RADIUS } from '@pages/pickup/constants/pickup.constant';

@Component({
  selector: 'app-pickup-guardian-map',
  templateUrl: './pickup-guardian-map.page.html',
  styleUrls: ['./pickup-guardian-map.page.scss'],
  standalone: true,
  imports: [TranslocoDirective],
})
export class PickupGuardianMapPage implements OnInit, OnDestroy {
  private readonly locationService = inject(LocationService);
  private readonly guardianService = inject(GuardianService);
  private readonly authService = inject(AuthService);
  private readonly layoutService = inject(LayoutService);

  private map!: L.Map;
  private myLocationMarker!: L.Marker;
  private invalidateSizeTimeoutId?: number;

  private readonly allowedRadius = CAMPUS_MAP_RADIUS;
  guardianSchools = signal<SchoolLocation[]>([]);

  constructor() {
    effect(() => {
      const position = this.locationService.currentPosition();
      if (position[0] !== 0 && position[1] !== 0) {
        this.updateMapLocation(position);
      }
    });
  }

  async ngOnInit() {
    this.layoutService.updateBottomBarVisibility(false);
    await this.getGuardianSchools();
    await this.initMap();
  }

  ngOnDestroy() {
    this.layoutService.updateBottomBarVisibility(true);
    this.cleanup();
  }

  private cleanup() {
    if (this.invalidateSizeTimeoutId !== undefined) {
      try {
        clearTimeout(this.invalidateSizeTimeoutId);
      } catch {}
      this.invalidateSizeTimeoutId = undefined;
    }

    if (this.map) {
      try {
        this.map.remove();
      } catch {}
      // @ts-expect-error explicit reset
      this.map = undefined;
      // @ts-expect-error explicit reset
      this.myLocationMarker = undefined;
    }
  }

  private updateMapLocation(position: [number, number]) {
    const mapAny = this.map as any;
    if (!mapAny || !mapAny._loaded || !mapAny._mapPane) return;

    try {
      if (this.myLocationMarker && (this.myLocationMarker as any)._map) {
        this.myLocationMarker.setLatLng(position);
      }
    } catch {}

    try {
      this.map.setView(position);
    } catch {}
  }

  async getGuardianSchools() {
    return new Promise<void>((resolve, reject) => {
      this.guardianService
        .getGuardian(this.authService.user()?.userTypeId as number)
        .subscribe({
          next: (guardian) => {
            const campuses = guardian.campuses?.map((school) => ({
              id: school.id,
              lat: school.latitude,
              lng: school.longitude,
              displayName: school.displayName,
              radius: this.allowedRadius,
            }));
            this.guardianSchools.set(campuses as SchoolLocation[]);
            resolve();
          },
          error: (error) => {
            reject(error);
          },
        });
    });
  }

  async initMap() {
    const currentPosition = this.locationService.currentPosition();
    this.map = L.map('guardian-fullscreen-map').setView(currentPosition, 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);

    this.invalidateSizeTimeoutId = window.setTimeout(() => {
      try {
        const m: any = this.map as any;
        if (m && m._mapPane) {
          this.map.invalidateSize();
        }
      } catch {}
    }, 0);

    this.guardianSchools().forEach((school: SchoolLocation) => {
      if (!school.lat || !school.lng) {
        return;
      }
      L.circle([school.lat, school.lng], {
        radius: school.radius,
        color: '#FDD835',
        fillColor: '#FFF59D',
        fillOpacity: 0.3,
        weight: 2,
      }).addTo(this.map);

      const schoolIcon = L.divIcon({
        className: 'school-marker',
        html: `
          <div class="school-marker">
            <div class="marker-shape">
              <div class="inner-circle"></div>
            </div>
            <div class="label">${school.displayName}</div>
          </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      L.marker([school.lat, school.lng], {
        icon: schoolIcon,
        draggable: false,
      }).addTo(this.map);
    });

    const myLocationIcon = L.divIcon({
      className: 'my-location-marker',
      html: `
        <div class="pulse-wrapper">
          <div class="pulse"></div>
          <div class="marker"></div>
        </div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    this.myLocationMarker = L.marker(currentPosition, {
      icon: myLocationIcon,
      draggable: false,
    }).addTo(this.map);
  }
}
