import {
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, Platform } from '@ionic/angular/standalone';
import { HesTableComponent } from '@ui-kit/hes-table/hes-table.component';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { INoRowsOverlay, ITableCol } from '@ui-kit/hes-table/model';
import {
  RecordingStatus,
  VCRLectureDTO,
  VCRLecturesResponseDTO,
} from '../data-access/manage-recording.dto';
import { VcrAPIService } from '../data-access/vcr.api-service';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { LectureSessionTableCellComponent } from '../components/lecture-session-table-cell/lecture-session-table-cell.component';
import { IAction } from '@ui-kit/hes-action-sheet/model';
import { faEye, faUpload } from '@fortawesome/pro-light-svg-icons';
import { createMediaAttachmentDialog } from '@shared/components/media-attachment-dialog/media-attachment-dialog';
import { IAttachmentControlUploadedValue } from '@ui-kit/hes-attachment-form-control/attachment-control-value.interface';
import { tap } from 'rxjs';
import {
  SizeColumnsToContentStrategy,
  SizeColumnsToFitGridStrategy,
} from 'ag-grid-community';
import { createViewRecordingModal } from '../utils/view-recording.modal';
import { UploadRecordingStatusTableCellComponent } from '@pages/vcr/components/upload-recording-table-cell/upload-recording-status-table-cell.component';

@Component({
  selector: 'app-manage-recordings',
  templateUrl: './manage-recordings.page.html',
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    FormsModule,
    HesTableComponent,
    TranslocoDirective,
  ],
})
export class ManageRecordingsPage implements OnInit {
  // #region input
  vcrId = input<number>();
  // #endregion
  // #region injection
  private readonly translateService = inject(HesTranslateService);
  private readonly translocoService = inject(TranslocoService);
  private readonly vcrApiService = inject(VcrAPIService);
  private readonly platform = inject(Platform);
  private readonly viewRecordingModal = createViewRecordingModal();
  private readonly mediaAttachmentDialog = createMediaAttachmentDialog({
    header: this.translateService.t(
      'virtual_classrooms.upload_recording.title',
    ),
    subHeader: this.translateService.t(
      'virtual_classrooms.upload_recording.txt',
    ),
    mediaType: 'video',
    titleInput: {
      placeholder: this.translateService.t('global.enter_title.placeholder'),
      label: this.translateService.t('global.title.label'),
    },
    attachmentConfig: {
      label: '',
      uploadUrl: this.vcrApiService.getUploadVideoUrl(),
      isMultiple: false,
    },
    toastMessages: {
      success: this.translateService.t(
        'virtual_classrooms.recording_uploaded_successfully.txt',
      ),
    },
  });
  // #endregion

  // #region public properties
  autoSizeStrategy = signal<
    SizeColumnsToFitGridStrategy | SizeColumnsToContentStrategy | undefined
  >({ type: 'fitGridWidth' });
  readonly isLoading = signal<boolean>(false);
  readonly rowsData = signal<ManageRecordingTableItem[]>([]);
  colDef = computed<ITableCol<ManageRecordingTableItem>[]>(() => {
    return [
      {
        field: 'lecture',
        sortable: false,
        filter: false,
        headerName: this.translate('virtual_classrooms.lecture.title'),
        cellRenderer: LectureSessionTableCellComponent,
      },
      {
        field: 'uploadedOn',
        sortable: false,
        filter: false,
        headerName: this.translate('virtual_classrooms.uploaded_on.label'),
        type: 'date',
      },
      {
        field: 'status',
        sortable: false,
        filter: false,
        headerName: this.translate('virtual_classrooms.recording_status.label'),
        cellRenderer: UploadRecordingStatusTableCellComponent,
      },
      {
        field: '',
        headerName: this.translate('global.actions.title'),
        sortable: false,
        filter: false,
        type: 'action',
        actions: this.actions(),
      },
    ];
  });

  readonly actions = computed<IAction<ManageRecordingTableItem>[]>(() => {
    return [
      {
        hasPermission: (data) => {
          return data.status === 'PENDING';
        },
        button: {
          label: this.translate('global.upload.btn'),
          isDisabled: (data) => {
            return !data.enableUploadButton!;
          },
        },
        text: this.translate('global.upload.btn'),
        onClick: (rowData) => {
          this.uploadRecording(rowData);
        },
      },
      {
        hasPermission: (data) => {
          return data.status !== 'PENDING';
        },
        iconProps: { icon: faUpload },
        text: this.translate('global.uploaded.txt'),
        onClick: (rowData) => {
          this.uploadRecording(rowData);
        },
      },
      {
        hasPermission: (data) => {
          return data.status === 'UPLOADED';
        },
        iconProps: { icon: faEye },
        text: this.translate('global.view.btn'),
        onClick: (data) => {
          this.viewRecordingModal({
            headerTitle: this.translocoService.translate(
              'virtual_classrooms.upload_recording.title',
            ),
            subTitle: this.translocoService.translate(
              'virtual_classrooms.upload_recording.txt',
            ),
            sessionId: data.id,
          });
        },
      },
    ];
  });

  noRowsOverlayComponentParams = signal<INoRowsOverlay>({
    imgSrc: 'assets/illustrations/no_data.svg',
  });
  // #endregion
  constructor() {}

  ngOnInit() {
    this.platform.width() <= 1440
      ? this.autoSizeStrategy.set({ type: 'fitCellContents' })
      : this.autoSizeStrategy.set({ type: 'fitGridWidth' });
    this.fetchRecordings();
  }

  // #region private methods
  fetchRecordings() {
    this.vcrApiService.fetchLecturesByVcrId(this.vcrId()!).subscribe((resp) => {
      this.rowsData.set(this.mapToTableRow(resp.data));
    });
  }

  translate(key: string) {
    return this.translateService.t(key);
  }

  private mapToTableRow(
    data: VCRLecturesResponseDTO['data'],
  ): ManageRecordingTableItem[] {
    return data.map((item) => {
      return {
        id: item.id,
        title: item.lastUploadedTitle,
        uploadedOn: item.lastUploadedOn,
        status: item.recordingStatus,
        lecture: { ...item.lecture, date: item.date },
        enableUploadButton: item.enableUploadButton,
      };
    });
  }

  private uploadRecording(
    rowData: ManageRecordingTableItem,
    mediaAttachmentFormData?: IAttachmentControlUploadedValue[],
  ) {
    this.mediaAttachmentDialog({
      ...(mediaAttachmentFormData && { mediaAttachmentFormData }),
      recordUpdateCallback: (data) => {
        return this.vcrApiService
          .uploadingLectureRecoding(rowData.id, data)
          .pipe(
            tap(() => {
              this.fetchRecordings();
            }),
          );
      },
    });
  }
  // #endregion
}

// #region internal
export interface ManageRecordingTableItem {
  id: number;
  title: string;
  uploadedOn: string;
  status: RecordingStatus;
  lecture: VCRLectureDTO['lecture'] & { date: string };
  enableUploadButton: boolean;
}
// #endregion
