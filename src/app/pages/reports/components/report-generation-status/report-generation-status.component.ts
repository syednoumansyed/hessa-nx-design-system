import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ReportGenerationStatus } from '@pages/reports/reports';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-report-generation-status',
  templateUrl: './report-generation-status.component.html',
  standalone: true,
  imports: [CommonModule],
})
export class ReportGenerationStatusComponent
  implements ICellRendererAngularComp
{
  // #region Private Properties
  private readonly translateService = inject(HesTranslateService);
  // #endregion

  // #reion Protected Properties
  protected status: ReportGenerationStatus;
  // #endregion

  agInit(params: ICellRendererParams<any, any, any>): void {
    const data = params.value;
    if (data) {
      this.status = data;
    }
  }
  refresh(params: ICellRendererParams<any, any, any>): boolean {
    return false;
  }

  // #region Protected Methods
  protected get statusName() {
    return this.translateService.enumT(this.status);
  }

  protected getClassMap(): string {
    switch (this.status) {
      case ReportGenerationStatus.IN_PROGRESS:
        return 'bg-[#EFF8FF] text-[#175CD3]';
      case ReportGenerationStatus.FAILED:
        return 'bg-[#FEF3F2] text-[#B42318]';
      case ReportGenerationStatus.COMPLETED:
        return 'bg-[#ECFDF3] text-[#027A48]';
      default:
        return '';
    }
  }
  // #endregion
}
