import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoDirective } from '@jsverse/transloco';
import { IonContent } from '@ionic/angular/standalone';
import { SetupBannerComponent } from '@pages/academic-year/components/setup-banner/setup-banner.component';
import { SetupCardComponent } from '@pages/academic-year/components/setup-card/setup-card.component';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { isMobile, isRtl } from '@shared/utils/platform';
import { DsIconComponent } from '@ds/icon/icon.component';
import { provideIcons } from '@ng-icons/core';
import {
  saxAddOutline,
  saxArrowRight3Outline,
  saxArrowLeft2Outline,
} from '@ng-icons/iconsax/outline';
import { DsButtonComponent } from '@ds/button/button.component';
import { ItemListCardComponent } from './components/item-list-card/item-list-card.component';
import { faPen, faTrashCan } from '@fortawesome/pro-regular-svg-icons';
import { AcademicYearModalService } from './utils/academic-year-modal.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HesDatePipe } from '@shared/pipes/hessa-date.pipe';
import { AcademicYearStateService } from './data-access/academic-year-state.service';
import { IAction } from '@ui-kit/hes-action-sheet/model';
import { FeedbackService } from '@shared/services/feedback.service';
import { ChipFilterComponent } from '@shared/components/chip-filter/chip-filter.component';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { RbacDirective } from '@shared/role-bace-acces-controller/rbac.directive';

@Component({
  selector: 'app-academic-year',
  templateUrl: './academic-year.page.html',
  standalone: true,
  imports: [
    TranslocoDirective,
    IonContent,
    CommonModule,
    SetupBannerComponent,
    SetupCardComponent,
    DsIconComponent,
    DsButtonComponent,
    ItemListCardComponent,
    HesDatePipe,
    ChipFilterComponent,
    RbacDirective,
  ],
  viewProviders: [
    provideIcons({
      saxArrowRight3Outline,
      saxAddOutline,
      saxArrowLeft2Outline,
    }),
  ],
})
export class AcademicYearPage implements OnInit {
  private readonly hesTranslateService = inject(HesTranslateService);
  private readonly academicYearModalService = inject(AcademicYearModalService);
  private readonly academicYearStateService = inject(AcademicYearStateService);
  private readonly feedbackService = inject(FeedbackService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly rbac = inject(RoleBaseAccessControlService);

  // Signals from the state service
  pastAcademicYears = this.academicYearStateService.pastAcademicYears;
  academicYear = this.academicYearStateService.academicYear;
  semesterListData = this.academicYearStateService.mappedSemesterListData;
  holidaysListData = this.academicYearStateService.mappedHolidaysListData;
  isAcademicYearEnded = this.academicYearStateService.isAcademicYearEnded;

  isPreviousYears = computed(
    () => this.route.snapshot.url[0]?.path === 'previous',
  );
  previousYearsList = computed(() => {
    return this.pastAcademicYears().map((year) => ({
      id: year.id.toString(),
      label: year.name,
      selected: false,
    }));
  });
  selectedAcademicYearId = signal<string | null>(null);

  addAcademicYearPermission =
    RESOURCE_PERMISSION.academicYear.academicYearCreate;
  editAcademicYearPermission =
    RESOURCE_PERMISSION.academicYear.academicYearUpdate;
  addHolidayPermission = RESOURCE_PERMISSION.holiday.holidayCreate;
  viewHolidayPermission = RESOURCE_PERMISSION.holiday.holidayListView;
  addSemesterPermission = RESOURCE_PERMISSION.semester.semesterCreate;

  faTrash = faTrashCan;
  isRtl = isRtl();
  isMobile = isMobile();
  faPen = faPen;
  setupBannerConf = computed(() => ({
    title: this.academicYear()
      ? this.hesTranslateService.t(
          'academic_calendar.academic_year_ended.title',
          {
            academic_year: this.academicYear()?.name,
          },
        )
      : this.hesTranslateService.t('global.welcome'),
    description: this.academicYear()
      ? this.hesTranslateService.t(
          'academic_calendar.setup_academic_year.title',
        )
      : this.hesTranslateService.t(
          'academic_year.setup_your_academic_year.title',
        ),
  }));

  setupSemesterConfig = computed(() => ({
    title: this.hesTranslateService.t('academic_calendar.setup_semester.title'),
    description: this.hesTranslateService.t(
      'academic_calendar.setup_semester.txt',
    ),
    btnText: this.hesTranslateService.t('academic_enrolment.add_semester.btn'),
    imagePath: 'assets/illustrations/setup-semester.svg',
    showButton:
      !this.isPreviousYears() &&
      !this.isAcademicYearEnded() &&
      !!this.academicYear(),
  }));

  setupHolidayConfig = computed(() => ({
    title: this.hesTranslateService.t(
      this.isPreviousYears() || this.isAcademicYearEnded()
        ? 'academic_year.no_holidays_available.title'
        : 'academic_year.setup_holidays.title',
    ),
    description: this.hesTranslateService.t(
      this.isPreviousYears() || this.isAcademicYearEnded()
        ? 'academic_year.no_holidays_available.txt'
        : 'academic_year.setup_holidays.txt',
    ),
    btnText: this.hesTranslateService.t('academic_calendar.add_holiday'),
    imagePath: 'assets/illustrations/setup-holiday.svg',
    showButton:
      !this.isPreviousYears() &&
      !this.isAcademicYearEnded() &&
      !!this.academicYear(),
  }));

  holidayActions = computed<IAction[]>(() => {
    return [
      {
        hasPermission: () => {
          return this.rbac.hasPermission(
            RESOURCE_PERMISSION.holiday.holidayUpdate,
          );
        },
        iconProps: { icon: faPen },
        text: this.hesTranslateService.t('global.edit.btn'),
        onClick: (data: number) => this.onEditHoliday(data),
      },
      {
        hasPermission: () => {
          return this.rbac.hasPermission(
            RESOURCE_PERMISSION.holiday.holidayDelete,
          );
        },
        iconProps: { icon: faTrashCan, flip: 'horizontal' },
        text: this.hesTranslateService.t('global.delete.btn'),
        onClick: (data: number) => this.onDeleteHoliday(data),
      },
    ];
  });

  ngOnInit(): void {
    this.academicYearStateService.fetchGlobalHolidays();
    this.academicYearStateService.fetchAllPastAcademicYears();
  }

  ionViewWillEnter(): void {
    if (!this.isPreviousYears()) {
      this.academicYearStateService.fetchAcademicYearData('current');
    }
  }

  onSetupBannerClick() {
    if (this.isMobile) {
      this.router.navigate(['add'], { relativeTo: this.route });
    } else {
      this.academicYearModalService.openManageAcademicYearDialog();
    }
  }

  onEditAcademicYear() {
    if (this.isMobile) {
      this.router.navigate(['edit', this.academicYear()?.id], {
        relativeTo: this.route,
      });
    } else {
      const academicYearId = this.academicYear()?.id;
      if (academicYearId) {
        this.academicYearModalService.openManageAcademicYearDialog(
          academicYearId,
        );
      }
    }
  }

  onPreviousBtnClick() {
    this.router.navigate(['previous'], { relativeTo: this.route });
  }

  onDeleteHoliday(holidayId: number) {
    this.feedbackService.openFeedbackModal(
      {
        type: 'error',
        modalTitle: this.hesTranslateService.t(
          'academic_year.holiday_delete_confirmation.title',
        ),
        primaryBtnStr: this.hesTranslateService.t('global.delete.btn'),
        secondaryBtnStr: this.hesTranslateService.t('global.cancel.btn'),
      },
      () => {
        this.academicYearStateService.deleteHoliday(holidayId.toString());
      },
    );
  }

  onEditHoliday(holidayId: number) {
    if (this.isMobile) {
      this.router.navigate([
        'academic-year',
        this.academicYear()?.id,
        'edit-holiday',
        holidayId,
      ]);
    } else {
      const academicYearId = this.academicYear()?.id;
      if (academicYearId) {
        this.academicYearModalService.openManageHolidayDialog(
          Number(academicYearId),
          holidayId,
        );
      }
    }
  }

  onSemesterClick(id: string) {
    this.academicYearModalService.openSemesterWeeksDialog(
      Number(id),
      this.isPreviousYears() || this.isAcademicYearEnded(),
    );
  }

  onAddSemester() {
    if (this.isMobile) {
      this.router.navigate([this.academicYear()?.id, 'add-semester'], {
        relativeTo: this.route,
      });
    } else {
      const academicYearId = this.academicYear()?.id;
      if (academicYearId) {
        this.academicYearModalService.openManageSemesterDialog(
          Number(academicYearId),
        );
      }
    }
  }

  onAddHoliday() {
    if (this.isMobile) {
      this.router.navigate([this.academicYear()?.id, 'add-holiday'], {
        relativeTo: this.route,
      });
    } else {
      const academicYearId = this.academicYear()?.id;
      if (academicYearId) {
        this.academicYearModalService.openManageHolidayDialog(
          Number(academicYearId),
        );
      }
    }
  }

  onAcademicYearFilterChange(academicYearId?: string) {
    this.selectedAcademicYearId.set(academicYearId || null);
    this.academicYearStateService.fetchAcademicYearData(academicYearId);
  }
}
