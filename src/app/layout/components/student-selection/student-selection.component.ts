import { Component, OnInit, computed, inject } from '@angular/core';
import { StudentSelectionScopeService } from '@core/student-selection-scope.service';
import { HesSearchableSelectComponent } from '../../../ui-kit/hes-searchable-select/hes-searchable-select.component';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { sideMenuSchoolStructureItem } from '@layout/layout.component';
import { isMobile } from '@shared/utils/platform';

@Component({
  selector: 'app-student-selection',
  templateUrl: './student-selection.component.html',
  styleUrls: ['./student-selection.component.scss'],
  standalone: true,
  imports: [HesSearchableSelectComponent],
})
export class StudentSelectionComponent implements OnInit {
  private studentSelectionScope = inject(StudentSelectionScopeService);
  private schoolStructureScopeService = inject(SchoolStructureScopeService);

  isMobile = isMobile();

  studentsOptions = computed(() => {
    return this.studentSelectionScope.studentSelectionScope().map((s) => {
      return {
        value: s.id,
        displayedValue: s.fullName,
      };
    });
  });

  selectedStudent = this.studentSelectionScope.selectedStudent;

  constructor() {}

  ngOnInit() {}

  onStudentChange(studentId: number) {
    this.studentSelectionScope.updateSelectedStudent(studentId);

    if (studentId) {
      this.schoolStructureScopeService.updateSelectedStructure({
        id: this.selectedStudent()?.school?.id,
        type: 'school',
      } as sideMenuSchoolStructureItem);
    }
  }
}
