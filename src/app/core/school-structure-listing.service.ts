import { Inject, Injectable, Optional, computed, signal } from '@angular/core';
import { SchoolStructureScopeService } from './school-structure-scope.service';
import {
  findAllCompanies,
  findSchoolStructureEntity,
  getCampusCompany,
  findAllCompaniesWithCampuses,
} from '@shared/utils/school-structure';
import { sideMenuSchoolStructureItem } from '@layout/layout.component';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { skip } from 'rxjs';

@Injectable()
export class SchoolStructureListingService {
  private readonly _userScopedSchoolStructure =
    this.schoolStructureScopeService.userScopedSchoolStructure;

  // gets populated based on the selected school structure global scope and it's parents if any
  selectedCompany = signal<sideMenuSchoolStructureItem | null>(null);
  selectedCampus = signal<sideMenuSchoolStructureItem | null>(null);
  selectedSchool = signal<sideMenuSchoolStructureItem | null>(null);
  // doesn't get initialized with value as it's not an option inside school selection global scope
  selectedLevel = signal<sideMenuSchoolStructureItem | null>(null);
  selectedClass = signal<sideMenuSchoolStructureItem | null>(null);

  companyList = computed(() => {
    const currScope = this._userScopedSchoolStructure();
    return findAllCompanies(currScope);
  });

  companyWithCampusesList = computed(() => {
    const currScope = this._userScopedSchoolStructure();
    return findAllCompaniesWithCampuses(currScope);
  });

  campusList = computed(() => {
    const selectedCompany = this.selectedCompany();

    if (selectedCompany?.id) {
      const subCompanies =
        selectedCompany.children?.filter(
          (item) => item.type === 'sub-company',
        ) ?? [];
      if (subCompanies.length > 0) {
        return subCompanies.flatMap((item) => item.children);
      }
      return (
        selectedCompany.children?.filter((item) => item.type === 'campus') ?? []
      );
    } else return [];
  });

  schoolsList = computed(() => {
    const selectedCampus = this.selectedCampus();

    if (selectedCampus) {
      return selectedCampus.children;
    } else return [];
  });

  levelsList = computed(() => {
    const selectedSchool = this.selectedSchool();

    if (selectedSchool) {
      return selectedSchool.children;
    } else return [];
  });

  classesList = computed(() => {
    const selectedLevel = this.selectedLevel();

    if (selectedLevel) {
      return selectedLevel.children;
    } else return [];
  });

  selectedSchoolStructureModel = computed<ISchoolStructureSelectedModal>(() => {
    return {
      selectedCompany: this.selectedCompany(),
      selectedCampus: this.selectedCampus(),
      selectedSchool: this.selectedSchool(),
      selectedLevel: this.selectedLevel(),
      selectedClass: this.selectedClass(),
    };
  });

  selectedSchoolStructureModelId = computed(() => {
    return {
      companyId: this.selectedCompany()?.id,
      campusId: this.selectedCampus()?.id,
      schoolId: this.selectedSchool()?.id,
      levelId: this.selectedLevel()?.id,
      classId: this.selectedClass()?.id,
    };
  });

  constructor(
    private readonly schoolStructureScopeService: SchoolStructureScopeService,
    @Optional()
    @Inject('useDefaultScopeSelection')
    private useDefaultScopeSelection: boolean,
  ) {
    this.useDefaultScopeSelection = this.useDefaultScopeSelection ?? true;
    if (this.useDefaultScopeSelection) {
      this.reset();
      toObservable(schoolStructureScopeService.selectedSchoolStructureItem)
        .pipe(takeUntilDestroyed(), skip(1))
        .subscribe(() => {
          this.reset();
        });
    }
  }

  updateSelectedCompany(companyId: number) {
    if (companyId === 0) {
      this.selectedCompany.update((_oldCompany) => {
        return {
          id: 0,
        } as sideMenuSchoolStructureItem;
      });
    } else {
      this.selectedCompany.set(
        this.companyList().find((c) => c.id === companyId) ?? null,
      );
    }
    this.selectedCampus.set(null);
    this.selectedSchool.set(null);
    this.selectedLevel.set(null);
    this.selectedClass.set(null);
  }

  updateSelectedCampus(campusId: number) {
    if (campusId === 0) {
      this.selectedCampus.update((_oldCampus) => {
        return {
          id: 0,
        } as sideMenuSchoolStructureItem;
      });
    } else {
      this.selectedCampus.set(
        this.campusList().find((c) => c.id === campusId) ?? null,
      );
    }
    this.selectedSchool.set(null);
    this.selectedLevel.set(null);
    this.selectedClass.set(null);
  }

  updateSelectedSchool(schoolId: number) {
    if (schoolId === 0) {
      this.selectedSchool.update((_oldSchool) => {
        return {
          id: 0,
        } as sideMenuSchoolStructureItem;
      });
    } else {
      this.selectedSchool.set(
        this.schoolsList().find((c) => c.id === schoolId) ?? null,
      );
    }
    this.selectedLevel.set(null);
    this.selectedClass.set(null);
  }

  updateSelectedLevel(levelId: number | null) {
    if (levelId === 0) {
      this.selectedLevel.update((_oldLevel) => {
        return {
          id: 0,
        } as sideMenuSchoolStructureItem;
      });
    } else {
      if (levelId)
        this.selectedLevel.set(
          this.levelsList().find((c) => c.id === levelId) ?? null,
        );
      else this.selectedLevel.set(null);
    }
    this.selectedClass.set(null);
  }

  updateSelectedClass(classId: number | null) {
    if (classId === 0) {
      this.selectedClass.update((_oldClass) => {
        return {
          id: 0,
        } as sideMenuSchoolStructureItem;
      });
    } else {
      if (classId) {
        this.selectedClass.set(
          this.classesList().find((c) => c.id === classId) ?? null,
        );
      } else this.selectedClass.set(null);
    }
  }

  private getSelectedCompanyInitVal() {
    if (!this.useDefaultScopeSelection) {
      return null;
    } else {
      switch (
        this.schoolStructureScopeService.selectedSchoolStructureItem()?.type
      ) {
        case 'company':
        case 'sub-company':
          return this.schoolStructureScopeService.selectedSchoolStructureItem();
        case 'campus':
          return getCampusCompany(
            this._userScopedSchoolStructure(),
            this.schoolStructureScopeService.selectedSchoolStructureItem()!,
          );
        case 'school':
          const parentCampus = findSchoolStructureEntity(
            this._userScopedSchoolStructure(),
            'campus',
            this.schoolStructureScopeService.selectedSchoolStructureItem()
              ?.parentId!,
          );
          return getCampusCompany(
            this._userScopedSchoolStructure(),
            parentCampus!,
          );
        default:
          return null;
      }
    }
  }

  reset() {
    this.selectedCompany.set(this.getSelectedCompanyInitVal());
    this.selectedCampus.set(
      this.schoolStructureScopeService.selectedSchoolStructureItem()?.type ===
        'campus'
        ? this.schoolStructureScopeService.selectedSchoolStructureItem()
        : this.schoolStructureScopeService.selectedSchoolStructureItem()
              ?.type === 'school'
          ? findSchoolStructureEntity(
              this._userScopedSchoolStructure(),
              'campus',
              this.schoolStructureScopeService.selectedSchoolStructureItem()
                ?.parentId!,
            )
          : null,
    );
    this.selectedSchool.set(
      this.schoolStructureScopeService.selectedSchoolStructureItem()?.type ===
        'school'
        ? this.schoolStructureScopeService.selectedSchoolStructureItem()
        : null,
    );
    this.selectedLevel.set(null);
    this.selectedClass.set(null);
  }

  selectFirstLevel() {
    this.updateSelectedLevel(this.levelsList()[0]?.id);
  }
  selectFirstClass() {
    this.updateSelectedClass(this.classesList()[0]?.id);
  }
}

export interface ISchoolStructureSelectedModal {
  selectedCompany: sideMenuSchoolStructureItem | null;
  selectedCampus: sideMenuSchoolStructureItem | null;
  selectedSchool: sideMenuSchoolStructureItem | null;
  selectedLevel: sideMenuSchoolStructureItem | null;
  selectedClass: sideMenuSchoolStructureItem | null;
}
