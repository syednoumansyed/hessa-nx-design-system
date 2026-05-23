import { Component, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IonImg } from '@ionic/angular/standalone';
import { TranslocoDirective } from '@jsverse/transloco';
import { DsButtonComponent } from '@ds/button/button.component';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { LayoutService } from '@layout/layout.service';
import { StudentSelectionScopeService } from '@core/student-selection-scope.service';
import { SchoolSelectorComponent } from '../../../ds-layout/components/school-selector/school-selector.component';

export type HesScope =
  | 'school'
  | 'school-structure'
  | 'academicYear'
  | 'semester'
  | 'student'
  | 'campus'
  | 'campus-or-school';

@Component({
  selector: 'app-no-selected-scope-card',
  templateUrl: './no-selected-scope-card.component.html',
  standalone: true,
  imports: [
    IonImg,
    DsButtonComponent,
    TranslocoDirective,
    CommonModule,
    SchoolSelectorComponent,
  ],
})
export class NoSelectedScopeCardComponent {
  private readonly schoolStructureScope = inject(SchoolStructureScopeService);
  private readonly academicYearsScopeService = inject(
    AcademicYearsScopeService,
  );
  private readonly studentScopeService = inject(StudentSelectionScopeService);
  private readonly layoutService = inject(LayoutService);

  // Define school structure related scopes
  private readonly schoolStructureScopes: HesScope[] = [
    'school',
    'school-structure',
    'campus',
    'campus-or-school',
  ];

  requiredScope = input<Array<HesScope>>();
  // this will be used only for pages with hes-table
  // as ag-grid does not work with content projection
  // in other cases you can just project your content into this component
  onScopeUpdate = output<boolean>();

  title = computed(() => {
    const unselectedScope = this.unSelectedScope();
    switch (unselectedScope) {
      case 'school':
        return 'global.school_not_selected.title';
      case 'school-structure':
        return 'global.company_campus_school_not_selected..txt';
      case 'academicYear':
        return 'global.academic_year_not_selected.title';
      case 'semester':
        return 'global.semester_not_selected.title';
      case 'student':
        return 'global.student_not_selected.txt';
      case 'campus':
        return 'global.campus_not_selected.title';
      case 'campus-or-school':
        return 'global.select_campus_school.title';
      default:
        return '';
    }
  });
  description = computed(() => {
    const unselectedScope = this.unSelectedScope();
    switch (unselectedScope) {
      case 'school':
        return 'global.select_school.txt';
      case 'school-structure':
        return 'global.please_select_company_campus.txt';
      case 'academicYear':
        return 'global.select_academic_year.txt';
      case 'semester':
        return 'global.select_semester.txt';
      case 'student':
        return 'global.select_a_student.txt';
      case 'campus':
        return 'global.select_campus.txt';
      case 'campus-or-school':
        return 'global.select_campus_school.txt';
      default:
        return '';
    }
  });
  btnLabel = computed(() => {
    const unselectedScope = this.unSelectedScope();
    switch (unselectedScope) {
      case 'school':
        return 'global.select_school.btn';
      case 'school-structure':
        return 'global.select_company_campus_school.btn';
      case 'academicYear':
        return 'global.select_academic_year.btn';
      case 'semester':
        return 'global.select_semester.btn';
      case 'student':
        return 'global.select_student.btn';
      case 'campus':
        return 'course_management.select_campus.dropdown';
      case 'campus-or-school':
        return 'global.select_campus_school.btn';
      default:
        return '';
    }
  });

  unSelectedScope = computed<HesScope | null>(() => {
    const requiredScopes = this.requiredScope();
    const selectedSchoolId = this.schoolStructureScope.selectedSchoolId();
    const selectedCampusId = this.schoolStructureScope.selectedCampusId();
    const selectedSchoolStructureItem =
      this.schoolStructureScope.selectedSchoolStructureItem();
    const selectedAcademicYear =
      this.academicYearsScopeService.selectedAcademicYear();
    const selectedSemester = this.academicYearsScopeService.selectedSemester();
    const selectedStudent = this.studentScopeService.selectedStudent();
    if (requiredScopes?.includes('school') && !selectedSchoolId) {
      this.onScopeUpdate.emit(false);
      return 'school';
    } else if (
      requiredScopes?.includes('school-structure') &&
      !selectedSchoolStructureItem
    ) {
      this.onScopeUpdate.emit(false);
      return 'school-structure';
    } else if (
      requiredScopes?.includes('academicYear') &&
      !selectedAcademicYear
    ) {
      this.onScopeUpdate.emit(false);
      return 'academicYear';
    } else if (requiredScopes?.includes('semester') && !selectedSemester) {
      return 'semester';
    } else if (requiredScopes?.includes('student') && !selectedStudent) {
      return 'student';
    } else if (requiredScopes?.includes('campus') && !selectedCampusId) {
      this.onScopeUpdate.emit(false);
      return 'campus';
    } else if (
      requiredScopes?.includes('campus-or-school') &&
      !selectedCampusId &&
      !selectedSchoolId
    ) {
      this.onScopeUpdate.emit(false);
      return 'campus-or-school';
    } else {
      this.onScopeUpdate.emit(true);
      return null;
    }
  });

  showSchoolStructure = computed(() => {
    const unselectedScope = this.unSelectedScope();
    return this.schoolStructureScopes.includes(unselectedScope as HesScope);
  });

  handleOnClick() {
    const unselectedScope = this.unSelectedScope();

    if (this.showSchoolStructure()) {
      // School selection is now handled by the wrapped school-selector component
      return;
    }

    switch (unselectedScope) {
      case 'academicYear':
      case 'semester':
        this.layoutService.toggleAcademicYearPopover();
        break;
      default:
        break;
    }
  }
}
