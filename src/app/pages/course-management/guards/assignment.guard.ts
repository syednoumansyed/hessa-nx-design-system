import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { isPast } from 'date-fns';
import { StudentSelectionScopeService } from '@core/student-selection-scope.service';
import { AuthService } from '@auth/auth.service';
import { LMSAssignmentService } from '../data-access/lms/lms-assignment.service';

// check if the assignment details are viewable
export const AssignmentGuard: CanActivateFn = (
  next: ActivatedRouteSnapshot,
  _state: RouterStateSnapshot,
) => {
  let studentId;
  const assignmentService = inject(LMSAssignmentService);
  const router: Router = inject(Router);
  const auth = inject(AuthService);
  if (auth.user()?.type === 'STUDENT') {
    studentId = auth.user()?.userTypeId;
  } else studentId = inject(StudentSelectionScopeService).selectedStudent()?.id;

  if (!studentId)
    return router.createUrlTree([
      'my-courses',
      next.params['courseId'],
      next.params['classId'],
    ]);
  return assignmentService
    .getAssignmentDetails(next.params['assignmentId'], studentId)
    .pipe(
      map((res) => {
        if (res?.data?.publishingDate) {
          const publishingDate = new Date(res?.data?.publishingDate);

          // Check if the publishing date is today or has passed
          if (isPast(publishingDate)) return true;
          else
            return router.createUrlTree([
              'my-courses',
              next.params['courseId'],
              next.params['classId'],
              'topics',
            ]);
        } else
          return router.createUrlTree([
            'my-courses',
            next.params['courseId'],
            next.params['classId'],
            'topics',
          ]);
      }),
      catchError((err) => {
        return of(
          router.createUrlTree([
            'my-courses',
            next.params['courseId'],
            next.params['classId'],
            'topics',
          ]),
        );
      }),
    );
};
