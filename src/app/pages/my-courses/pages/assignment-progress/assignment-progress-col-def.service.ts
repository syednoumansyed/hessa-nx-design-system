import { Injectable, computed, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { ITableCol } from '@ui-kit/hes-table/model';

import { AssignmentStatusCellComponent } from './components/assignment-status-cell/assignment-status-cell.component';
import { SubmissionDateCellComponent } from './components/submission-date-cell/submission-date-cell.component';
import { ViewSubvmissionCellComponent } from './components/view-submission-cell/view-submission-cell.component';
import { getLocalizedFullName } from '@shared/utils/localization.util';

@Injectable()
export class AssignmentProgressTableColDefService {
  private readonly translocoService = inject(TranslocoService);
  columns = computed<ITableCol<any>[]>(() => [
    {
      field: 'fullName',
      headerName: this.translocoService.translate('global.student_name.title'),
      sortable: false,
      filter: false,
    },
    {
      field: 'status',
      headerName: this.translocoService.translate('global.status.title'),
      sortable: false,
      filter: false,
      cellRenderer: AssignmentStatusCellComponent,
    },
    {
      field: 'submissionDate',
      headerName: this.translate(
        'content_management.submission_date_time.title',
      ),
      sortable: false,
      filter: false,
      cellRenderer: SubmissionDateCellComponent,
    },
    {
      field: 'correctAnswers',
      headerName: this.translate('content_management.correct_answers.title'),
      sortable: false,
      filter: false,
    },
    {
      field: 'examId',
      headerName: this.translate('content_management.review.title'),
      sortable: false,
      filter: false,
      cellRenderer: ViewSubvmissionCellComponent,
    },
  ]);

  translate(key: string, params: object = {}): string {
    return this.translocoService.translate(key, params);
  }

  mapTableData(resp: any) {
    return resp.students.map((student: any) => {
      const submissionStats = student.submissionData?.submissionStats;
      const hasQuestions = (submissionStats?.totalQuestions ?? 0) > 0;
      const hasCorrectAnswerCount =
        typeof submissionStats?.correctAnswers === 'number';

      const correctAnswers =
        submissionStats && hasQuestions && hasCorrectAnswerCount
          ? `${submissionStats.correctAnswers}/${submissionStats.totalQuestions}`
          : '-';

      return {
        studentId: student.studentId,
        assignmentType: resp.assignment.type,
        assignmentId: resp.assignment.id,
        fullName: getLocalizedFullName(student),
        status: student.submissionData?.status,
        submissionDate: student.submissionData?.submissionDate,
        correctAnswers,
      };
    });
  }
}
