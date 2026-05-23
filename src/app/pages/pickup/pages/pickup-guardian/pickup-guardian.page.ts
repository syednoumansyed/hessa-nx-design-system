import {
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
  computed,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  effect,
} from '@angular/core';
import { Router } from '@angular/router';
import { IonSpinner } from '@ionic/angular/standalone';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { DateSliderComponent } from '@shared/components/date-slider/date-slider.component';
import { GuardianStudentRequestCardComponent } from '@pages/pickup/components/guardian-student-request-card/guardian-student-request-card.component';
import { format, startOfMonth, subMonths } from 'date-fns';
import { PickupService } from '@pages/pickup/data-access/pickup.service';
import {
  PickupResponse,
  SchoolLocation,
  GuardianPickupEmitPayload,
  GuardianPickupReceivePayload,
} from '@shared/dto-transformation/pick-up/pickup.interface';
import { isRtl } from '@shared/utils/platform';
import { CommonModule } from '@angular/common';
import { PickupRequestStatus } from '@shared/enums';
import { SocketService } from '@shared/services/socket.service';
import {
  CAMPUS_MAP_RADIUS,
  SOCKET_EVENTS,
} from '@pages/pickup/constants/pickup.constant';
import { DsModalService } from '@ds/modal/modal.service';
import { ProfilePromptComponent } from '@pages/pickup/components/profile-prompt/profile-prompt.component';
import { lastValueFrom } from 'rxjs';
import { updatePickupStatus } from '@pages/pickup/utils/pickup-update.util';
import { HesIconComponent } from '@shared/components/hes-icon/hes-icon.component';
import { DsButtonComponent } from 'src/app/design-system/button/button.component';
import { DsIconComponent } from 'src/app/design-system/icon/icon.component';
import { faMaximize } from '@fortawesome/pro-solid-svg-icons';
import { LocationService } from '@shared/services/location.service';
import { AuthService } from '@auth/auth.service';
import { GuardianService } from '@pages/user-management/guardians/guardians.service';
import * as L from 'leaflet';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';

@Component({
  selector: 'app-pickup-guardian',
  templateUrl: './pickup-guardian.page.html',
  styleUrls: ['./pickup-guardian.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    DateSliderComponent,
    GuardianStudentRequestCardComponent,
    HesIconComponent,
    DsButtonComponent,
    IonSpinner,
    DsIconComponent,
  ],
})
export class PickupGuardianPage implements OnInit, OnDestroy {
  @ViewChild('scrollContainer', { static: false })
  scrollContainer!: ElementRef<HTMLDivElement>;

  readonly faMaximize = faMaximize;
  readonly scanPermission =
    RESOURCE_PERMISSION.DISMISSAL.UPDATE.PROCESS_PICKUP_REQUEST;

  currentLang: string = '';
  isRtl = isRtl();

  private readonly cd = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly socketService = inject(SocketService);
  private readonly pickupService = inject(PickupService);
  private readonly translocoService = inject(TranslocoService);
  private readonly modalService = inject(DsModalService);
  private readonly locationService = inject(LocationService);
  private readonly guardianService = inject(GuardianService);
  private readonly authService = inject(AuthService);

  // Map related properties
  private map!: L.Map;
  private myLocationMarker!: L.Marker;
  private invalidateSizeTimeoutId?: number;
  guardianSchools = signal<SchoolLocation[]>([]);

  sliderStartDate = signal<string>('');
  sliderEndDate = signal<string>('');

  private readonly allowedRadius = CAMPUS_MAP_RADIUS;
  readonly selectedDate = signal<string>('');
  private readonly _pickupList = signal<PickupResponse[]>([]);

  readonly pickupList = computed(() => {
    const pickups = this._pickupList();
    const [lat, lng] = this.locationService.currentPosition();
    // If no pickups, return as-is
    if (!pickups.length) return pickups;

    // If no location, return pickups without radius calculation
    if (!lat || !lng) {
      return pickups.map((pickup) => ({
        ...pickup,
        insidePickupRadius: false,
      }));
    }

    return pickups.map((pickup) => {
      const pickupLocation = {
        lat: pickup.schoolStructure.campus.latitude,
        lng: pickup.schoolStructure.campus.longitude,
      };
      const distance = this.calculateDistance({ lat, lng }, pickupLocation);

      return {
        ...pickup,
        insidePickupRadius: distance <= this.allowedRadius,
      };
    });
  });

  readonly isLoading = signal(false);
  noData = signal<boolean>(false);
  isTodaysDateSelected = computed(() => {
    return this.selectedDate() === format(new Date(), 'yyyy-MM-dd');
  });

  constructor() {
    // Watch for location changes and update map
    effect(() => {
      const position = this.locationService.currentPosition();
      if (position[0] !== 0 && position[1] !== 0) {
        this.updateMapLocation(position);
      }
    });
  }

  expandMap() {
    this.router.navigate(['/pickup/guardian-map']);
  }

  navigateToDelegatePickup() {
    this.router.navigate(['/pickup/delegate-pickup']);
  }

  async ngOnInit() {
    this.socketService.connect();
    this.setSliderDates();

    this.socketService
      .listen(SOCKET_EVENTS.PICKUP_REQUEST_GUARDIAN)
      .subscribe((data) => {
        this.handlePickupSocketReceive(data as GuardianPickupReceivePayload);
      });

    this.socketService
      .listen(SOCKET_EVENTS.PICKUP_REQUEST_ERROR)
      .subscribe(() => {
        this.fetchPickupHistory();
      });

    this.socketService.listen(SOCKET_EVENTS.CONNECT).subscribe(() => {
      this.fetchPickupHistory();
    });

    this.currentLang = this.translocoService.getActiveLang();
    this.selectedDate.set(format(new Date(), 'yyyy-MM-dd'));

    await this.getGuardianSchools();
    await this.initMap();
    await this.fetchPickupHistory();
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
    this.map = L.map('guardian-mini-map').setView(currentPosition, 15);

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

  private calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number },
  ): number {
    const latLng1 = L.latLng(point1.lat, point1.lng);
    const latLng2 = L.latLng(point2.lat, point2.lng);
    const distance = latLng1.distanceTo(latLng2);
    return distance;
  }

  private setSliderDates() {
    const currentDate = new Date();
    const previousMonthStartDate = startOfMonth(subMonths(currentDate, 1));
    this.sliderStartDate.set(format(previousMonthStartDate, 'yyyy-MM-dd'));
    this.sliderEndDate.set(format(currentDate, 'yyyy-MM-dd'));
  }

  handleProfilePromptModal(
    student: PickupResponse,
    status: PickupRequestStatus,
  ) {
    if (status !== PickupRequestStatus.REQUESTED || !student.isAvatar) return;
    setTimeout(() => {
      this.modalService.open({
        component: ProfilePromptComponent,
        componentProps: {
          isRtl: this.isRtl,
          profilePic: student.imageUrl || '',
        },
        headerConfig: {
          showCloseButton: true,
        },
        size: 'sm',
      });
    }, 1000);
  }

  handlePickupSocketReceive(data: GuardianPickupReceivePayload) {
    const currentPickupList = this._pickupList();

    // Find student by studentId or by pickupRequestId
    let student: PickupResponse | undefined;
    if (data.studentId) {
      student = currentPickupList.find(
        (pickup) => pickup.id === data.studentId,
      );
    } else if (data.pickupRequestId) {
      student = currentPickupList.find(
        (pickup) => pickup.pickupRequest?.id === data.pickupRequestId,
      );
    }

    if (!student) return;

    // Update the student's pickup request status
    const updated = updatePickupStatus(student, {
      status: data.status,
      deniedOptionId: data.deniedOptionId ?? null,
    });

    this._pickupList.set(
      currentPickupList.map((s) => (s.id === updated.id ? updated : s)),
    );

    this.cd.detectChanges();
  }

  handleBtnClicked(event: { id: number; status: PickupRequestStatus }) {
    this.updateStudentPickupRequest(event.id, event.status);
  }

  private async fetchPickupHistory(): Promise<void> {
    try {
      this._pickupList.set([]);
      this.isLoading.set(true);
      const res = await lastValueFrom(
        this.pickupService.getGuardianPickupRequests({
          date: this.selectedDate(),
        }),
      );
      this._pickupList.set(res.data);
      this.noData.set(res.data.length === 0);
    } catch (error) {
      this.isLoading.set(false);
      this.noData.set(true);
      this._pickupList.set([]);
    }
  }

  private updateStudentPickupRequest(id: number, status: PickupRequestStatus) {
    const student = this._pickupList().find((s) => s.id === id);
    if (!student) return;
    const updated = updatePickupStatus(student, { status });
    this._pickupList.set(
      this._pickupList().map((s) => (s.id === id ? updated : s)),
    );

    // Emit minimal payload instead of full object
    const emitPayload: GuardianPickupEmitPayload = {
      studentId: id,
      status,
    };
    this.socketService.emit(SOCKET_EVENTS.PICKUP_REQUEST_GUARDIAN, emitPayload);

    this.handleProfilePromptModal(updated, status);
  }

  onDateSelected(selectedDate: string) {
    this.selectedDate.set(selectedDate);
    this.fetchPickupHistory();
  }

  private cleanupMap() {
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

  ngOnDestroy(): void {
    this.socketService.disconnect();
    this.locationService.stopWatching();
    this.cleanupMap();
  }
}
