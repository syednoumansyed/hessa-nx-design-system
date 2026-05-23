import { CommonModule, NgSwitch, NgSwitchCase } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { VcrAPIService } from '@pages/vcr/data-access/vcr.api-service';
import { createViewRecordingModal } from '@pages/vcr/utils/view-recording.modal';
import { VCRTableItem } from '@pages/vcr/vcr-col-def.service';
import { RbacDirective } from '@shared/role-bace-acces-controller/rbac.directive';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-session-action-table-cell',
  templateUrl: './session-action-table-cell.component.html',
  standalone: true,
  imports: [NgSwitch, NgSwitchCase, TranslocoDirective, RbacDirective],
})
export class SessionActionTableCellComponent
  implements ICellRendererAngularComp
{
  // #region Injection
  private readonly translocoService = inject(TranslocoService);
  private readonly vcrService = inject(VcrAPIService);
  private readonly viewRecordingModal = createViewRecordingModal();
  // #endregion

  // #region Public properties
  data: VCRTableItem;
  sessionAction: SessionAction;
  viewRecrodingPermissionId = RESOURCE_PERMISSION.VCR.READ.VIEW_RECORDINGS;
  joinPermissionId = RESOURCE_PERMISSION.VCR.READ.JOIN_VCR;
  // #endregion

  // #region Public methods
  agInit(params: ICellRendererParams<any, any, any>): void {
    this.data = params.data;
    this.sessionAction = determineSessionAction(
      this.data.hasUpcomingSession,
      this.data.hasPastSession,
    );
  }

  refresh(params: ICellRendererParams<any, any, any>): boolean {
    return false;
  }

  onViewRecordingClick() {
    this.viewRecordingModal({
      headerTitle: this.translocoService.translate(
        'virtual_classrooms.upload_recording.title',
      ),
      subTitle: this.translocoService.translate(
        'virtual_classrooms.upload_recording.txt',
      ),
      vcrId: this.data.id,
    });
  }

  onJoinClick(): void {
    this.vcrService
      .saveLinkClick(this.data.id, this.data.vcrLectureId)
      .subscribe();
    window.open(this.data.meetingLink, '_blank');
  }
  // #endregion
}

// #region internal
type SessionAction = 'JOIN_ENABLED' | 'VIEW_RECORDING' | 'JOIN_DISABLED';

function determineSessionAction(
  hasUpcomingSession: boolean,
  hasPastSession: boolean,
): SessionAction {
  if (hasUpcomingSession) {
    return 'JOIN_ENABLED';
  } else if (!hasUpcomingSession && hasPastSession) {
    return 'VIEW_RECORDING';
  } else {
    return 'JOIN_DISABLED';
  }
}
// #endregion
