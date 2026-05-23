import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, OnInit } from '@angular/core';
import { ReportCardFunctionChipComponent } from '../report-card-function-chip/report-card-function-chip.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faBars,
  faEye,
  faEyeSlash,
  faPen,
  faTrashCan,
} from '@fortawesome/pro-regular-svg-icons';
import { createColumnModal } from '../../add-column/column-form.modal';
import { ManageReportCardContextService } from '@pages/report-card/configuration/services/manage-report-card-context.service';
import { HesActionSheetComponent } from '@ui-kit/hes-action-sheet/hes-action-sheet.component';
import { FeedbackService } from '@shared/services/feedback.service';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { IAction } from '@ui-kit/hes-action-sheet/model';
import {
  ReportCardColumnDetailDTO,
  ReportCardExistingColumnDTO,
} from '@pages/report-card/configuration/data-access/report-card-configuration.model';
import { TranslocoDirective } from '@jsverse/transloco';
import { ReportCardConfigurationAPIService } from '../../../../data-access/report-card-configuration.api-service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import {
  ReportCardDetail,
  SortedColumn,
} from '@pages/report-card/configuration/data-access/report-card-configuration.interface';

@Component({
  selector: 'app-report-card-column-list-item',
  templateUrl: './report-card-column-list-item.component.html',
  imports: [
    CommonModule,
    ReportCardFunctionChipComponent,
    FontAwesomeModule,
    HesActionSheetComponent,
    TranslocoDirective,
  ],
  standalone: true,
})
export class ReportCardColumnListItemComponent implements OnInit {
  // #region Inputs
  selectedColumn = input.required<
    ReportCardColumnDetailDTO | ReportCardExistingColumnDTO | SortedColumn
  >();
  reportCard = input.required<ReportCardDetail>();
  // #endregion

  // #region Protected Properties
  protected readonly barsIcon = faBars;
  protected readonly faEyeSlash = faEyeSlash;
  protected existingColumn = computed(() => {
    const selectedColumn = this.selectedColumn()!;
    if (
      'reportCardColumnId' in selectedColumn ||
      ('isExistingColumn' in selectedColumn && selectedColumn.isExistingColumn)
    )
      return selectedColumn as ReportCardExistingColumnDTO;
    return null;
  });

  protected column = computed(() => {
    const selectedColumn = this.selectedColumn()!;
    if (
      'reportCardColumnId' in selectedColumn ||
      ('isExistingColumn' in selectedColumn && selectedColumn.isExistingColumn)
    )
      return null;
    return selectedColumn as ReportCardColumnDetailDTO;
  });

  protected readonly title = computed(() => {
    return this.column()?.title || this.existingColumn()!.title;
  });

  protected readonly isHide = computed(() => {
    const selectedColumn = this.selectedColumn();
    return 'isHide' in selectedColumn ? selectedColumn.isHide : false;
  });
  // #endregion
  // #region Injector
  private readonly columnModal = createColumnModal();
  private readonly reportCardConfigurationAPIService = inject(
    ReportCardConfigurationAPIService,
  );
  private readonly contextService = inject(ManageReportCardContextService);
  private readonly feedbackService = inject(FeedbackService);
  private readonly translate = inject(HesTranslateService);
  private readonly toaster = inject(HesToasterService);
  // #endregion

  // #region Protected Properties
  protected readonly isView = this.contextService.isView;
  protected readonly isEdit = this.contextService.isEdit;
  protected readonly isCreate = this.contextService.isCreate;
  protected readonly EditIcon = faPen;
  actions = computed<IAction[]>(() => [
    {
      iconProps: { icon: faPen, flip: 'horizontal' },
      text: this.translate.globalTObj.edit,
      onClick: () => {
        this.columnModal({
          reportCard: this.reportCard(),
          column: this.column(),
          existingColumn: this.existingColumn(),
        });
      },
      hasPermission: () => {
        return true;
      },
    },
    {
      iconProps: { icon: faTrashCan, flip: 'horizontal' },
      text: this.translate.globalTObj.delete,
      onClick: (_data) => {
        this.feedbackService.openFeedbackModal(
          {
            type: 'error',
            modalTitle: this.translate.t(
              'grade_management.delete_report_card_column.txt',
              { columnName: this.title() },
            ),
            primaryBtnStr: this.translate.globalTObj.delete,
            secondaryBtnStr: this.translate.globalTObj.cancel,
          },
          () => {
            const obs$ = this.column()
              ? this.deleteColumn()
              : this.deleteExtraColumn();
            obs$.subscribe({
              next: () => {
                this.toaster.success(
                  this.translate.t(
                    'grade_management.delete_column_success.txt',
                    {
                      columnName: this.title(),
                    },
                  ),
                );
                this.contextService.onRefatchReportCardDetail();
              },
              error: (error) => {
                this.toaster.showBackendError(error);
              },
            });
          },
        );
      },
      hasPermission: () => {
        return true;
      },
    },
    {
      iconProps: { icon: this.isHide() ? faEye : faEyeSlash },
      text: this.isHide()
        ? this.translate.t('grade_management.unhide_from_view.txt')
        : this.translate.t('grade_management.hide_from_view.txt'),
      onClick: () => {
        this.toggleHideColumn();
      },
      hasPermission: () => {
        return true;
      },
    },
  ]);
  // #endregion
  constructor() {}

  ngOnInit() {}

  // #region Private methods
  private deleteExtraColumn() {
    const id = this.existingColumn()!.id;
    return this.reportCardConfigurationAPIService.deleteExistingColumn(id);
  }

  private deleteColumn() {
    const id = this.column()!.id;
    return this.reportCardConfigurationAPIService.deleteReportCardColumn(id);
  }

  private toggleHideColumn() {
    const selectedColumn = this.selectedColumn();
    const id = selectedColumn.id;
    const newHideState = !this.isHide();

    this.reportCardConfigurationAPIService
      .hideColumn(id, newHideState)
      .subscribe({
        next: () => {
          this.contextService.onRefatchReportCardDetail();
        },
        error: (error) => {
          this.toaster.showBackendError(error);
        },
      });
  }

  // #endregion
}
