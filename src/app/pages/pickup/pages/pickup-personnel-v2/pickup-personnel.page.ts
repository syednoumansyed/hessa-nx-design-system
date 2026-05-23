import {
  Component,
  computed,
  effect,
  EnvironmentInjector,
  inject,
  OnDestroy,
  OnInit,
  signal,
  Type,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, ModalController } from '@ionic/angular/standalone';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { DsTabsWithSwipeComponent, Tab } from '@ds/tabs';
import { PickupPersonnelType, PickupRequestStatus } from '@shared/enums';
import { updatePickupStatus } from '@pages/pickup/utils/pickup-update.util';

interface PersonnelSocketPayload {
  studentId: number;
  pickupRequestId: number;
  status: PickupRequestStatus;
  createdAt: string;
}
import { PickupService } from '@pages/pickup/data-access/pickup.service';
import {
  DenialReason,
  PersonnelPickupParams,
  PickupResponse,
} from '@shared/dto-transformation/pick-up/pickup.interface';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { RbacDirective } from '@shared/role-bace-acces-controller/rbac.directive';
import { PickupPersonnelCardSkeletonComponent } from '@pages/pickup/components/pickup-personnel-card-skeleton/pickup-personnel-card-skeleton.component';
import { PickupPersonnelCardComponent } from '@pages/pickup/components/pickup-personnel-card/pickup-personnel-card.component';
import { DsCheckboxComponent } from '@ds/checkbox/checkbox.component';
import { DsButtonComponent } from '@ds/button/button.component';
import {
  HesScope,
  NoSelectedScopeCardComponent,
} from '@shared/components/no-selected-scope-card/no-selected-scope-card.component';
import { faCheck, faXmark } from '@fortawesome/pro-solid-svg-icons';
import { faQrcode } from '@fortawesome/pro-regular-svg-icons';
import { DelegateScanService } from '@pages/pickup/data-access/delegate-scan.service';
import { DelegateInfo } from '@pages/pickup/data-access/delegate-scan.interface';
import { openDelegateBottomsheet } from '@pages/pickup/delegate-bottomsheet-modal';
import { LayoutService } from '@layout/layout.service';
import { QrScannerService } from '@pages/pickup/data-access/qr-scanner.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { DsModalService } from '@ds/modal/modal.service';
import { DenialReasonSelectionComponent } from '@pages/pickup/components/denial-reason-selection/denial-reason-selection.component';
import { SocketService } from '@shared/services/socket.service';
import { SOCKET_EVENTS } from '@pages/pickup/constants/pickup.constant';
import { openPickupTimelineModal } from '@pages/pickup/pickup-timeline-modal';
import { format } from 'date-fns';
import { DsFilterPanelComponent } from '@ds/filter-panel/ds-filter-panel.component';
import {
  DsFilterConfig,
  DsFiltersValue,
} from '@ds/filter-panel/ds-filter-panel.model';

@Component({
  selector: 'app-pickup-personnel-v2',
  templateUrl: './pickup-personnel.page.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    TranslocoDirective,
    DsTabsWithSwipeComponent,
    PickupPersonnelCardComponent,
    DsCheckboxComponent,
    DsButtonComponent,
    NoSelectedScopeCardComponent,
    DsFilterPanelComponent,
    RbacDirective,
  ],
})
export class PickupPersonnelV2Page implements OnInit, OnDestroy {
  private readonly translocoService = inject(TranslocoService);
  private readonly layoutService = inject(LayoutService);
  private readonly modalService = inject(DsModalService);
  private readonly socketService = inject(SocketService);
  private readonly pickupService = inject(PickupService);
  private readonly schoolStructureScopeService = inject(
    SchoolStructureScopeService,
  );
  private readonly rbacService = inject(RoleBaseAccessControlService);
  private readonly router = inject(Router);
  private readonly modalCtrl = inject(ModalController);
  private readonly delegateScanService = inject(DelegateScanService);
  private readonly injector = inject(EnvironmentInjector);
  private readonly qrScannerService = inject(QrScannerService);
  private readonly toaster = inject(HesToasterService);

  // Determine if this is the history view based on the route
  readonly isHistory = computed(() => {
    const url = this.router.url;
    return url.includes('personnel-history');
  });

  // Icons
  readonly checkIcon = faCheck;
  readonly xmarkIcon = faXmark;
  readonly qrcodeIcon = faQrcode;

  readonly isMobileOrTablet = this.layoutService.isMobileOrTablet;

  readonly scanPermission =
    RESOURCE_PERMISSION.DISMISSAL.UPDATE.PROCESS_PICKUP_REQUEST;

  // Filter panel configuration
  // Pre-select today's date for history view
  filterPanelSelection = signal<DsFiltersValue>(
    this.router.url.includes('personnel-history') ? { date: new Date() } : {},
  );
  filterPanelFilters = computed<DsFilterConfig[]>(() => {
    const filters: DsFilterConfig[] = [
      {
        type: 'search',
        key: 'searchText',
        label: '',
        placeholder: this.translocoService.translate(
          'content_management.search_by_name.placeholder',
        ),
        exposed: true,
      },
    ];

    // Add date filter for history view
    if (this.isHistory()) {
      filters.push({
        type: 'date',
        key: 'date',
        label: this.translocoService.translate(
          'global.select_date.placeholder',
        ),
        placeholder: this.translocoService.translate(
          'global.select_date.placeholder',
        ),
        exposed: true,
      });
    }

    return filters;
  });

  onFilterPanelChange(filters: DsFiltersValue): void {
    const previousDate = this.filterPanelSelection()['date'];
    this.filterPanelSelection.set(filters);

    // Re-fetch data when date filter changes in history mode
    if (this.isHistory() && filters['date'] !== previousDate) {
      this.fetchPickupHistory();
    }
  }

  // Required scopes for displaying content
  readonly requiredScopes: Array<HesScope> = ['campus-or-school'];
  displayContent = signal(false);

  // Default to REQUESTED for history view, ALL for regular view
  activeTabId = signal<PickupRequestStatus>(
    this.router.url.includes('personnel-history')
      ? PickupRequestStatus.REQUESTED
      : PickupRequestStatus.ALL,
  );

  // Permission flags
  readonly canApproveDeny = this.rbacService.hasPermission(
    RESOURCE_PERMISSION.DISMISSAL.UPDATE.APPROVE_DENY_PICKUP_REQUEST,
  );
  readonly canProcessPickup = this.rbacService.hasPermission(
    RESOURCE_PERMISSION.DISMISSAL.UPDATE.PROCESS_PICKUP_REQUEST,
  );

  // Personnel type - determined by permissions
  personnelType = signal<PickupPersonnelType>(this.getPersonnelType());

  private getPersonnelType(): PickupPersonnelType {
    if (this.canApproveDeny && this.canProcessPickup) {
      return PickupPersonnelType.ADMIN_GUARD;
    }
    if (this.canApproveDeny) {
      return PickupPersonnelType.ADMIN;
    }
    return PickupPersonnelType.GUARD;
  }

  // Selection state - stores selected request IDs
  selectedRequestIds = signal<Set<number>>(new Set());

  // Loading state
  isLoading = signal(false);

  // Scanning state
  readonly isScanning = signal(false);

  // Track last invalid QR to prevent rapid-fire error messages
  private lastInvalidQrCode: string | null = null;
  private lastInvalidQrTimestamp: number = 0;
  private readonly INVALID_QR_COOLDOWN_MS = 3000; // 3 seconds cooldown

  // Computed: Should show checkboxes (admin or admin_guard + requested tab, not in history view)
  showCheckboxes = computed(() => {
    if (this.isHistory()) return false;

    const type = this.personnelType();
    return (
      (type === PickupPersonnelType.ADMIN ||
        type === PickupPersonnelType.ADMIN_GUARD) &&
      this.activeTabId() === PickupRequestStatus.REQUESTED
    );
  });

  // Computed: Check if all filtered requests are selected
  isAllSelected = computed(() => {
    const filtered = this.filteredPickupRequests();
    if (filtered.length === 0) return false;
    return filtered.every((req) => this.selectedRequestIds().has(req.id));
  });

  // Computed: Check if some (but not all) are selected (for indeterminate state)
  isSomeSelected = computed(() => {
    const filtered = this.filteredPickupRequests();
    const selected = this.selectedRequestIds();
    const selectedCount = filtered.filter((req) => selected.has(req.id)).length;
    return selectedCount > 0 && selectedCount < filtered.length;
  });

  // Computed: Count of selected items
  selectedCount = computed(() => {
    const filtered = this.filteredPickupRequests();
    return filtered.filter((req) => this.selectedRequestIds().has(req.id))
      .length;
  });

  // Computed: Has any selection
  hasSelection = computed(() => this.selectedCount() > 0);

  // Effect to hide bottom bar when items are selected (bulk action footer is shown)
  private selectionEffect = effect(() => {
    const hasSelection = this.hasSelection();
    // Hide bottom navigation bar when selection is active (bulk action footer is shown)
    this.layoutService.updateBottomBarVisibility(!hasSelection);
  });

  // Skeleton component for tabs swipe animation
  skeletonComponent: Type<unknown> = PickupPersonnelCardSkeletonComponent;

  // Pickup requests data from API
  pickupRequests = signal<PickupResponse[]>([]);

  // Cached denial reasons
  denialReasons = signal<DenialReason[]>([]);

  // Filtered pickup requests based on active tab and search text
  filteredPickupRequests = computed(() => {
    const activeTab = this.activeTabId();
    const allRequests = this.pickupRequests();
    const searchText = (
      this.filterPanelSelection()['searchText'] as string | null
    )
      ?.trim()
      .toLowerCase();

    // First filter by tab status
    let filtered = allRequests;
    if (activeTab !== PickupRequestStatus.ALL) {
      // PROCESSED tab combines LEFT_SCHOOL and PICKED statuses
      if (activeTab === PickupRequestStatus.PROCESSED) {
        filtered = filtered.filter(
          (request) =>
            request.pickupRequest?.status === PickupRequestStatus.LEFT_SCHOOL ||
            request.pickupRequest?.status === PickupRequestStatus.PICKED,
        );
      } else {
        filtered = filtered.filter(
          (request) => request.pickupRequest?.status === activeTab,
        );
      }
    }

    // Then filter by search text (student name)
    if (searchText) {
      filtered = filtered.filter((request) =>
        request.displayName.toLowerCase().includes(searchText),
      );
    }

    return filtered;
  });

  // Helper to get count for a specific status
  private getCountForStatus(status: PickupRequestStatus): number {
    const allRequests = this.pickupRequests();
    if (status === PickupRequestStatus.ALL) {
      return allRequests.length;
    }
    // PROCESSED tab combines LEFT_SCHOOL and PICKED statuses
    if (status === PickupRequestStatus.PROCESSED) {
      return allRequests.filter(
        (request) =>
          request.pickupRequest?.status === PickupRequestStatus.LEFT_SCHOOL ||
          request.pickupRequest?.status === PickupRequestStatus.PICKED,
      ).length;
    }
    return allRequests.filter(
      (request) => request.pickupRequest?.status === status,
    ).length;
  }

  // Helper to get translated label with count
  private getTabLabel(
    translationKey: string,
    status: PickupRequestStatus,
  ): string {
    const translatedText = this.translocoService.translate(translationKey);
    const count = this.getCountForStatus(status);
    return `${translatedText} (${count})`;
  }

  // Tabs data with dynamic counts
  // Order: All (not shown in history), Requested, In Progress, Processed (LEFT_SCHOOL + PICKED), Declined
  tabsData = computed<Tab<PickupRequestStatus>[]>(() => {
    const tabs: Tab<PickupRequestStatus>[] = [];

    // Only show "All" tab when not in history view
    if (!this.isHistory()) {
      tabs.push({
        id: PickupRequestStatus.ALL,
        label: this.getTabLabel('global.all.txt', PickupRequestStatus.ALL),
      });
    }

    tabs.push(
      {
        id: PickupRequestStatus.REQUESTED,
        label: this.getTabLabel(
          'dismissal.pickup_status_new.title',
          PickupRequestStatus.REQUESTED,
        ),
      },
      {
        id: PickupRequestStatus.IN_PROCESS,
        label: this.getTabLabel(
          'dismissal.pickup_status_in_process.title',
          PickupRequestStatus.IN_PROCESS,
        ),
      },
      {
        id: PickupRequestStatus.PROCESSED,
        label: this.getTabLabel(
          'dismissal.pickup_status_processed.title',
          PickupRequestStatus.PROCESSED,
        ),
      },
      {
        id: PickupRequestStatus.DENIED,
        label: this.getTabLabel(
          'dismissal.pickup_status_denied.title',
          PickupRequestStatus.DENIED,
        ),
      },
    );

    return tabs;
  });

  onTabChange(tabId: PickupRequestStatus): void {
    this.activeTabId.set(tabId);
    // Clear selection when changing tabs
    this.clearSelection();
  }

  handleDisplayContent(v: boolean): void {
    this.displayContent.set(v);
    if (v) {
      this.fetchPickupHistory();
    }
  }

  onAccept(data: PickupResponse): void {
    if (data.pickupRequest?.id) {
      // Emit accept event via socket
      this.socketService.emit(SOCKET_EVENTS.PICKUP_REQUEST_PERSONNEL, {
        pickupRequestId: data.pickupRequest.id,
        status: PickupRequestStatus.IN_PROCESS,
      });

      // Optimistically update local state
      const updatedData = updatePickupStatus(data, {
        status: PickupRequestStatus.IN_PROCESS,
      });
      this.updateLocalRequest(updatedData);
    }
  }

  async onDecline(data: PickupResponse): Promise<void> {
    const denialReasonId = await this.openDenialReasonModal();
    if (denialReasonId && data.pickupRequest?.id) {
      // Emit denial event via socket
      this.socketService.emit(SOCKET_EVENTS.PICKUP_REQUEST_PERSONNEL, {
        pickupRequestId: data.pickupRequest.id,
        status: PickupRequestStatus.DENIED,
        deniedOptionId: denialReasonId,
      });

      // Optimistically update local state
      const updatedData = updatePickupStatus(data, {
        status: PickupRequestStatus.DENIED,
        deniedOptionId: denialReasonId,
      });
      this.updateLocalRequest(updatedData);
    }
  }

  onLeftSchool(data: PickupResponse): void {
    if (data.pickupRequest?.id) {
      // Emit left school event via socket
      this.socketService.emit(SOCKET_EVENTS.PICKUP_REQUEST_PERSONNEL, {
        pickupRequestId: data.pickupRequest.id,
        status: PickupRequestStatus.LEFT_SCHOOL,
      });

      // Optimistically update local state
      const updatedData = updatePickupStatus(data, {
        status: PickupRequestStatus.LEFT_SCHOOL,
      });
      this.updateLocalRequest(updatedData);
    }
  }

  onTimelineClick(timelineId: number): void {
    openPickupTimelineModal({
      modalService: this.modalService,
      translocoService: this.translocoService,
      timelineId,
    });
  }

  private async openDenialReasonModal(): Promise<number | undefined> {
    const modalRef = await this.modalService.open<unknown, number>({
      component: DenialReasonSelectionComponent,
      headerConfig: {
        title: this.translocoService.translate(
          'dismissal.select_denial_reason.txt',
        ),
        showCloseButton: true,
      },
      footerConfig: {
        primaryButton: {
          text: this.translocoService.translate('global.submit.btn'),
        },
        secondaryButton: {
          text: this.translocoService.translate('global.cancel.btn'),
        },
      },
      size: 'sm',
    });

    const result = await modalRef.onDismiss();
    if (result.role === 'confirm' && result.data) {
      return result.data;
    }
    return undefined;
  }

  // Selection methods
  isSelected(requestId: number): boolean {
    return this.selectedRequestIds().has(requestId);
  }

  toggleSelection(requestId: number): void {
    const current = new Set(this.selectedRequestIds());
    if (current.has(requestId)) {
      current.delete(requestId);
    } else {
      current.add(requestId);
    }
    this.selectedRequestIds.set(current);
  }

  toggleSelectAll(): void {
    const filtered = this.filteredPickupRequests();
    if (this.isAllSelected()) {
      // Deselect all
      this.clearSelection();
    } else {
      // Select all filtered requests
      const newSelection = new Set(filtered.map((req) => req.id));
      this.selectedRequestIds.set(newSelection);
    }
  }

  clearSelection(): void {
    this.selectedRequestIds.set(new Set());
  }

  // Bulk actions
  onBulkAccept(): void {
    this.processBulkAction(PickupRequestStatus.IN_PROCESS);
  }

  async onBulkDecline(): Promise<void> {
    const denialReasonId = await this.openDenialReasonModal();
    if (denialReasonId) {
      this.processBulkAction(PickupRequestStatus.DENIED, denialReasonId);
    }
  }

  private processBulkAction(
    status: PickupRequestStatus,
    deniedOptionId?: number,
  ): void {
    const selectedStudentIds = Array.from(this.selectedRequestIds());
    const allRequests = this.pickupRequests();

    // Build array of payloads for selected requests
    const payloads = selectedStudentIds
      .map((studentId) => {
        const request = allRequests.find((r) => r.id === studentId);
        if (request?.pickupRequest?.id) {
          return {
            pickupRequestId: request.pickupRequest.id,
            status,
            ...(deniedOptionId && { deniedOptionId }),
          };
        }
        return null;
      })
      .filter((p) => p !== null);

    if (payloads.length > 0) {
      // Emit bulk action event via socket
      this.socketService.emit(SOCKET_EVENTS.PICKUP_REQUEST_PERSONNEL, payloads);

      // Optimistically update local state for all selected
      selectedStudentIds.forEach((studentId) => {
        const request = allRequests.find((r) => r.id === studentId);
        if (request) {
          const updatedData = updatePickupStatus(request, {
            status,
            ...(deniedOptionId && { deniedOptionId }),
          });
          this.updateLocalRequest(updatedData);
        }
      });
    }

    this.clearSelection();
  }

  ngOnInit(): void {
    // Only connect to socket and set up listeners when not in History mode
    if (!this.isHistory()) {
      this.socketService.connect();
      this.socketService
        .listen<PersonnelSocketPayload>(SOCKET_EVENTS.PICKUP_REQUEST_PERSONNEL)
        .subscribe((data) => {
          console.log('Pickup Personnel Socket event received:', data);
          this.handleSocketEvent(data);
        });
      this.socketService.listen(SOCKET_EVENTS.CONNECT).subscribe(() => {
        console.log('Pickup Personnel Socket connected');
        this.fetchPickupHistory();
      });
    }

    // Show selected school info in header when visiting this page
    this.layoutService.updateSelectedSchoolInfoVisibility(true);

    // Fetch pickup history if school structure is already selected
    this.fetchPickupHistory();

    // Pre-fetch and cache denial reasons
    this.pickupService.getDenialReasons().subscribe((reasons) => {
      this.denialReasons.set(reasons);
    });
  }

  private fetchPickupHistory(): void {
    // Only fetch if campus or school is selected
    if (
      !this.schoolStructureScopeService.selectedCampusId() &&
      !this.schoolStructureScopeService.selectedSchoolId()
    ) {
      console.log('No campus or school selected, skipping fetch');
      return;
    }

    // Use the date from filter panel if in history mode, otherwise use today's date
    const filterDate = this.filterPanelSelection()['date'] as Date | null;
    const dateToUse = filterDate || new Date();

    const params: PersonnelPickupParams = {
      paginate: false,
      date: format(dateToUse, 'yyyy-MM-dd'),
    };
    if (this.schoolStructureScopeService.selectedCampusId()) {
      params.campusIds = [this.schoolStructureScopeService.selectedCampusId()!];
    }
    if (this.schoolStructureScopeService.selectedSchoolId()) {
      params.schoolIds = [this.schoolStructureScopeService.selectedSchoolId()!];
    }

    console.log({
      campusId: this.schoolStructureScopeService.selectedCampusId() || null,
      schoolId: this.schoolStructureScopeService.selectedSchoolId() || null,
    });

    // Emit socket association event only when not in History mode
    if (!this.isHistory()) {
      this.socketService.emit(
        SOCKET_EVENTS.PICKUP_REQUEST_ASSOCIATION_PERSONNEL,
        {
          campusId: this.schoolStructureScopeService.selectedCampusId() || null,
          schoolId: this.schoolStructureScopeService.selectedSchoolId() || null,
        },
      );
    }

    // Fetch pickup requests
    this.isLoading.set(true);
    this.pickupService.getPersonnelPickupRequests(params).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.pickupRequests.set(res);
        console.log('res', res);
      },
      error: (err) => {
        console.error('Error fetching personnel pickup requests:', err);
        this.isLoading.set(false);
        this.pickupRequests.set([]);
      },
    });
  }

  private handleSocketEvent(payload: PersonnelSocketPayload): void {
    const { studentId, pickupRequestId, status } = payload;

    if (status === PickupRequestStatus.REQUESTED) {
      this.handleRequestedStatus(studentId, pickupRequestId);
    } else {
      // For other statuses, update the existing request
      this.updateExistingRequest(studentId, pickupRequestId, status);
    }
  }

  private handleRequestedStatus(
    studentId: number,
    pickupRequestId: number,
  ): void {
    const currentRequests = this.pickupRequests();

    // Check if we already have this student in our list
    const existingIndex = currentRequests.findIndex(
      (req) => req.id === studentId,
    );

    if (existingIndex !== -1) {
      // Student exists - this is a re-request after denial
      // Update the existing request with the new pickupRequestId and REQUESTED status
      const existingRequest = currentRequests[existingIndex];
      const updatedRequest = updatePickupStatus(existingRequest, {
        status: PickupRequestStatus.REQUESTED,
      });
      // Update the pickupRequest id with the new one
      if (updatedRequest.pickupRequest) {
        updatedRequest.pickupRequest.id = pickupRequestId;
      }

      const updatedRequests = [...currentRequests];
      updatedRequests[existingIndex] = updatedRequest;
      this.pickupRequests.set(updatedRequests);
    } else {
      // New request - fetch the full details from API
      this.fetchSinglePickupRequest(pickupRequestId);
    }
  }

  private updateExistingRequest(
    studentId: number,
    pickupRequestId: number,
    status: PickupRequestStatus,
  ): void {
    const currentRequests = this.pickupRequests();

    // Find by studentId or by pickupRequestId
    const existingIndex = currentRequests.findIndex(
      (req) =>
        req.id === studentId || req.pickupRequest?.id === pickupRequestId,
    );

    if (existingIndex !== -1) {
      const existingRequest = currentRequests[existingIndex];
      const updatedRequest = updatePickupStatus(existingRequest, { status });

      const updatedRequests = [...currentRequests];
      updatedRequests[existingIndex] = updatedRequest;
      this.pickupRequests.set(updatedRequests);
    }
  }

  private updateLocalRequest(updatedData: PickupResponse): void {
    const currentRequests = this.pickupRequests();
    const existingIndex = currentRequests.findIndex(
      (req) => req.id === updatedData.id,
    );

    if (existingIndex !== -1) {
      const updatedRequests = [...currentRequests];
      updatedRequests[existingIndex] = updatedData;
      this.pickupRequests.set(updatedRequests);
    }
  }

  private fetchSinglePickupRequest(pickupRequestId: number): void {
    const params: PersonnelPickupParams = {
      pickupRequestId,
      paginate: false,
    };

    this.pickupService.getPersonnelPickupRequests(params).subscribe({
      next: (res) => {
        if (res.length > 0) {
          // Add the new request to the beginning of the list
          const currentRequests = this.pickupRequests();
          this.pickupRequests.set([res[0], ...currentRequests]);
        }
      },
      error: (err) => {
        console.error('Error fetching single pickup request:', err);
      },
    });
  }

  ngOnDestroy(): void {
    // Hide selected school info when leaving this page
    this.layoutService.updateSelectedSchoolInfoVisibility(false);
    this.qrScannerService.resetState();
    this.resetInvalidQrTracking();
    // Only disconnect socket if not in History mode (socket was never connected in History mode)
    if (!this.isHistory()) {
      this.socketService.disconnect();
    }
  }

  // Ionic lifecycle hook - called when navigating back to this page
  async ionViewWillEnter(): Promise<void> {
    const pendingDelegate = this.delegateScanService.pendingDelegateInfo();
    if (pendingDelegate) {
      this.delegateScanService.clearPendingDelegate();
      await this.openDelegateBottomsheet(pendingDelegate);
    }
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

  // Open delegate bottomsheet modal
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
}
