import { Injectable, computed, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { ITableCol } from '@ui-kit/hes-table/model';

import { ExamStatusCellComponent } from './components/exam-status-cell/exam-status-cell.component';
import { SubmissionDateCellComponent } from './components/submission-date-cell/submission-date-cell.component';
import { TimeSpentCellComponent } from './components/time-spent-cell/time-spent-cell.component';
import { ViewSubvmissionCellComponent } from './components/view-submission-cell/view-submission-cell.component';
import { getLocalizedFullName } from '@shared/utils/localization.util';

@Injectable()
export class ExamProgressTableColDefService {
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
      cellRenderer: ExamStatusCellComponent,
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
      field: 'attempts',
      headerName: this.translate('content_management.attempts.title'),
      sortable: false,
      filter: false,
    },
    {
      field: 'timeSpent',
      headerName: this.translate('content_management.time_spent.title'),
      sortable: false,
      filter: false,
      cellRenderer: TimeSpentCellComponent,
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
      const attemptsTaken = student.submissionData?.attemptsTaken;
      const allowedAttempts = resp.exam.allowedAttempts;

      const attempts =
        allowedAttempts == null
          ? '-'
          : `${attemptsTaken ?? 0}/${allowedAttempts}`;
      return {
        studentId: student.studentId,
        examId: resp.exam.id,
        fullName: getLocalizedFullName(student),
        status: student.submissionData?.status,
        submissionDate: student.submissionData?.submissionDate,
        attempts,
        timeSpent: student.submissionData?.timeSpent || '-',
        correctAnswers: student.submissionData?.submissionStats
          ? `${student.submissionData?.submissionStats.correctAnswers}/${student.submissionData?.submissionStats.totalQuestions}`
          : '-',
      };
    });
  }
}
