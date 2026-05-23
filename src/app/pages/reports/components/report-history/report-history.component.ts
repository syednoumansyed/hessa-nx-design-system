import { Component, inject, OnInit, signal, viewChild } from '@angular/core';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { ITableCol } from '@ui-kit/hes-table/model';
import { ReportGenerationStatusComponent } from '../report-generation-status/report-generation-status.component';
import { IAction } from '@ui-kit/hes-action-sheet/model';
import {
  faCircleExclamation,
  faCloudDownload,
  faEye,
} from '@fortawesome/pro-regular-svg-icons';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { TranslocoDirective } from '@jsverse/transloco';
import {
  InlineFilterConfig,
  ListViewContainerComponent,
} from '@ui-kit/hes-responsive-list-view/list-view-container/list-view-container.component';
import { ReportsService } from '@pages/reports/reports.service';
import {
  ReportGenerationStatus,
  ReportItemDTO,
  ReportResponseDTO,
  ReportType,
} from '@pages/reports/reports';
import { map } from 'rxjs';
import { enumArrayFromEnum } from '@shared/enums';
import { formatDate } from 'date-fns';
import { TuiDay } from '@taiga-ui/cdk';
import { HesFileService } from '@shared/services/hes-file.service';
import { createReportHistoryDetailModal } from '../report-history-details/report-history-detail.modal';
import { FeedbackService } from '@shared/services/feedback.service';
import { getSerialNumberFromPaginate } from '@shared/utils/serial-number.util';

@Component({
  selector: 'app-report-history',
  templateUrl: './report-history.component.html',
  standalone: true,
  imports: [TranslocoDirective, ListViewContainerComponent],
})
export class ReportHistoryComponent implements OnInit {
  // #region Inputs and Outputs

  // #endregion

  // #region Injectables
  private readonly reportsService = inject(ReportsService);
  private readonly translate = inject(HesTranslateService);
  private readonly toaster = inject(HesToasterService);
  private readonly rbacService = inject(RoleBaseAccessControlService);
  private readonly fileService = inject(HesFileService);
  private readonly reportHistoryDetailModal = createReportHistoryDetailModal();
  private readonly feedbackService = inject(FeedbackService);
  // #endregion

  // #region Angular reference
  listViewRef = viewChild(ListViewContainerComponent);
  // #endregion

  // #region Protected Properties
  protected reportHistoryColumns: ITableCol<IReportCardHistoryTableData>[];
  protected readonly pausePolling = signal<boolean>(false);
  protected readonly inlineFilterConfig: InlineFilterConfig = {
    type: 'date-range',
    clear: true,
    noDefault: true,
    datePickerConfig: {
      max: TuiDay.currentLocal(),
    },
  };

  protected fetchReportHistory = (params: any) => {
    const { endDate, startDate, ...restParams } = params;
    if (startDate && endDate) {
      restParams.dateFrom = formatDate(startDate * 1000, 'yyyy-MM-dd');
      restParams.dateTo = formatDate(endDate * 1000, 'yyyy-MM-dd');
    }
    return this.reportsService.fetchReportHistory(restParams).pipe(
      map((resp: ReportResponseDTO) => {
        const mapped = this.mapReportHistoryResponse(resp);
        return {
          data: mapped,
          paginate: resp.paginate,
        };
      }),
    );
  };

  protected shouldPoll = (data: IReportCardHistoryTableData[]) => {
    const isPoll = data.some(
      (item) => item.status === ReportGenerationStatus.IN_PROGRESS,
    );
    return isPoll;
  };

  // #endregion

  ngOnInit() {
    this.reportHistoryColumns = [
      {
        headerName: this.translate.t('global.serial_num.title'),
        field: 'sNo',
        sortable: false,
        filter: false,
        maxWidth: 120,
      },
      {
        headerName: this.translate.t('global.report_name.title'),
        field: 'reportType',
        sortable: false,
        filter: true,
        filterType: 'chip-selector',
        isMultpleFilterSelect: true,
        filterSelectOptions: Object.values(ReportType).map((value) => ({
          value: value as string,
          displayedValue: this.translate.t(
            'reports.' + value.toLowerCase() + '.title',
          ),
        })),
      },
      {
        headerName: this.translate.t('report.date_generated.label'),
        field: 'dateGenerated',
        type: 'dateTime',
        sortable: false,
        filter: false,
      },
      {
        headerName: this.translate.t('global.status.title'),
        field: 'status',
        sortable: false,
        filter: true,
        filterType: 'chip-selector',
        isMultpleFilterSelect: true,
        filterSelectOptions: enumArrayFromEnum(ReportGenerationStatus).map(
          (status) => ({
            value: status as string | number,
            displayedValue: this.translate.enumT(status as string),
          }),
        ),
        cellRenderer: ReportGenerationStatusComponent,
      },
      {
        headerName: this.translate.t('global.actions.title'),
        field: 'actions',
        type: 'action',
        actions: this.actions,
        sortable: false,
        filter: false,
      },
    ];
  }

  // #region Private Properties
  private readonly actions: IAction<IReportCardHistoryTableData>[] = [
    {
      text: this.translate.t('reports.check_reason.title'),
      onClick: ({ reasonMessage }) => {
        this.showReason(reasonMessage);
      },
      hasPermission: (data: IReportCardHistoryTableData) => {
        if (data.reasonMessage) {
          return true;
        }
        return false;
      },
      button: {
        label: this.translate.t('reports.check_reason.title'),
        color: 'link',
        size: 'sm',
      },
      mobileViewConfig: {
        isPrimaryBtn: true,
        buttonInfo: {
          color: 'primary',
        },
      },
    },
    {
      iconProps: { icon: faCloudDownload },
      text: this.translate.t('global.download.btn'),
      hasPermission: (data) => {
        if (data.reasonMessage) {
          return false;
        }
        return data.status === ReportGenerationStatus.COMPLETED;
      },
      onClick: ({ fileUrl }) => {
        this.fileService.downloadFile({ url: fileUrl as string });
      },
    },
    {
      iconProps: { icon: faEye },
      text: this.translate.t('global.view.btn'),
      hasPermission: (data) => {
        if (data.reasonMessage) {
          return false;
        }
        return data.status === ReportGenerationStatus.COMPLETED;
      },
      onClick: ({ data }) => {
        this.reportHistoryDetailModal({
          report: data,
        });
      },
    },
  ];

  private mapReportHistoryResponse(
    resp: ReportResponseDTO,
  ): IReportCardHistoryTableData[] {
    return resp.data.map((data, index) => ({
      sNo: getSerialNumberFromPaginate(index, resp.paginate),
      reportType: this.translate.t(
        'reports.' + data.reportType.toLowerCase() + '.title',
      ),
      dateGenerated: data.createdAt,
      fileUrl: data.key,
      status: data.reportStatus,
      reasonMessage: data.messageRef ?? data.reason ?? '',
      data,
    }));
  }

  private showReason(message: string) {
    this.feedbackService.openFeedbackModal({
      type: 'warning',
      modalTitle: this.translate.t(message),
      primaryBtnStr: this.translate.t('global.ok.btn'),
      icon: faCircleExclamation,
    });
  }
  // #endregion

  public reload = () => {
    this.listViewRef()?.triggerFetch();
  };

  public onPausePolling = () => {
    this.pausePolling.set(true);
  };
  public onResumePolling = () => {
    this.pausePolling.set(false);
  };
}

interface IReportCardHistoryTableData {
  sNo: number;
  reportType: string;
  dateGenerated: string;
  status: ReportGenerationStatus;
  action?: {
    downloadUrl: string;
    canRetry: boolean;
  };
  fileUrl?: string;
  data: ReportItemDTO;
  reasonMessage: string;
}
