import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  InlineFilterConfig,
  ListViewContainerComponent,
} from '@ui-kit/hes-responsive-list-view/list-view-container/list-view-container.component';
import { ITableCol } from '@ui-kit/hes-table/model';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { map } from 'rxjs';
import { TranslocoDirective } from '@jsverse/transloco';
import {
  HesScope,
  NoSelectedScopeCardComponent,
} from '@shared/components/no-selected-scope-card/no-selected-scope-card.component';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { enumArrayFromEnum, PickupRequestTableStatus } from '@shared/enums';
import { Router } from '@angular/router';
import { FeedbackService } from '@shared/services/feedback.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { PickupService } from '@pages/pickup/data-access/pickup.service';
import {
  createPickupRequestsDateRenderer,
  IPickupRequestItem,
  mapPickupRequestsToListItems,
} from '@pages/pickup/data-access/pickup.utils';
import { format } from 'date-fns';
import { HesTimePipe } from '@shared/pipes/hes-time.pipe';
import { PickupStatusTableCellComponent } from '@pages/pickup/components/pickup-status-table-cell/pickup-status-table-cell.component';

@Component({
  selector: 'app-pickup-requests',
  templateUrl: './pickup-requests.page.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ListViewContainerComponent,
    TranslocoDirective,
    NoSelectedScopeCardComponent,
    ReactiveFormsModule,
  ],
  providers: [HesTimePipe],
})
export class PickupRequestsPage implements OnInit {
  // #region injectables
  private readonly router = inject(Router);
  private readonly feedbackService = inject(FeedbackService);
  private readonly pickupService = inject(PickupService);
  private readonly translocoService = inject(HesTranslateService);
  private readonly schoolScopeService = inject(SchoolStructureScopeService);
  private readonly rbacService = inject(RoleBaseAccessControlService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastr = inject(HesToasterService);
  private readonly pickupRequestDateRenderer =
    createPickupRequestsDateRenderer();

  // #endregion

  // #region Angular ref
  private readonly viewContainerListRef = viewChild<ListViewContainerComponent>(
    ListViewContainerComponent,
  );
  // #endregion

  // #region Protected Properties
  protected readonly displayContent = signal(false);
  protected readonly requiredScopes: Array<HesScope> = ['school'];

  protected readonly inlineFilterConfig: InlineFilterConfig = {
    type: 'date',
    initalValueDate: new Date(),
    clear: false,
  };
  protected readonly columns: ITableCol<IPickupRequestItem>[] = [
    {
      field: 'fullName',
      headerName: this.translocoService.t('global.student_name.title'),
      sortable: false,
      filter: false,
    },
    {
      field: 'nationalId',
      headerName: this.translocoService.t('global.national_id.title'),
      sortable: false,
      filter: false,
    },
    {
      field: 'levelId',
      headerName: this.translocoService.t('global.level.title'),
      sortable: false,
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
      headerName: this.translocoService.t('global.class.title'),
      sortable: false,
      filter: true,
      filterType: 'chip-selector',
      SchoolStructureListingType: 'class',
      filterPlaceholder: this.translocoService.t('global.class.title'),
      valueFormatter: ({ data }) => {
        return data.className ?? '-';
      },
      includeNoneOption: false,
    },
    {
      field: 'endTime',
      headerName: this.translocoService.t('global.time.txt'),
      sortable: false,
      filter: false,
      cellRenderer: this.pickupRequestDateRenderer,
      extractValue: this.pickupRequestDateRenderer,
    },
    {
      field: 'guardianName',
      headerName: this.translocoService.t('dismissal.picked_by.title'),
      sortable: false,
      filter: false,
    },
    {
      field: 'guardianPhoneNumber',
      headerName: this.translocoService.t('global.phone_number.label'),
      sortable: false,
      filter: false,
    },
    {
      field: 'status',
      headerName: this.translocoService.t('global.status.title'),
      sortable: false,
      filter: true,
      filterType: 'chip-selector',
      filterSelectOptions: enumArrayFromEnum(PickupRequestTableStatus).map(
        (status) => ({
          value: status as string | number,
          displayedValue: this.translocoService.enumT(status as string),
        }),
      ),
      cellRenderer: PickupStatusTableCellComponent,
      cellRendererParams: (data: IPickupRequestItem) => {
        return data;
      },
    },
  ];

  protected readonly noDataConfig = {
    title: this.translocoService.t('dismissal.no_pickup_request.txt'),
    description: this.translocoService.t('dismissal.no_pickup_request.msg.txt'),
  };

  // #endregion

  // #region Public Methods

  ngOnInit(): void {}

  handleDisplayContent(v: boolean) {
    this.displayContent.set(v);
  }

  fetchPickupRequests = (params: any) => {
    return this.pickupService
      .getPickupHistoryForAdmin({
        ...params,
        date: format(new Date(params.date * 1000), 'yyyy-MM-dd'),
        schoolId: this.schoolScopeService.selectedSchoolId(),
      })
      .pipe(
        map((resp) => {
          return {
            data: mapPickupRequestsToListItems(resp.data),
            paginate: resp.paginate,
          };
        }),
      );
  };
  // #endregion
}
