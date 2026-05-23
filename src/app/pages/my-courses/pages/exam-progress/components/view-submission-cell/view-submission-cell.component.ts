import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ICellRendererParams } from 'ag-grid-community';

import { ActivatedRoute, Router } from '@angular/router';
import { StudentSubmissionStatus } from '@pages/course-management/data-access/lms-exam.dto';

@Component({
  selector: 'app-view-submission-cell',
  templateUrl: './view-submission-cell.component.html',
  standalone: true,
  imports: [CommonModule, TranslocoDirective],
})
export class ViewSubvmissionCellComponent {
  router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly translocoService = inject(TranslocoService);
  data: any;
  status: StudentSubmissionStatus;
  StudentSubmissionStatus = StudentSubmissionStatus;
  agInit(params: ICellRendererParams<any>): void {
    this.status = params.data.status;
    this.data = params.data;
  }
  translate(key: string, params: object = {}): string {
    return this.translocoService.translate(key, params);
  }

  navigateToSubmission() {
    this.router.navigate([this.data.studentId, 'exam-result'], {
      relativeTo: this.route,
    });
  }
}
