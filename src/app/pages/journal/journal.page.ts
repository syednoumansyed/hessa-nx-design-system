import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  InlineFilterConfig,
  ListViewContainerComponent,
} from '@ui-kit/hes-responsive-list-view/list-view-container/list-view-container.component';
import { ITableCol } from '@ui-kit/hes-table/model';
import { JournalStatus } from './data-access/journal.enum';
import { JournalApiService } from './data-access/journal-api.service';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { first, map } from 'rxjs';
import { TranslocoDirective } from '@jsverse/transloco';
import {
  HesScope,
  NoSelectedScopeCardComponent,
} from '@shared/components/no-selected-scope-card/no-selected-scope-card.component';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { IAction } from '@ui-kit/hes-action-sheet/model';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import {
  faEye,
  faFile,
  faPen,
  faTrash,
} from '@fortawesome/pro-regular-svg-icons';
import { StatusTableCellComponent } from './components/status-table-cell/status-table-cell.component';
import { SchoolStructureListingService } from '@core/school-structure-listing.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { enumArrayFromEnum } from '@shared/enums';
import {
  createJournalDateRenderer,
  IJournalListItem,
  mapJournalsToListItems,
} from './data-access/journal-list.utils';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { HesDatePipe } from '@shared/pipes/hessa-date.pipe';
import { Router } from '@angular/router';
import { faWarning } from '@fortawesome/pro-light-svg-icons';
import { FeedbackService } from '@shared/services/feedback.service';
import { ObjId } from '@shared/interfaces/common.interface';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { TuiDay } from '@taiga-ui/cdk';

@Component({
  selector: 'app-journal',
  templateUrl: './journal.page.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ListViewContainerComponent,
    TranslocoDirective,
    NoSelectedScopeCardComponent,
    ReactiveFormsModule,
  ],
  providers: [SchoolStructureListingService, HesDatePipe],
})
export class JournalPage implements OnInit {
  // #region injectables
  private readonly router = inject(Router);
  private readonly feedbackService = inject(FeedbackService);
  private readonly journalService = inject(JournalApiService);
  private readonly journalApiService = inject(JournalApiService);
  private readonly translocoService = inject(HesTranslateService);
  private readonly academicYearScope = inject(AcademicYearsScopeService);
  private readonly schoolScopeService = inject(SchoolStructureScopeService);
  private readonly rbacService = inject(RoleBaseAccessControlService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastr = inject(HesToasterService);
  private readonly journalDateRenderer = createJournalDateRenderer();
  // #endregion

  // #region Angular ref
  private readonly viewContainerListRef = viewChild<ListViewContainerComponent>(
    ListViewContainerComponent,
  );
  // #endregion

  // #region Protected Properties
  protected readonly frequencyControl = new FormControl('DAILY');
  protected readonly displayContent = signal(false);
  protected readonly requiredScopes: Array<HesScope> = [
    'school',
    'academicYear',
  ];

  protected readonly inlineFilterConfig: InlineFilterConfig = {
    type: 'date',
    initalValueDate: new Date(),
    noDefault: false,
    clear: false,
    datePickerConfig: {
      max: TuiDay.currentLocal(),
    },
  };
  protected readonly columns: ITableCol<IJournalListItem>[] = [
    {
      field: 'displayName',
      headerName: this.translocoService.t('global.student_name.title'),
      sortable: true,
      filter: false,
    },
    {
      field: 'journalDate',
      headerName: this.translocoService.t('journals.journal_date.title'),
      sortable: true,
      filter: false,
      type: 'date',
      cellRenderer: this.journalDateRenderer,
      extractValue: this.journalDateRenderer,
    },
    {
      field: 'nationalId',
      headerName: this.translocoService.t('global.national_id.title'),
      sortable: true,
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
      field: 'publishDate',
      headerName: this.translocoService.t('global.publish_date.title'),
      sortable: true,
      filter: false,
      filterType: 'date',
      filterPlaceholder: this.translocoService.t('global.date_of_birth.title'),
      type: 'date',
    },
    {
      field: 'acknowledgementComment',
      headerName: this.translocoService.t('journals.comment_by_guardian.title'),
      sortable: false,
      filter: false,
    },
    {
      field: 'status',
      headerName: this.translocoService.t('global.status.title'),
      sortable: true,
      filter: true,
      filterType: 'chip-selector',
      filterSelectOptions: enumArrayFromEnum(JournalStatus).map((status) => ({
        value: status as string | number,
        displayedValue: this.translocoService.enumT(status as string),
      })),
      cellRenderer: StatusTableCellComponent,
      cellRendererParams: (data: IJournalListItem) => {
        return data;
      },
      mobileViewConfig: {
        order: 1,
      },
    },
    {
      field: 'actions',
      headerName: this.translocoService.t('global.actions.title'),
      sortable: false,
      filter: false,
      type: 'action',
      forceActionSheet: true,
      lockPosition: true,
      actions: this.getActions(),
    },
  ];

  protected readonly noDataConfig = {
    title: this.translocoService.t('journals.no_journals.title'),
    description: this.translocoService.t('journals.no_tickets.msg.txt'),
  };

  // #endregion

  // #region Public Methods

  ngOnInit(): void {
    this.frequencyControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.viewContainerListRef()?.onFilterChange();
      });
  }

  handleDisplayContent(v: boolean) {
    this.displayContent.set(v);
  }

  fetchJournalList = (params: any) => {
    return this.journalApiService
      .getPersonnelJournals({
        ...params,
        type: this.frequencyControl.value,
        schoolId: this.schoolScopeService.selectedSchoolId(),
        academicYearId: this.academicYearScope.selectedAcademicYear()!.id,
      })
      .pipe(
        map((resp) => {
          return {
            data: mapJournalsToListItems(resp.data),
            paginate: resp.paginate,
          };
        }),
      );
  };
  // #endregion

  // #region Private Methods

  getActions(): IAction<IJournalListItem>[] {
    return [
      {
        iconProps: { icon: faFile },
        text: this.translocoService.t('journals.fill_journal.title'),
        onClick: (data) => {
          const date = new Date(data.journalDate).getTime() / 1000;
          this.router.navigate(
            [
              `/journal/add/${data.isWeekly ? 'weekly' : 'daily'}`,
              data.studentId,
            ],
            {
              queryParams: { date }, // Pass the date as a query param
            },
          );
        },
        hasPermission: (data: IJournalListItem) => {
          if (
            this.rbacService.hasPermission(
              RESOURCE_PERMISSION.JOURNAL.UPDATE.UPDATE_JOURNAL,
            )
          ) {
            if (data.isNewStatus) {
              return true;
            }
          }
          return false;
        },
        mobileViewConfig: {
          isPrimaryBtn: true,
          buttonInfo: {
            color: 'primary',
          },
        },
      },
      {
        iconProps: { icon: faEye },
        text: this.translocoService.t('global.view.btn'),
        onClick: (data) => {
          this.router.navigate([`/journal/view/${data.id}`]);
        },
        hasPermission: (data: IJournalListItem) => {
          if (!data.isNewStatus) {
            return true;
          }
          return false;
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
        text: this.translocoService.t('global.edit.btn'),
        onClick: (data) => {
          this.router.navigate([`/journal/edit/${data.id}`]);
        },
        hasPermission: (data: IJournalListItem) => {
          if (!data.isNewStatus && data.status === JournalStatus.DRAFT) {
            return true;
          }
          return false;
        },
        mobileViewConfig: {
          isPrimaryBtn: true,
          buttonInfo: {
            color: 'primary',
          },
        },
      },
      {
        iconProps: { icon: faTrash },
        text: this.translocoService.t('global.delete.btn'),
        onClick: (data) => {
          if (data.id !== null) this.showDeleteConfirmation(data.id!);
        },
        hasPermission: (data) => {
          return (
            data.status !== JournalStatus.NEW &&
            this.rbacService.hasPermission(
              RESOURCE_PERMISSION.JOURNAL.DELETE.DELETE_JOURNAL,
            )
          );
        },
      },
    ];
  }
  // #endregion
  private async showDeleteConfirmation(id: ObjId) {
    return await this.feedbackService.openFeedbackModal(
      {
        type: 'warning',
        modalTitle: '',
        modalMessage: this.translocoService.t(
          'journals.delete_journal_msg.txt',
        ),
        primaryBtnStr: this.translocoService.t('global.delete.btn'),
        secondaryBtnStr: this.translocoService.t('global.cancel.btn'),
        icon: faWarning,
      },
      () => {
        this.journalService
          .deleteJournal(id)
          .pipe(first())
          .subscribe({
            next: () => {
              this.toastr.success(
                this.translocoService.t(
                  'journals.delete_journal_successfully.txt',
                ),
              );
              this.viewContainerListRef()?.triggerFetch();
            },
            error: (err) => {
              this.toastr.showBackendError(err);
            },
          });
      },
    );
  }
}
