import { Component, inject } from '@angular/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ICellRendererParams } from 'ag-grid-community';

import { ActivatedRoute, Router } from '@angular/router';
import { CMSAssignmentsService } from '@pages/course-management/data-access/cms/cms-assignments.service';
import { StudentSubmissionStatus } from '@pages/course-management/data-access/lms-exam.dto';
import { HesFileService } from '@shared/services/hes-file.service';

@Component({
  selector: 'app-view-submission-cell',
  templateUrl: './view-submission-cell.component.html',
  standalone: true,
  imports: [TranslocoDirective],
})
export class ViewSubvmissionCellComponent {
  private readonly fileService = inject(HesFileService);
  router = inject(Router);
  assignmentService = inject(CMSAssignmentsService);
  private readonly route = inject(ActivatedRoute);
  private readonly translocoService = inject(TranslocoService);
  id: number;
  status: StudentSubmissionStatus;
  data: any;
  StudentSubmissionStatus = StudentSubmissionStatus;
  agInit(params: ICellRendererParams<any>): void {
    this.id = params.value;
    this.status = params.data.status;
    this.data = params.data;
  }
  translate(key: string, params: object = {}): string {
    return this.translocoService.translate(key, params);
  }

  navigateToSubmission() {
    if (this.data.assignmentType === 'WORKSHEET') {
      this.assignmentService
        .getCmsStudentAssignmentSubmission(
          this.data.assignmentId,
          this.data.studentId,
        )
        .subscribe({
          next: (response: any) => {
            response.data.worksheet.attachments.forEach((attachment: any) => {
              const fileName = attachment.key.split('/').pop();
              this.fileService.downloadFile({
                url: attachment.url,
                fileName,
              });
            });
          },
        });
    } else {
      this.router.navigate([this.data.studentId, 'assignment-result'], {
        relativeTo: this.route,
      });
    }
  }
}
