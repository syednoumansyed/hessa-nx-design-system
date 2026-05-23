/**
 * Student Selector Component
 *
 * A responsive component that displays a list of students for selection.
 * Automatically adapts layout based on device type (mobile/desktop).
 *
 * @inputs:
 * - students: Student[] - Array of student objects to display
 * - defaultSelectedId: string - ID of the student to select by default (defaults to '0' for "All")
 * - enableAllOption: boolean - Whether to show "All Students" option (defaults to true)
 *
 * @outputs:
 * - studentSelected: EventEmitter<Student> - Emits the selected student object when user makes a selection
 *
 * @behavior:
 * - Conditionally adds an "All Students" option at the beginning of the list based on enableAllOption
 * - Mobile: Horizontal scrollable cards with truncated names
 * - Desktop: Vertical list with full student details (class, level)
 * - First student in list shows a special heart icon instead of avatar when "All" option is enabled
 */

import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { AvatarComponent } from '../avatar/avatar.component';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { TranslocoDirective } from '@jsverse/transloco';
import { LayoutService } from '@layout/layout.service';
import { UserProfileColors } from '@shared/enums';
import { UserStatus } from '@shared/enums';

export interface Student {
  id: string;
  fullName: string;
  class: string;
  level: string;
  imageUrl: string;
  profileColor?: UserProfileColors;
  status?: UserStatus;
}

@Component({
  selector: 'app-ds-student-selector',
  templateUrl: './student-selector.component.html',
  standalone: true,
  imports: [CommonModule, AvatarComponent, TranslocoDirective],
})
export class DsStudentSelectorComponent implements OnChanges {
  @Input() students: Student[] = [];
  @Input() defaultSelectedId: string = '0';
  @Output() studentSelected = new EventEmitter<Student>();
  @Input() enableAllOption: boolean = false;

  private readonly layoutService = inject(LayoutService);

  readonly UserStatus = UserStatus;
  isMobile = this.layoutService.isMobileOrTablet;

  private readonly translocoService = inject(HesTranslateService);

  selectAllObject!: Student;
  selectedStudent?: Student;

  ngOnInit() {
    this.selectAllObject = {
      id: '0',
      fullName: this.isMobile()
        ? this.translocoService.t('global.all.txt')
        : this.translocoService.t('global.all_students.title'),
      class: 'none',
      level: 'none',
      imageUrl: `assets/icons/${this.isMobile() ? 'heart-two-tone-sm' : 'heart-two-tone'}.svg`,
    };

    if (this.enableAllOption) {
      if (
        !this.students.length ||
        this.students[0].id !== this.selectAllObject.id
      ) {
        this.students = [this.selectAllObject, ...this.students];
      }
    }

    this.selectedStudent = this.students.find(
      (student) => student.id === this.defaultSelectedId,
    );

    // If enableAllOption is true and no student is found, default to selectAllObject
    // If enableAllOption is false and no student is found, default to first student or undefined
    if (!this.selectedStudent) {
      this.selectedStudent = this.enableAllOption
        ? this.selectAllObject
        : this.students[0];
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['defaultSelectedId'] && this.students?.length) {
      const nextId = changes['defaultSelectedId'].currentValue as string;
      const nextSelected = this.students.find((s) => s.id === nextId);
      this.selectedStudent = nextSelected ?? this.selectedStudent;
    }
  }

  onSelectStudent(student: Student) {
    this.selectedStudent = student;
    this.studentSelected.emit(student);
  }
}
