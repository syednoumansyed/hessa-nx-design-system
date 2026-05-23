import { Component, Input } from '@angular/core';
import { IonContent, IonHeader } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { TranslocoDirective } from '@jsverse/transloco';
import { HesDateViewerComponent } from '@ui-kit/hes-date-viewer/hes-date-viewer.component';
import { HesAttachmentPreviewComponent } from '@ui-kit/hes-attachment-form-control/attachment-preview/attachment-preview.component';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { IAttachmentControlUploadedValue } from '@ui-kit/hes-attachment-form-control/attachment-control-value.interface';
import { isMobile } from '@shared/utils/platform';
import { FaIconComponentsProps } from '@shared/types';
import { faAngleLeft, faX } from '@fortawesome/pro-regular-svg-icons';
import { SubmissionStatusComponent } from '../../submission-status/submission-status.component';

@Component({
  selector: 'app-cms-worksheet-or-offline-exam-preview',
  templateUrl: './cms-worksheet-or-offline-exam-preview.component.html',
  standalone: true,
  imports: [
    IonHeader,
    IonContent,
    CommonModule,
    SubmissionStatusComponent,
    HesDateViewerComponent,
    HesAttachmentPreviewComponent,
    HesButtonModule,
    TranslocoDirective,
  ],
})
export class CMSWorksheetOrOfflineExamPreviewComponent {
  //#region Inputs
  @Input() modalTitle: string;
  @Input() gridData: IGridData[];
  @Input() worksheet?: IAttachmentControlUploadedValue[] | undefined;
  @Input() closeFn: () => void;
  //#endregion

  //#region Icons
  readonly angleLeft: FaIconComponentsProps = {
    icon: faAngleLeft,
    size: 'xl',
  };

  readonly closeIcon: FaIconComponentsProps = {
    icon: faX,
    size: 'xl',
  };

  //#endregion

  //#region Private Properties
  readonly isMobile = isMobile();
  //#endregion

  //#region Public Methods

  onCloseModal() {
    this.closeFn?.();
  }
  //#endregion
}

interface IGridData {
  title?: string | undefined;
  value?: string | undefined;
  type?: string | undefined;
}
