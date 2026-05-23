import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  ViewChild,
} from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { fromEvent, map, of } from 'rxjs';
import { SupportTicketStatus } from '@shared/enums';
import { DsSelectComponent } from '@ds/select/select.component';
import { DsSelectConfig } from '@ds/select/select.interface';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { DsSchoolStructureControlComponent } from '@ds/school-structure-control/ds-school-structure-control.component';
import { DsSchoolStructureControlValue } from '@ds/school-structure-control/types/school-structure-control.types';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import {
  findAllCampuses,
  findAllCompanies,
  findAllSchools,
} from '@shared/utils/school-structure';
import { SupportHubTicketsService } from '@pages/support-hub/data-access/support-hub-tickets.service';
import { SupportHubEscalationPersonnel } from '@pages/support-hub/data-access/support-hub-escalation-personnel.interface';
import { DsTranslatePipe } from '@ds/i18n/ds-translate.pipe';
import { DsButtonComponent } from '@ds/button/button.component';
import { DsIconComponent } from '@ds/icon/icon.component';
import {
  faAngleLeft,
  faAngleRight,
  faCheck,
} from '@fortawesome/pro-regular-svg-icons';
import { isRtl } from '@shared/utils/platform';
import { LayoutService } from '@layout/layout.service';

export interface SupportHubFiltersChange {
  status: string | null;
  showInitiated: boolean;
  searchText?: string;
  companyIds?: number[];
  schoolIds?: number[];
  campusIds?: number[];
  assignedTo?: number[] | null;
  assignedToLabel?: string | null;
}

type SupportHubTicketView = 'assigned' | 'initiated';

@Component({
  selector: 'app-support-hub-filters',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DsSelectComponent,
    DsSchoolStructureControlComponent,
    DsTranslatePipe,
    DsButtonComponent,
    DsIconComponent,
  ],
  templateUrl: './support-hub-filters.component.html',
})
export class SupportHubFiltersComponent implements AfterViewInit {
  private readonly hesTranslate = inject(HesTranslateService);
  private readonly schoolStructureScope = inject(SchoolStructureScopeService);
  private readonly supportHubTicketsService = inject(SupportHubTicketsService);
  private readonly layoutService = inject(LayoutService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isRtlLayout = isRtl();
  private rtlScrollBehavior: 'negative' | 'positive' | 'reverse' | null = null;

  @ViewChild('filtersScroller')
  private readonly filtersScroller?: ElementRef<HTMLDivElement>;
  @ViewChild('filtersRow')
  private readonly filtersRow?: ElementRef<HTMLDivElement>;

  protected readonly scrollLeftIcon = faAngleLeft;
  protected readonly scrollRightIcon = faAngleRight;
  protected readonly checkIcon = faCheck;
  protected readonly canScrollLeft = signal(false);
  protected readonly canScrollRight = signal(false);
  private readonly isViewReady = signal(false);

  readonly showInitiated = input<boolean>(false);
  readonly filters = input<SupportHubFiltersChange | null>(null);
  readonly hasInitiatedTickets = input<boolean>(true);
  readonly hasAssignedTickets = input<boolean>(true);

  protected readonly statusControl = new FormControl<string | null>(null);

  protected readonly ticketViewControl = new FormControl<SupportHubTicketView>(
    'assigned',
    {
      nonNullable: true,
    },
  );

  protected readonly schoolControl = new FormControl<
    DsSchoolStructureControlValue[] | null
  >(null);

  protected readonly assignedToControl = new FormControl<number | null>(null);
  private readonly assignedToLabel = signal<string | null>(null);
  private readonly escalationPersonnelOptions = signal<
    SupportHubEscalationPersonnel[]
  >([]);
  private readonly escalationParamsKey = signal<string | null>(null);

  readonly filtersChanged = output<SupportHubFiltersChange>();

  private readonly statusValue = toSignal(this.statusControl.valueChanges, {
    initialValue: this.statusControl.value,
  });

  private readonly ticketViewValue = toSignal(
    this.ticketViewControl.valueChanges,
    {
      initialValue: this.ticketViewControl.value,
    },
  );

  private readonly showInitiatedValue = computed(
    () => this.ticketViewValue() === 'initiated',
  );

  protected readonly isInitiatedSelected = computed(
    () => this.ticketViewValue() === 'initiated',
  );
  protected readonly leftButtonIcon = computed(() =>
    this.isRtlLayout ? this.scrollRightIcon : this.scrollLeftIcon,
  );
  protected readonly rightButtonIcon = computed(() =>
    this.isRtlLayout ? this.scrollLeftIcon : this.scrollRightIcon,
  );
  protected readonly leftButtonPositionClass = computed(() =>
    this.isRtlLayout ? 'right-0' : 'left-0',
  );
  protected readonly rightButtonPositionClass = computed(() =>
    this.isRtlLayout ? 'left-0' : 'right-0',
  );

  protected readonly showCreatedByYou = computed(() =>
    this.hasInitiatedTickets(),
  );

  private readonly schoolValue = toSignal(this.schoolControl.valueChanges, {
    initialValue: this.schoolControl.value,
  });

  private readonly assignedToValue = toSignal(
    this.assignedToControl.valueChanges,
    {
      initialValue: this.assignedToControl.value,
    },
  );

  protected readonly hasMultipleSchools = computed(() => {
    const scopedSchools = this.schoolStructureScope.userScopedSchoolStructure();
    const schools = findAllSchools(scopedSchools);
    return schools.length > 1;
  });

  private readonly currentFilters = computed<SupportHubFiltersChange>(() => {
    const schoolSelection = this.schoolValue();
    const selection = schoolSelection?.[0];
    const assignedToValue = this.assignedToValue();
    const assignedTo = assignedToValue != null ? [assignedToValue] : null;

    const companyIds: number[] = [];
    const schoolIds: number[] = [];
    const campusIds: number[] = [];

    if (selection) {
      switch (selection.type) {
        case 'company':
        case 'sub-company':
          companyIds.push(selection.id);
          break;
        case 'school':
          schoolIds.push(selection.id);
          break;
        case 'campus':
          campusIds.push(selection.id);
          break;
      }
    }

    return {
      status: this.statusValue(),
      showInitiated: this.showInitiatedValue(),
      companyIds: companyIds.length > 0 ? companyIds : undefined,
      schoolIds: schoolIds.length > 0 ? schoolIds : undefined,
      campusIds: campusIds.length > 0 ? campusIds : undefined,
      assignedTo,
      assignedToLabel: this.assignedToLabel(),
    };
  });

  private readonly emitFiltersEffect = effect(() => {
    this.filtersChanged.emit(this.currentFilters());
  });

  private readonly updateScrollEffect = effect(() => {
    if (!this.isViewReady()) {
      return;
    }

    this.hasMultipleSchools();
    queueMicrotask(() => this.updateScrollState());
  });

  private readonly syncShowInitiatedEffect = effect(() => {
    const externalValue = this.showInitiated();
    const nextValue: SupportHubTicketView = externalValue
      ? 'initiated'
      : 'assigned';
    if (this.ticketViewControl.value !== nextValue) {
      this.ticketViewControl.setValue(nextValue);
    }
  });

  private readonly resetPersonnelOnSchoolChangeEffect = effect(() => {
    // Track school structure changes
    this.schoolValue();
    this.escalationPersonnelOptions.set([]);
    this.escalationParamsKey.set(null);

    // Reset personnel selection when school structure changes
    if (this.assignedToControl.value !== null) {
      this.assignedToControl.setValue(null, { emitEvent: true });
    }
  });

  private readonly assignedToLabelEffect = effect((onCleanup) => {
    const assignedToId = this.assignedToValue();
    if (assignedToId == null) {
      this.assignedToLabel.set(null);
      return;
    }

    const subscription = this.supportHubTicketsService
      .loadEscalationPersonnels(this.resolveEscalationPersonnelParams())
      .subscribe({
        next: (response) => {
          const match = response.data.find((item) => item.id === assignedToId);
          this.assignedToLabel.set(match?.displayName ?? null);
        },
        error: () => {
          this.assignedToLabel.set(null);
        },
      });

    onCleanup(() => subscription.unsubscribe());
  });

  private readonly enforceTicketViewEffect = effect(() => {
    const hasInitiated = this.hasInitiatedTickets();
    const hasAssigned = this.hasAssignedTickets();

    if (!hasInitiated && this.ticketViewControl.value === 'initiated') {
      this.ticketViewControl.setValue('assigned');
      return;
    }

    if (
      hasInitiated &&
      !hasAssigned &&
      this.ticketViewControl.value !== 'initiated'
    ) {
      this.ticketViewControl.setValue('initiated');
    }
  });

  private readonly syncFiltersEffect = effect(() => {
    const filters = this.filters();
    if (!filters) {
      return;
    }

    if (this.statusControl.value !== filters.status) {
      this.statusControl.setValue(filters.status ?? null, { emitEvent: true });
    }

    const nextTicketView: SupportHubTicketView = filters.showInitiated
      ? 'initiated'
      : 'assigned';
    if (this.ticketViewControl.value !== nextTicketView) {
      this.ticketViewControl.setValue(nextTicketView, { emitEvent: true });
    }

    const assignedTo = filters.assignedTo?.[0] ?? null;
    if (this.assignedToControl.value !== assignedTo) {
      this.assignedToControl.setValue(assignedTo, { emitEvent: true });
    }

    const nextSchoolSelection = this.resolveSchoolSelection(filters);
    const currentSelection = this.schoolControl.value;
    if (!this.areSameSchoolSelection(currentSelection, nextSchoolSelection)) {
      this.schoolControl.setValue(nextSchoolSelection, { emitEvent: true });
    }
  });

  protected readonly statusSelectConfig = computed<DsSelectConfig>(() => ({
    placeholder: this.hesTranslate.t('global.status.title'),
    showSearch: false,
    options: [
      {
        id: SupportTicketStatus.REVIEW,
        display: this.hesTranslate.t('global.open.txt'),
      },
      {
        id: SupportTicketStatus.RESOLVED,
        display: this.hesTranslate.t('support.status.resolved'),
      },
      {
        id: SupportTicketStatus.RE_OPEN,
        display: this.hesTranslate.t('support.ticket.status.reopened'),
      },
    ],
  }));

  protected readonly assignedToSelectConfig = computed<DsSelectConfig>(() => ({
    placeholder: this.hesTranslate.t('support_ticket.assigned_to.label'),
    isPaginated: false,
    isMultiple: false,
    showSearch: true,
    fieldMapper: {
      display: (item: SupportHubEscalationPersonnel) => item.displayName || '',
    },
    loadOptions: ({ searchText }) => {
      const filterParams = this.resolveEscalationPersonnelParams();
      const paramsKey = JSON.stringify(filterParams);
      const cached = this.escalationPersonnelOptions();

      if (cached.length > 0 && this.escalationParamsKey() === paramsKey) {
        return of({
          data: this.filterEscalationPersonnels(cached, searchText),
          message: '',
        });
      }

      return this.supportHubTicketsService
        .loadEscalationPersonnels({
          ...filterParams,
        })
        .pipe(
          map((response) => {
            this.escalationParamsKey.set(paramsKey);
            this.escalationPersonnelOptions.set(response.data);
            return {
              ...response,
              data: this.filterEscalationPersonnels(response.data, searchText),
            };
          }),
        );
    },
    loadSelectedItems: ({ selectedId }) =>
      this.supportHubTicketsService
        .loadEscalationPersonnels(this.resolveEscalationPersonnelParams())
        .pipe(
          map((response) => ({
            data: response.data.filter((item) => item.id === selectedId),
            message: response.message,
          })),
        ),
  }));

  private areSameSchoolSelection(
    left: DsSchoolStructureControlValue[] | null,
    right: DsSchoolStructureControlValue[] | null,
  ): boolean {
    if (left === right) {
      return true;
    }
    if (!left || !right) {
      return false;
    }
    if (left.length !== right.length) {
      return false;
    }
    const leftItem = left[0];
    const rightItem = right[0];
    return leftItem.id === rightItem.id && leftItem.type === rightItem.type;
  }

  private resolveSchoolSelection(
    filters: SupportHubFiltersChange,
  ): DsSchoolStructureControlValue[] | null {
    const scope = this.schoolStructureScope.userScopedSchoolStructure();

    if (filters.companyIds?.length) {
      const id = filters.companyIds[0];
      const match = findAllCompanies(scope).find((item) => item.id === id);
      return [
        {
          id,
          type: (match?.type ??
            'company') as DsSchoolStructureControlValue['type'],
        },
      ];
    }

    if (filters.campusIds?.length) {
      const id = filters.campusIds[0];
      return [{ id, type: 'campus' }];
    }

    if (filters.schoolIds?.length) {
      const id = filters.schoolIds[0];
      return [{ id, type: 'school' }];
    }

    return null;
  }

  private resolveEscalationPersonnelParams(): {
    companyIds?: number[];
    schoolIds?: number[];
    campusIds?: number[];
  } {
    const selection = this.schoolValue()?.[0];
    const fallback = this.schoolStructureScope.selectedSchoolStructureItem();
    const target = selection ?? fallback;

    const params: {
      companyIds?: number[];
      schoolIds?: number[];
      campusIds?: number[];
    } = {};

    if (target) {
      switch (target.type) {
        case 'company':
        case 'sub-company':
          params.companyIds = [target.id];
          break;
        case 'school':
          params.schoolIds = [target.id];
          break;
        case 'campus':
          params.campusIds = [target.id];
          break;
      }
    }

    return params;
  }

  private filterEscalationPersonnels(
    items: SupportHubEscalationPersonnel[],
    searchText?: string,
  ): SupportHubEscalationPersonnel[] {
    if (!searchText) {
      return items;
    }
    const query = searchText.trim().toLowerCase();
    if (!query) {
      return items;
    }
    return items.filter((item) =>
      item.displayName.toLowerCase().includes(query),
    );
  }

  ngAfterViewInit(): void {
    if (this.layoutService.isMobileOrTablet()) {
      this.canScrollLeft.set(false);
      this.canScrollRight.set(false);
      return;
    }

    const scroller = this.filtersScroller?.nativeElement;
    if (!scroller) {
      return;
    }

    if (this.isRtlLayout) {
      this.rtlScrollBehavior = this.detectRtlScrollBehavior(scroller);
    }
    this.isViewReady.set(true);
    this.updateScrollState();

    fromEvent(scroller, 'scroll')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateScrollState());

    fromEvent(window, 'resize')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateScrollState());
  }

  protected scrollFilters(direction: 'left' | 'right'): void {
    if (this.layoutService.isMobileOrTablet()) {
      return;
    }
    const scroller = this.filtersScroller?.nativeElement;
    if (!scroller) {
      return;
    }

    const distance = this.getScrollStep(scroller);
    const isRtl = this.isRtlLayout;
    const delta =
      (direction === 'left' && !isRtl) || (direction === 'right' && isRtl)
        ? -distance
        : distance;
    scroller.scrollBy({
      left: this.mapScrollDeltaForRtl(scroller, delta),
      behavior: 'smooth',
    });
  }

  private updateScrollState(): void {
    if (this.layoutService.isMobileOrTablet()) {
      this.canScrollLeft.set(false);
      this.canScrollRight.set(false);
      return;
    }
    const scroller = this.filtersScroller?.nativeElement;
    if (!scroller) {
      this.canScrollLeft.set(false);
      this.canScrollRight.set(false);
      return;
    }

    const { clientWidth, scrollWidth } = scroller;
    const maxScrollLeft = Math.max(0, scrollWidth - clientWidth);
    const normalizedLeft = this.getNormalizedScrollLeft(
      scroller,
      maxScrollLeft,
    );
    const remainingRight = maxScrollLeft - normalizedLeft;
    const epsilon = 1;
    this.canScrollLeft.set(normalizedLeft > epsilon);
    this.canScrollRight.set(remainingRight > epsilon);
  }

  private getNormalizedScrollLeft(
    scroller: HTMLDivElement,
    maxScrollLeft: number,
  ): number {
    if (!this.isRtlLayout) {
      return Math.max(0, Math.min(scroller.scrollLeft, maxScrollLeft));
    }

    const behavior =
      this.rtlScrollBehavior ?? this.detectRtlScrollBehavior(scroller);
    const raw = scroller.scrollLeft;
    switch (behavior) {
      case 'negative':
        return Math.max(0, Math.min(-raw, maxScrollLeft));
      case 'positive':
        return Math.max(0, Math.min(raw, maxScrollLeft));
      case 'reverse':
      default:
        return Math.max(0, Math.min(maxScrollLeft - raw, maxScrollLeft));
    }
  }

  private mapScrollDeltaForRtl(
    scroller: HTMLDivElement,
    delta: number,
  ): number {
    if (!this.isRtlLayout) {
      return delta;
    }

    const behavior =
      this.rtlScrollBehavior ?? this.detectRtlScrollBehavior(scroller);
    if (behavior === 'reverse') {
      return -delta;
    }
    return delta;
  }

  private detectRtlScrollBehavior(
    scroller: HTMLDivElement,
  ): 'negative' | 'positive' | 'reverse' {
    const original = scroller.scrollLeft;
    scroller.scrollLeft = 1;
    const left = scroller.scrollLeft;
    scroller.scrollLeft = original;

    if (left === 0) {
      return 'negative';
    }
    if (left > 0) {
      return 'positive';
    }
    return 'reverse';
  }

  private getScrollStep(scroller: HTMLDivElement): number {
    const row = this.filtersRow?.nativeElement;
    if (row) {
      const children = Array.from(row.children) as HTMLElement[];
      const first = children[0];
      const second = children[1];
      if (first && second) {
        const gap =
          parseFloat(getComputedStyle(row).columnGap || '0') ||
          parseFloat(getComputedStyle(row).gap || '0') ||
          0;
        const step = first.offsetWidth + second.offsetWidth + gap * 2;
        if (step > 0) {
          return Math.min(step, scroller.clientWidth);
        }
      }
    }

    return Math.max(200, Math.floor(scroller.clientWidth * 0.6));
  }

  protected onFiltersHover(): void {
    if (this.layoutService.isMobileOrTablet()) {
      return;
    }
    this.updateScrollState();
  }

  protected toggleTicketView(): void {
    const nextValue: SupportHubTicketView =
      this.ticketViewControl.value === 'initiated' ? 'assigned' : 'initiated';
    this.ticketViewControl.setValue(nextValue);
  }
}
