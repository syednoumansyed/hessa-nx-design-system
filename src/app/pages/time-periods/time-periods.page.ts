import { Component, OnDestroy, OnInit, signal, viewChild } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { TranslocoDirective } from '@jsverse/transloco';
import { map, Subscription } from 'rxjs';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import {
  HesScope,
  NoSelectedScopeCardComponent,
} from '@shared/components/no-selected-scope-card/no-selected-scope-card.component';
import { TimePeriodService } from './data-access/time-periods.service';
import { TimePeriodsColDefService } from './time-periods-col-def.service';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { TimePeriodModalService } from './utils/time-period-modal.service';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { ListViewContainerComponent } from '@ui-kit/hes-responsive-list-view/list-view-container/list-view-container.component';
import { mapTimeperiodsToListItems } from './data-access/time-periods.utils';
import { faPlus } from '@fortawesome/pro-regular-svg-icons';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';

@Component({
  selector: 'app-time-periods',
  templateUrl: './time-periods.page.html',
  standalone: true,
  imports: [
    IonContent,
    TranslocoDirective,
    NoSelectedScopeCardComponent,
    ListViewContainerComponent,
  ],
  providers: [TimePeriodsColDefService],
})
export class TimePeriodsPage implements OnInit, OnDestroy {
  readonly columns = this.timePeriodsColDefService.columns;
  readonly requiredScopes: Array<HesScope> = ['school'];
  readonly displayContent = signal(false);
  readonly timeperiodCreatePermission = [
    RESOURCE_PERMISSION.TIME_PERIODS.CREATE.CREATE_TIME_PERIOD,
  ];
  readonly isLoading = signal(false);
  selectedAcademicYerarId = signal<number | undefined>(undefined);
  timePeriodsList = this.timePeriodService.timePeriods;
  selectedLevelId = signal<number | undefined>(undefined);
  private subscripiton = new Subscription();

  private readonly viewContainerListRef = viewChild<ListViewContainerComponent>(
    ListViewContainerComponent,
  );

  constructor(
    private schoolScopeService: SchoolStructureScopeService,
    private timePeriodsColDefService: TimePeriodsColDefService,
    private timePeriodService: TimePeriodService,
    private academicYearScopeService: AcademicYearsScopeService,
    private timePeriodModalService: TimePeriodModalService,
    private translocoService: HesTranslateService,
    private rbac: RoleBaseAccessControlService,
  ) {}

  ngOnInit(): void {
    this.selectedAcademicYerarId.set(
      this.academicYearScopeService.selectedAcademicYear()?.id,
    );
    this.timePeriodModalService.onSuccessTimePeriod$.subscribe(() => {
      this.viewContainerListRef()?.triggerFetch();
    });
  }

  handleDisplayContent(v: boolean) {
    this.displayContent.set(v);
  }

  fetchTimePeriods = (params: any) => {
    return this.timePeriodService
      .getTimePeriods({
        ...params,
        schoolId: this.schoolScopeService.selectedSchoolId(),
      })
      .pipe(
        map((resp) => {
          return {
            data: mapTimeperiodsToListItems(resp.data, this.translocoService),
            paginate: resp.paginate,
          };
        }),
      );
  };

  primaryBtnConfig = {
    isVisible: () =>
      this.rbac.hasPermission(
        RESOURCE_PERMISSION.TIME_PERIODS.CREATE.CREATE_TIME_PERIOD,
      ),
    iconProps: { icon: faPlus },
    text: this.translocoService.t('time_period.time_periods.title'),
    onClick: () => this.onCreateTimeperiod(),
  };

  protected readonly noDataConfig = {
    title: this.translocoService.t('time_period.no_time_period.title'),
    description: this.translocoService.t('time_period.no_time_period_msg.txt'),
  };

  onCreateTimeperiod() {
    this.timePeriodModalService.onAddTimePeriod();
  }

  ngOnDestroy(): void {
    this.subscripiton.unsubscribe();
  }
}
