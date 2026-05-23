import { computed, inject, Injectable, signal } from '@angular/core';
import { LayoutService } from '@layout/layout.service';
import { DsModalService } from '@ds/modal';
import { StudentSelectionScopeService } from '@core/student-selection-scope.service';
import { SupportJourneyStudent } from './support-journey-student.model';
import { SupportJourneyStudentSelectionModalComponent } from '@pages/support-hub/components/journey/support-journey-student-selection-modal.component';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { DsSchoolStructureSelectionService } from '@ds/school-structure-control/ds-school-structure-selection.service';
import {
  StructureDepth,
  findAllSchools,
  findSchoolStructureEntity,
} from '@shared/utils/school-structure';
import {
  DsSchoolStructureControlValue,
  DsSchoolStructureEntityType,
} from '@ds/school-structure-control/types/school-structure-control.types';
import type { sideMenuSchoolStructureItem } from '@layout/layout.component';
import { AuthService } from '@auth/auth.service';
import { UserType } from '@shared/enums';

@Injectable({
  providedIn: 'root',
})
export class SupportJourneySelectionService {
  private readonly layoutService = inject(LayoutService);
  private readonly modalService = inject(DsModalService);
  private readonly studentSelectionScope = inject(StudentSelectionScopeService);
  private readonly translateService = inject(HesTranslateService);
  private readonly schoolStructureScope = inject(SchoolStructureScopeService);
  private readonly schoolStructureSelection = inject(
    DsSchoolStructureSelectionService,
  );
  private readonly authService = inject(AuthService);

  private readonly schoolSearchTypes: DsSchoolStructureEntityType[] = [
    'campus',
  ];

  private readonly _selectedSchoolOverride =
    signal<sideMenuSchoolStructureItem | null>(null);
  readonly selectedSchoolOverride = this._selectedSchoolOverride.asReadonly();

  readonly selectedSchool = computed(() => {
    return (
      this._selectedSchoolOverride() ??
      this.schoolStructureScope.selectedSchoolStructureItem()
    );
  });

  readonly availableSchools = computed(() =>
    findAllSchools(
      this.schoolStructureScope.userScopedSchoolStructureTillSchool(),
    ),
  );

  readonly studentCount = computed(
    () => this.studentSelectionScope.studentSelectionScope().length,
  );

  clearSelections(): void {
    this._selectedSchoolOverride.set(null);
  }

  setSelectedSchoolOverride(item: sideMenuSchoolStructureItem | null): void {
    this._selectedSchoolOverride.set(item);
  }

  async resolvePreJourneySelection(
    initialStudents: SupportJourneyStudent[],
  ): Promise<SupportJourneyStudent[] | null> {
    let students = initialStudents;

    if (this.isGuardianWithMultipleStudents() && students.length === 0) {
      const selected = await this.openStudentSelectionModal(
        initialStudents.map((student) => student.id),
      );
      if (!selected) {
        return null;
      }
      students = selected;
    }

    if (this.isPersonnel()) {
      const ready = await this.ensureSchoolSelection(true);
      if (!ready) {
        return null;
      }
    }

    return students;
  }

  async openStudentSelectionModal(
    initialSelectedIds: string[],
  ): Promise<SupportJourneyStudent[] | null> {
    const journeyStudents = this.buildJourneyStudentsFromScope();

    const modalRef = await this.modalService.open<
      {
        students: SupportJourneyStudent[];
        initialSelectedIds: string[];
      },
      SupportJourneyStudent[]
    >({
      component: SupportJourneyStudentSelectionModalComponent,
      componentProps: {
        students: journeyStudents,
        initialSelectedIds,
      },
      headerConfig: {
        title: this.translateService.t('global.select_student.label'),
        subtitle: this.translateService.t('support.select_students.hint'),
        showCloseButton: true,
      },
      footerConfig: {
        primaryButton: {
          text: this.translateService.t('global.confirm.btn'),
        },
        buttonSize: 'lg',
        fullWidthButtons: true,
      },
      size: 'lg',
      contentClass: 'p-ds-xl',
      cssClass: 'support-journey-student-selection-modal',
      backdropDismiss: this.layoutService.isMobile(),
    });

    const { data, role } = await modalRef.onDismiss();

    if (role === 'confirm' && data && data.length > 0) {
      return data;
    }

    return null;
  }

  async ensureSchoolSelection(isInitial: boolean): Promise<boolean> {
    const selected = this.selectedSchool();
    const schools = this.availableSchools();

    if (schools.length > 1) {
      return this.openSchoolSelectionModal(isInitial);
    }

    if (schools.length === 1 && selected?.type !== 'school') {
      this.schoolStructureScope.updateSelectedStructure(schools[0]);
    }

    return true;
  }

  async openSchoolSelectionModal(isInitial: boolean): Promise<boolean> {
    const isMobile = this.layoutService.isMobile();
    const selected = this.selectedSchool();
    const initialSelection: DsSchoolStructureControlValue[] | null =
      selected?.type === 'school'
        ? [{ id: selected.id, type: 'school' }]
        : null;

    const result = await this.schoolStructureSelection.open({
      initialSelection,
      isMultiSelect: false,
      depth: StructureDepth.SCHOOL,
      allowedSelections: ['school'],
      searchTypes: this.schoolSearchTypes,
      searchPlaceholder: this.translateService.t(
        'school_selection.search_campuses.placeholder',
      ),
      confirmLabel: this.translateService.t(
        'support.school_selection.confirm.btn',
      ),
      showSearch: true,
      requireSelection: true,
      showHeader: false,
      showFooter: true,
      showCancelButton: !isMobile,
      allowCancelWhenRequired: !isMobile,
      backdropDismiss: false,
      mobileHandle: isMobile,
      mobileBreakpoint: isMobile ? 1 : undefined,
      mobileBreakpoints: isMobile ? [0, 1] : undefined,
    });

    const selectedValue = Array.isArray(result.data) ? result.data[0] : null;

    if (result.role === 'confirm' && selectedValue) {
      const selectedItem = findSchoolStructureEntity(
        this.schoolStructureScope.userScopedSchoolStructure(),
        'school',
        selectedValue.id,
      );

      if (selectedItem) {
        this._selectedSchoolOverride.set(selectedItem);
      }

      return true;
    }

    return false;
  }

  private buildJourneyStudentsFromScope(): SupportJourneyStudent[] {
    const students = this.studentSelectionScope.studentSelectionScope();
    return students.map((student) => ({
      id: student.id.toString(),
      fullName: student.fullName,
      levelLabel: student.school?.level?.displayName ?? '',
      classLabel: student.school?.class?.displayName ?? '',
      avatarColor: 'BRAND' as any,
      avatarUrl: student.image ?? null,
      schoolId: student.school?.id ?? null,
    }));
  }

  private isGuardianWithMultipleStudents(): boolean {
    return (
      (this.authService.user()?.type ?? UserType.GUARDIAN) ===
        UserType.GUARDIAN && this.studentCount() > 1
    );
  }

  private isPersonnel(): boolean {
    return (
      (this.authService.user()?.type ?? UserType.GUARDIAN) ===
      UserType.PERSONNEL
    );
  }
}
