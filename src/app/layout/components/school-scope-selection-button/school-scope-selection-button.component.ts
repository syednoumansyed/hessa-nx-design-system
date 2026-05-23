import { Component, computed, inject, input } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faChevronRight,
  faChevronLeft,
} from '@fortawesome/pro-regular-svg-icons';
import { HesIconComponent } from '@shared/components/hes-icon/hes-icon.component';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { CommonModule } from '@angular/common';
import { LayoutService } from '@layout/layout.service';
import {
  findSchoolStructureEntity,
  hasMultipleEntities,
} from '@shared/utils/school-structure';
import { TranslocoService } from '@jsverse/transloco';
import { AuthService } from '@auth/auth.service';

@Component({
  selector: 'app-school-scope-selection-button',
  templateUrl: './school-scope-selection-button.component.html',
  standalone: true,
  imports: [HesIconComponent, FontAwesomeModule, CommonModule],
})
export class SchoolScopeSelectionButtonComponent {
  readonly faChevronRight = faChevronRight;
  readonly faChevronLeft = faChevronLeft;

  private readonly schoolStructureScope = inject(SchoolStructureScopeService);
  private readonly auth = inject(AuthService);
  private readonly translocoService = inject(TranslocoService);

  readonly collapsed = input<boolean>(false);

  readonly currLang = this.translocoService.getActiveLang();

  title = computed(() => {
    return (
      this.schoolStructureScope.selectedSchoolStructureItem()?.name ??
      this.translocoService.translate('global.all.txt')
    );
  });

  secondaryTitle = computed(() => {
    const selectedSchoolId = this.schoolStructureScope.selectedSchoolId();
    const schoolStructure =
      this.schoolStructureScope.userScopedSchoolStructure();
    if (!selectedSchoolId) {
      return null;
    }
    const selectedSchool = findSchoolStructureEntity(
      schoolStructure,
      'school',
      selectedSchoolId,
    );
    if (selectedSchool?.parentId) {
      const campus = findSchoolStructureEntity(
        schoolStructure,
        'campus',
        selectedSchool.parentId,
      );
      return campus?.name || null;
    }
    return null;
  });

  iconPath = computed(() => {
    return (
      this.schoolStructureScope.selectedSchoolStructureItem()?.hesIcon.src ??
      'assets/icons/company.svg'
    );
  });

  isDisabled = computed<boolean>(() => {
    const schoolStructure =
      this.schoolStructureScope.userScopedSchoolStructure();
    return (
      !hasMultipleEntities(schoolStructure, 'school') ||
      !this.auth.isUserPersonnel()
    );
  });
}
