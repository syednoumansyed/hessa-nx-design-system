import { Component, DestroyRef, inject, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  InlineFilterConfig,
  ListViewContainerComponent,
} from '@ui-kit/hes-responsive-list-view/list-view-container/list-view-container.component';
import { TranslocoDirective } from '@jsverse/transloco';
import { SchoolStructureListingService } from '@core/school-structure-listing.service';
import { JournalApiService } from '@pages/journal/data-access/journal-api.service';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { ITableCol } from '@ui-kit/hes-table/model';
import {
  createJournalDateRenderer,
  IJournalListItem,
  mapJournalsToListItems,
} from '@pages/journal/data-access/journal-list.utils';
import { StatusTableCellComponent } from '@pages/journal/components/status-table-cell/status-table-cell.component';
import { map, skip } from 'rxjs';
import { IAction } from '@ui-kit/hes-action-sheet/model';
import { StudentSelectionScopeService } from '@core/student-selection-scope.service';
import { SelectedGuardianStudentComponent } from '@shared/components/selected-guardian-student/selected-guardian-student.component';
import { HesDatePipe } from '@shared/pipes/hessa-date.pipe';
import { getDateRangeToDayStartEnd } from '@shared/utils/date-range.util';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

@Component({
  templateUrl: './user-journal.page.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ListViewContainerComponent,
    TranslocoDirective,
    ReactiveFormsModule,
    SelectedGuardianStudentComponent,
  ],
  providers: [SchoolStructureListingService, HesDatePipe],
})
export class UserJournalPage {
  // #region injectables
  private readonly journalApiService = inject(JournalApiService);
  private readonly translocoService = inject(HesTranslateService);
  private readonly academicYearScope = inject(AcademicYearsScopeService);
  private readonly schoolScopeService = inject(SchoolStructureScopeService);
  private readonly studentSelectionScopeService = inject(
    StudentSelectionScopeService,
  );
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly journalDateRenderer = createJournalDateRenderer();

  // #endregion

  // #region Public Properties

  readonly inlineFilterConfig: InlineFilterConfig = {
    type: 'date-range',
    clear: true,
    noDefault: true,
  };

  readonly columns: ITableCol<IJournalListItem>[] = [
    {
      field: 'journalDate',
      headerName: this.translocoService.t('journals.journal_date.title'),
      sortable: true,
      filter: false,
      type: 'date',
      cellRenderer: this.journalDateRenderer,
    },
    {
      field: 'publishDate',
      headerName: this.translocoService.t('global.publish_date.title'),
      sortable: false,
      filter: false,
      filterType: 'date',
      type: 'date',
    },
    {
      field: 'type',
      headerName: this.translocoService.t('journals.journal_type.title'),
      sortable: false,
      filter: false,
    },
    {
      field: 'status',
      headerName: this.translocoService.t('global.status.title'),
      sortable: false,
      filter: true,
      filterType: 'chip-selector',
      cellRenderer: StatusTableCellComponent,
      cellRendererParams: (data: IJournalListItem) => {
        return data;
      },
    },
    {
      field: 'acknowledgementComment',
      headerName: this.translocoService.t('global.comment.title'),
      sortable: false,
      filter: false,
    },
    {
      field: 'actions',
      headerName: this.translocoService.t('global.actions.title'),
      sortable: false,
      filter: false,
      type: 'action',
      actions: this.getActions(),
    },
  ];

  protected readonly noDataConfig = {
    title: this.translocoService.t('journals.no_journals.title'),
    description: this.translocoService.t('journals.no_tickets.msg.txt'),
  };
  // #endregion

  // #region Angular ref
  private readonly viewContainerListRef = viewChild<ListViewContainerComponent>(
    ListViewContainerComponent,
  );
  // #endregion

  // #region Public Methods

  constructor() {
    toObservable(this.studentSelectionScopeService.selectedStudent)
      .pipe(takeUntilDestroyed(this.destroyRef), skip(1))
      .subscribe(() => {
        this.viewContainerListRef()?.onFilterChange();
      });
  }

  fetchJournalList = (params: any) => {
    const { id: studentId } =
      this.studentSelectionScopeService.selectedStudent() || {};
    return this.journalApiService
      .getGuaridanJournals({
        ...params,
        schoolId: this.schoolScopeService.selectedSchoolId(),
        academicYearId: this.academicYearScope.selectedAcademicYear()!.id,
        ...(studentId && { studentId }),
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
        text: this.translocoService.t('global.view.btn'),
        onClick: (data) => {
          // Todo: implement
          this.router.navigate(['journal', 'view', data.id]);
        },
        button: {
          label: this.translocoService.t('global.view.btn'),
          color: 'primary',
        },
        mobileViewConfig: {
          isPrimaryBtn: true,
          buttonInfo: {
            color: 'primary',
          },
        },
      },
    ];
  }
  // #endregion
}
