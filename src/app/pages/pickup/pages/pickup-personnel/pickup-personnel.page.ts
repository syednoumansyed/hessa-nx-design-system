import {
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
  EnvironmentInjector,
} from '@angular/core';
import {
  IonContent,
  IonSpinner,
  ModalController,
} from '@ionic/angular/standalone';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { PickupService } from '@pages/pickup/data-access/pickup.service';
import {
  PersonnelPickupParams,
  PickupResponse,
  PickupTab,
} from '@shared/dto-transformation/pick-up/pickup.interface';
import { isMobile } from '@shared/utils/platform';
import { CommonModule } from '@angular/common';
import { PickupRequestStatus } from '@shared/enums';
import { SocketService } from '@shared/services/socket.service';
import { SOCKET_EVENTS } from '@pages/pickup/constants/pickup.constant';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { RequestTabsComponent } from '@pages/pickup/components/request-tabs/request-tabs.component';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { saxCarOutline } from '@ng-icons/iconsax/outline';
import {
  HesScope,
  NoSelectedScopeCardComponent,
} from '@shared/components/no-selected-scope-card/no-selected-scope-card.component';
import {
  PICK_UP_MAP_FROM_DTO,
  PickupResponseDTO,
} from '@shared/dto-transformation';
import { Router } from '@angular/router';
import { DsButtonComponent } from '@ds/button/button.component';
import { DsIconComponent } from '@ds/icon/icon.component';
import { faQrcode } from '@fortawesome/pro-regular-svg-icons';
import { DelegateScanService } from '@pages/pickup/data-access/delegate-scan.service';
import { QrScannerService } from '@pages/pickup/data-access/qr-scanner.service';
import { openDelegateBottomsheet } from '@pages/pickup/delegate-bottomsheet-modal';
import { DelegateInfo } from '@pages/pickup/data-access/delegate-scan.interface';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { RbacDirective } from '@shared/role-bace-acces-controller/rbac.directive';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';

@Component({
  selector: 'app-pickup-personnel',
  templateUrl: './pickup-personnel.page.html',
  styleUrls: ['./pickup-personnel.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonSpinner,
    TranslocoDirective,
    NgIconComponent,
    RequestTabsComponent,
    NoSelectedScopeCardComponent,
    // Add DS button for floating action button
    DsButtonComponent,
    DsIconComponent,
    RbacDirective,
  ],
  viewProviders: [provideIcons({ saxCarOutline })],
})
export class PickupPersonnelPage implements OnInit, OnDestroy {
  readonly requiredScopes: Array<HesScope> = ['campus-or-school'];
  currentLang: string = '';
  readonly isMobile = isMobile();

  private pickupService = inject(PickupService);
  private translocoService = inject(TranslocoService);
  private readonly hesTranslateService = inject(HesTranslateService);
  private readonly socketService = inject(SocketService);
  private readonly schoolStructureScopeService = inject(
    SchoolStructureScopeService,
  );
  private readonly router = inject(Router);
  private readonly modalCtrl = inject(ModalController);
  private readonly delegateScanService = inject(DelegateScanService);
  private readonly qrScannerService = inject(QrScannerService);
  private readonly toaster = inject(HesToasterService);
  private readonly injector = inject(EnvironmentInjector);

  qrcodeIcon = faQrcode;

  activeTabValue = signal<PickupRequestStatus>(PickupRequestStatus.ALL);
  displayContent = signal(false);
  pickupList = signal<PickupResponse[]>([]);
  filteredPickupList = signal<PickupResponse[]>([]);
  tabsData = signal<PickupTab[]>([]);
  readonly isLoading = signal(false);
  readonly isScanning = signal(false);

  // readonly scanPermission =
  //   RESOURCE_PERMISSION.DISMISSAL.UPDATE.UPDATE_DISMISSAL;

  // Track last invalid QR to prevent rapid-fire error messages
  private lastInvalidQrCode: string | null = null;
  private lastInvalidQrTimestamp: number = 0;
  private readonly INVALID_QR_COOLDOWN_MS = 3000; // 3 seconds cooldown

  constructor() {}

  ngOnInit(): void {
    this.socketService.connect();
    this.createTabsData();
    this.socketService
      .listen(SOCKET_EVENTS.PICKUP_REQUEST_PERSONNEL)
      .subscribe((data) => {
        this.handlePickupSocketEvent(
          PICK_UP_MAP_FROM_DTO.pickup(data as PickupResponseDTO),
        );
      });
    this.socketService.listen(SOCKET_EVENTS.CONNECT).subscribe(() => {
      this.fetchPickupHistory();
    });
    this.currentLang = this.translocoService.getActiveLang();
    this.fetchPickupHistory();
  }

  async ionViewWillEnter(): Promise<void> {
    const pendingDelegate = this.delegateScanService.pendingDelegateInfo();
    if (pendingDelegate) {
      this.delegateScanService.clearPendingDelegate();
      await this.openDelegateBottomsheet(pendingDelegate);
    }
  }

  private async openDelegateBottomsheet(
    delegateInfo: DelegateInfo,
  ): Promise<void> {
    const result = await openDelegateBottomsheet({
      modalCtrl: this.modalCtrl,
      delegateInfo,
      injector: this.injector,
    });

    if (result === 'scan_again') {
      // Start scanning directly instead of navigating to camera permission error page
      await this.startQrScan();
    }
  }

  handlePickupSocketEvent(data: PickupResponse) {
    if (
      (this.schoolStructureScopeService.selectedCampusId() &&
        data.schoolStructure.campus.id !==
          this.schoolStructureScopeService.selectedCampusId()) ||
      (this.schoolStructureScopeService.selectedSchoolId() &&
        data.schoolStructure.school.id !==
          this.schoolStructureScopeService.selectedSchoolId())
    ) {
      return;
    }
    const newPickupList = this.pickupList();
    const index = newPickupList.findIndex((pickup) => pickup.id === data.id);
    if (index > -1) {
      newPickupList[index] = data;
    } else {
      newPickupList.unshift(data);
    }
    this.pickupList.set(newPickupList);

    const activeTab = this.activeTabValue();
    const newFilteredPickupList = this.filteredPickupList();
    const filteredIndex = newFilteredPickupList.findIndex(
      (pickup) => pickup.id === data.id,
    );

    if (activeTab === PickupRequestStatus.ALL) {
      if (filteredIndex > -1) {
        newFilteredPickupList[filteredIndex] = data;
      } else {
        newFilteredPickupList.unshift(data);
      }
    } else {
      if (data.pickupRequest?.status === activeTab) {
        if (filteredIndex > -1) {
          newFilteredPickupList[filteredIndex] = data;
        } else {
          newFilteredPickupList.unshift(data);
        }
      } else if (filteredIndex > -1) {
        newFilteredPickupList.splice(filteredIndex, 1);
      }
    }

    this.filteredPickupList.set(newFilteredPickupList);
    this.createTabsData();
  }

  handleDisplayContent(v: boolean) {
    this.displayContent.set(v);
    if (v) {
      this.fetchPickupHistory();
    }
  }

  onTabChange(pickupRequestStatus: PickupRequestStatus) {
    this.activeTabValue.set(pickupRequestStatus);
    if (pickupRequestStatus === PickupRequestStatus.ALL) {
      this.filteredPickupList.set(this.pickupList());
      return;
    }
    this.filteredPickupList.set(
      this.pickupList().filter(
        (student) => student.pickupRequest?.status === pickupRequestStatus,
      ),
    );
  }

  onAction(data: PickupResponse) {
    this.handlePickupSocketEvent(data);
    // Emit minimal payload instead of full object
    this.socketService.emit(SOCKET_EVENTS.PICKUP_REQUEST_PERSONNEL, {
      studentId: data.id,
      pickupRequestId: data.pickupRequest?.id ?? null,
      status: data.pickupRequest?.status,
    });
  }

  private fetchPickupHistory() {
    if (
      !this.schoolStructureScopeService.selectedCampusId() &&
      !this.schoolStructureScopeService.selectedSchoolId()
    ) {
      return;
    }
    const params: PersonnelPickupParams = {};
    if (this.schoolStructureScopeService.selectedCampusId()) {
      params.campusIds = [this.schoolStructureScopeService.selectedCampusId()!];
    }
    if (this.schoolStructureScopeService.selectedSchoolId()) {
      params.schoolIds = [this.schoolStructureScopeService.selectedSchoolId()!];
    }

    this.socketService.emit(
      SOCKET_EVENTS.PICKUP_REQUEST_ASSOCIATION_PERSONNEL,
      {
        campusId: this.schoolStructureScopeService.selectedCampusId() || null,
        schoolId: this.schoolStructureScopeService.selectedSchoolId() || null,
      },
    );

    this.isLoading.set(true);
    this.pickupService.getPersonnelPickupRequests(params).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.pickupList.set(res);
        this.onTabChange(this.activeTabValue());
        this.createTabsData();
      },
      error: () => {
        this.isLoading.set(false);
        this.pickupList.set([]);
        this.filteredPickupList.set([]);
        this.createTabsData();
      },
    });
  }

  private createTabsData() {
    const tabs = [
      {
        id: PickupRequestStatus.ALL,
        label: this.hesTranslateService.t('global.all.txt'),
        count: this.pickupList().length,
      },
      {
        id: PickupRequestStatus.REQUESTED,
        label: this.hesTranslateService.t('dismissal.pickup_status_new.title'),
        count: this.pickupList().filter(
          (student) =>
            student.pickupRequest?.status === PickupRequestStatus.REQUESTED,
        ).length,
      },
      {
        id: PickupRequestStatus.IN_PROCESS,
        label: this.hesTranslateService.t(
          'dismissal.pickup_status_in_process.title',
        ),
        count: this.pickupList().filter(
          (student) =>
            student.pickupRequest?.status === PickupRequestStatus.IN_PROCESS,
        ).length,
      },
      {
        id: PickupRequestStatus.LEFT_SCHOOL,
        label: this.hesTranslateService.t(
          'dismissal.picku_status_left_school.title',
        ),
        count: this.pickupList().filter(
          (student) =>
            student.pickupRequest?.status === PickupRequestStatus.LEFT_SCHOOL,
        ).length,
      },
      {
        id: PickupRequestStatus.DENIED,
        label: this.hesTranslateService.t(
          'dismissal.pickup_status_denied.title',
        ),
        count: this.pickupList().filter(
          (student) =>
            student.pickupRequest?.status === PickupRequestStatus.DENIED,
        ).length,
      },
      {
        id: PickupRequestStatus.PICKED,
        label: this.hesTranslateService.t('dismissal.picked_status.title'),
        count: this.pickupList().filter(
          (student) =>
            student.pickupRequest?.status === PickupRequestStatus.PICKED,
        ).length,
      },
    ];
    this.tabsData.set(tabs);
  }

  ngOnDestroy(): void {
    this.socketService.disconnect();
    this.qrScannerService.resetState();
    this.resetInvalidQrTracking();
  }

  /**
   * Start QR scanning directly from personnel page.
   * Only navigates to camera permission error page if there's a permission issue.
   */
  async startQrScan(): Promise<void> {
    this.isScanning.set(true);

    try {
      const result = await this.qrScannerService.scanQrCode();

      if (result?.value) {
        await this.handleScanResult(result.value);
      }
      // If no result (user cancelled), just stay on this page
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '';

      // Check for user cancellation - just stay on page
      if (
        errorMsg.toLowerCase().includes('cancel') ||
        errorMsg.toLowerCase().includes('user')
      ) {
        return;
      }

      // Check for permission denied - navigate to camera permission error page
      if (
        errorMsg.toLowerCase().includes('permission') ||
        errorMsg.toLowerCase().includes('denied')
      ) {
        this.router.navigate(['/pickup/camera-permission-error']);
        return;
      }

      // Other errors - show toast and stay on page
      this.toaster.error(
        this.translocoService.translate('global.errors_detected.txt'),
      );
    } finally {
      this.isScanning.set(false);
    }
  }

  private async handleScanResult(scannedValue: string): Promise<void> {
    // Parse the QR URL to extract delegator information
    const parsedData = this.delegateScanService.parseQrUrl(scannedValue);

    if (!parsedData) {
      // Invalid QR format - show error if not in cooldown
      if (this.shouldShowInvalidQrError(scannedValue)) {
        this.showInvalidQrToast();
        this.trackInvalidQr(scannedValue);
      }
      return;
    }

    // Valid QR format - reset invalid QR tracking
    this.resetInvalidQrTracking();

    // Check if QR code has expired
    if (this.delegateScanService.isQrExpired(parsedData.expiry)) {
      if (this.shouldShowInvalidQrError(scannedValue)) {
        const expiryDate = new Date(parsedData.expiry).toLocaleDateString();
        this.toaster.error(
          this.translocoService.translate(
            'general.qr_expired_on_with_date.lbl',
            {
              date: expiryDate,
            },
          ),
          this.translocoService.translate('general.qr_code_invalid.title'),
        );
        this.trackInvalidQr(scannedValue);
      }
      return;
    }

    this.isScanning.set(true);

    try {
      // Call the scan API - it returns DelegateInfo on success or throws on error
      const delegateInfo = await this.delegateScanService.scanDelegator(
        parsedData.delegatorId,
      );

      // Success - open the delegate bottom sheet directly
      await this.openDelegateBottomsheet(delegateInfo);
    } catch (error) {
      // Error already handled in service with toast message
      // Stay on this page
    } finally {
      this.isScanning.set(false);
    }
  }

  private showInvalidQrToast(): void {
    this.toaster.error(
      this.translocoService.translate('general.qr_code_invalid.txt'),
      this.translocoService.translate('general.qr_code_invalid.title'),
    );
  }

  /**
   * Check if we should show an error for this invalid QR code.
   * Returns false if the same QR was scanned within the cooldown period.
   */
  private shouldShowInvalidQrError(scannedValue: string): boolean {
    const now = Date.now();
    const isSameQr = this.lastInvalidQrCode === scannedValue;
    const isWithinCooldown =
      now - this.lastInvalidQrTimestamp < this.INVALID_QR_COOLDOWN_MS;

    return !isSameQr || !isWithinCooldown;
  }

  /**
   * Track an invalid QR code to prevent showing repeated errors
   */
  private trackInvalidQr(scannedValue: string): void {
    this.lastInvalidQrCode = scannedValue;
    this.lastInvalidQrTimestamp = Date.now();
  }

  /**
   * Reset invalid QR tracking
   */
  private resetInvalidQrTracking(): void {
    this.lastInvalidQrCode = null;
    this.lastInvalidQrTimestamp = 0;
  }
}
