import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { combineLatest, skip } from 'rxjs';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import {
  StudentSelectionScope,
  StudentSelectionScopeService,
} from '@core/student-selection-scope.service';
import { AvatarComponent } from '@ds/avatar/avatar.component';
import { TranslocoDirective } from '@jsverse/transloco';
import { UserProfileColors } from '@shared/enums';

@Component({
  selector: 'app-selected-guardian-student',
  templateUrl: './selected-guardian-student.component.html',
  standalone: true,
  imports: [AvatarComponent, CommonModule, TranslocoDirective],
})
export class SelectedGuardianStudentComponent implements OnInit {
  // #region Injectables
  private studentSelectionScopeService = inject(StudentSelectionScopeService);
  // #endregion

  // #region Public Properties
  fullName = signal('');
  nationalId = signal('');
  levelName = signal('');
  className = signal('');
  profileColor = signal<UserProfileColors | undefined>(undefined);
  // #endregion

  // #region Public Methods
  ngOnInit(): void {}

  constructor() {
    combineLatest([
      toObservable(this.studentSelectionScopeService.selectedStudent),
    ])
      .pipe(takeUntilDestroyed())
      .subscribe(([currStudent]) => {
        this.updateStudentData(currStudent);
      });
  }
  // #endregion

  // #region Private Methods
  private updateStudentData(student: StudentSelectionScope | null): void {
    if (student) {
      this.fullName.set(student.fullName ?? '');
      this.nationalId.set(student.nationalId ?? '');
      this.levelName.set(student.school?.level?.displayName ?? '');
      this.className.set(student.school?.class?.displayName ?? '');
      this.profileColor.set(student.profileColor);
    }
  }
  // #endregion
}
