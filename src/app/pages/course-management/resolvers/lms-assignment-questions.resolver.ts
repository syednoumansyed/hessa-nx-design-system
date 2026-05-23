import { inject } from '@angular/core';
import type { ResolveFn } from '@angular/router';
import { StudentSelectionScopeService } from '@core/student-selection-scope.service';
import { LMSAssignmentService } from '../data-access/lms/lms-assignment.service';

export const LMSAssignmentQuestionsResolver: ResolveFn<any> = (
  route,
  _state,
) => {
  const studentId = inject(StudentSelectionScopeService).selectedStudent()?.id;

  return inject(LMSAssignmentService).getAssignmentQuestions(
    route.params['assignmentId'],
    studentId!,
  );
};
