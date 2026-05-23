import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import {
  catchError,
  EMPTY,
  filter,
  map,
  Observable,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { StudentSelectionScopeService } from './student-selection-scope.service';
import { UserStatus } from '@shared/enums';
import { IResponse, StudentStatusResponse } from '@shared/interfaces';
import { ApiUrl } from '@shared/utils/api-url.util';
import { ObjId } from '@shared/interfaces/common.interface';

@Injectable({
  providedIn: 'root',
})
export class StudentStatusService {
  private readonly http = inject(HttpClient);
  private readonly studentScope = inject(StudentSelectionScopeService);

  readonly selectedStudentStatus = computed(
    () => this.studentScope.selectedStudent()?.status,
  );

  readonly isStudentActive = computed(() => {
    const status = this.selectedStudentStatus();
    return !status || status === UserStatus.ACTIVE;
  });

  readonly suspensionData = signal<StudentStatusResponse | null>(null);

  constructor() {
    toObservable(this.studentScope.selectedStudent)
      .pipe(
        takeUntilDestroyed(),
        tap(() => this.suspensionData.set(null)),
        filter((student) => {
          const status = student?.status;
          return status === UserStatus.INACTIVE || status === UserStatus.PAUSED;
        }),
        switchMap((student) => {
          const studentId = student?.id;
          if (!studentId) return EMPTY;
          return this.fetchStudentStatus(studentId).pipe(
            catchError(() => of(null)),
          );
        }),
      )
      .subscribe((data) => {
        if (data) this.suspensionData.set(data);
      });
  }

  private fetchStudentStatus(
    studentId: ObjId,
  ): Observable<StudentStatusResponse> {
    return this.http
      .get<
        IResponse<StudentStatusResponse>
      >(`${ApiUrl.v2BE}/students/${studentId}/status`)
      .pipe(map((res) => res.data));
  }
}
