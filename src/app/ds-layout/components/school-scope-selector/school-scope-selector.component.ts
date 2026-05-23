import { Component, computed, inject, input } from '@angular/core';
import {
  faChevronRight,
  faChevronLeft,
} from '@fortawesome/pro-regular-svg-icons';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { hasMultipleEntities } from '@shared/utils/school-structure';
import { TranslocoService } from '@jsverse/transloco';
import { AuthService } from '@auth/auth.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { HesIconComponent } from '@shared/components/hes-icon/hes-icon.component';
import { NgClass } from '@angular/common';
import { sideMenuSchoolStructureItem } from '@layout/layout.component';
import { SchoolStructureEntityType } from '@ui-kit/hes-school-structure-control/school-structure-control-item.interface';

@Component({
  selector: 'app-school-scope-selector',
  templateUrl: './school-scope-selector.component.html',
  imports: [FaIconComponent, HesIconComponent, NgClass],
})
export class SchoolScopeSelectorComponent {
  readonly faChevronRight = faChevronRight;
  readonly faChevronLeft = faChevronLeft;

  private readonly schoolStructureScope = inject(SchoolStructureScopeService);
  private readonly auth = inject(AuthService);
  private readonly translocoService = inject(TranslocoService);

  readonly collapsed = input<boolean>(false);

  readonly currLang = this.translocoService.getActiveLang();
  private readonly scopeIconByType: Record<SchoolStructureEntityType, string> =
    {
      company: 'assets/icons/company.svg',
      'sub-company': 'assets/icons/sub-company.svg',
      campus: 'assets/icons/campus.svg',
      school: 'assets/icons/school.svg',
      level: 'assets/icons/school.svg',
      class: 'assets/icons/school.svg',
    };

  selectedItem = computed(() => {
    return this.schoolStructureScope.selectedSchoolStructureItem();
  });

  title = computed(() => {
    return (
      this.selectedItem()?.name ??
      this.translocoService.translate('global.all.txt')
    );
  });

  secondaryItem = computed(() => {
    const selected = this.selectedItem();
    const schoolStructure =
      this.schoolStructureScope.userScopedSchoolStructure();
    if (!selected) {
      return null;
    }
    if (selected.type === 'sub-company') {
      return null;
    }
    return this.findParentEntity(schoolStructure, selected.id, selected.type);
  });

  secondaryTitle = computed(() => {
    return this.secondaryItem()?.name ?? null;
  });

  iconPath = computed(() => {
    const selected = this.selectedItem();
    if (!selected) {
      return this.scopeIconByType.company;
    }
    return this.scopeIconByType[selected.type] ?? selected.hesIcon.src;
  });

  secondaryIconPath = computed(() => {
    const secondary = this.secondaryItem();
    if (!secondary) {
      return null;
    }
    return (
      this.scopeIconByType[secondary.type] ??
      secondary.hesIcon.src ??
      this.scopeIconByType.company
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

  private findParentEntity(
    items: sideMenuSchoolStructureItem[],
    targetId: number,
    targetType: SchoolStructureEntityType,
    parent: sideMenuSchoolStructureItem | null = null,
  ): sideMenuSchoolStructureItem | null {
    for (const item of items) {
      if (item.id === targetId && item.type === targetType) {
        return parent;
      }
      const found = this.findParentEntity(
        item.children,
        targetId,
        targetType,
        item,
      );
      if (found) {
        return found;
      }
    }
    return null;
  }
}
