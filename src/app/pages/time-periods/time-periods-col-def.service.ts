import { Injectable, computed, inject } from '@angular/core';
import { INoRowsOverlay, ITableCol } from '@ui-kit/hes-table/model';
import { IAction } from '@ui-kit/hes-action-sheet/model';
import { faEye, faPen, faTrashCan } from '@fortawesome/pro-regular-svg-icons';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { Subject } from 'rxjs';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { ITimePeriodListItem } from '@shared/dto-transformation/time-period/time-period.interface';
import { SchoolStructureListingService } from '@core/school-structure-listing.service';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { TimePeriodModalService } from './utils/time-period-modal.service';
import { generateDays } from './data-access/time-periods.utils';

@Injectable()
export class TimePeriodsColDefService {
  private readonly rbacService = inject(RoleBaseAccessControlService);
  private readonly hesTranslationService = inject(HesTranslateService);
  private readonly timePeriodModalService = inject(TimePeriodModalService);

  private readonly schoolStructureListingService = inject(
    SchoolStructureListingService,
  );
  private reloadSource = new Subject<void>();
  readonly reload$ = this.reloadSource.asObservable();

  getActions(): IAction<ITimePeriodListItem>[] {
    return [
      {
        iconProps: { icon: faEye },
        hasPermission: () => {
          return this.rbacService.hasPermission(
            RESOURCE_PERMISSION.TIME_PERIODS.READ.VIEW_TIME_PERIOD,
          );
        },
        text: this.hesTranslationService.t('global.view.btn'),
        onClick: (data) => {
          this.timePeriodModalService.onViewTimePeriod(data.id);
        },
        mobileViewConfig: {
          isPrimaryBtn: true,
          buttonInfo: {
            color: 'primary',
          },
        },
      },
      {
        iconProps: { icon: faPen },
        text: this.hesTranslationService.t('global.edit.btn'),
        onClick: (data) => {
          this.timePeriodModalService.onEditPeriodDuration(data.id);
        },
        hasPermission: () => {
          return this.rbacService.hasPermission(
            RESOURCE_PERMISSION.TIME_PERIODS.UPDATE.UPDATE_TIME_PERIOD,
          );
        },
        mobileViewConfig: {
          isPrimaryBtn: true,
          buttonInfo: {
            color: 'secondary',
          },
        },
      },
      {
        iconProps: { icon: faTrashCan },
        text: this.hesTranslationService.t('global.delete.btn'),
        onClick: (data) => {
          this.timePeriodModalService.onDeleteTimePeriod(data.id);
        },
        hasPermission: () => {
          return this.rbacService.hasPermission(
            RESOURCE_PERMISSION.TIME_PERIODS.DELETE.DELETE_TIME_PERIOD,
          );
        },
      },
    ];
  }

  noRowsOverlayComponentParams = computed<INoRowsOverlay>(() => {
    return {
      imgSrc: 'assets/illustrations/no_data.svg',
      title: this.hesTranslationService.t('time_period.no_time_period.title'),
      ...(this.rbacService.hasPermission(
        RESOURCE_PERMISSION.TIME_PERIODS.CREATE.CREATE_TIME_PERIOD,
      ) && {
        subTitle: this.hesTranslationService.t(
          'time_period.no_time_period_msg.txt',
        ),
        btnText: this.hesTranslationService.t(
          'time_period.add_time_period.btn',
        ),
        btnClick: () => {
          this.timePeriodModalService.onAddTimePeriod();
        },
      }),
    };
  });

  readonly columns: ITableCol<ITimePeriodListItem>[] = [
    {
      field: 'levelId',
      headerName: this.hesTranslationService.t('global.level.title'),
      sortable: true,
      filter: true,
      filterType: 'chip-selector',
      SchoolStructureListingType: 'level',
      valueFormatter: ({ data, value }) => {
        return data.levelName ?? '-';
      },
      includeNoneOption: false,
    },
    {
      field: 'classId',
      headerName: this.hesTranslationService.t('global.class.title'),
      sortable: true,
      filter: true,
      filterType: 'chip-selector',
      SchoolStructureListingType: 'class',
      filterPlaceholder: this.hesTranslationService.t('global.class.title'),
      valueFormatter: ({ data }) => {
        return data.className ?? '-';
      },
      includeNoneOption: false,
    },
    {
      field: 'academicYearId',
      headerName: this.hesTranslationService.t('global.academic_year.title'),
      sortable: true,
      filter: true,
      filterType: 'chip-selector',
      filterPlaceholder: this.hesTranslationService.t(
        'global.academic_year.title',
      ),
      valueFormatter: ({ data }) => {
        return data.academicYearName ?? '-';
      },
      includeNoneOption: false,
    },
    {
      field: 'dayOfWeek',
      headerName: this.hesTranslationService.t('time_period.weekdays.title'),
      sortable: false,
      filter: true,
      filterType: 'chip-selector',
      filterSelectOptions: generateDays(this.hesTranslationService),
    },
    {
      field: 'actions',
      headerName: this.hesTranslationService.t('global.actions.title'),
      sortable: false,
      filter: false,
      type: 'action',
      forceActionSheet: true,
      lockPosition: true,
      actions: this.getActions(),
    },
  ];
}
