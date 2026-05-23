import { Component, computed, inject, OnInit, signal } from '@angular/core';

import { IonContent, ModalController } from '@ionic/angular/standalone';
import { IMenuRoutes } from '@layout/menu-routes.interface';
import { AuthService } from '@auth/auth.service';
import { SchoolStructureListingService } from '@core/school-structure-listing.service';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranslocoDirective } from '@jsverse/transloco';
import { SchoolScopeSelectorComponent } from '../school-scope-selector/school-scope-selector.component';
import { SchoolSelectorComponent } from '../school-selector/school-selector.component';
import { MobileMenuItemComponent } from '../mobile-menu-item/mobile-menu-item.component';
import { mainMenuRoutes } from '../../ds-menu-routes';
import { Student } from '@ds/student-selector/student-selector.component';
import { sideMenuSchoolStructureItem } from '@layout/layout.component';
import { StudentSelectionScopeService } from '@core/student-selection-scope.service';
import { AcademicYearSelectionComponent } from '../academic-year-selection/academic-year-selection.component';
import { AcademicYearSelectorComponent } from '../academic-year-selector/academic-year-selector.component';
import { UserType } from '@shared/enums';
import { ISideMenuItem } from '../side-nav/side-nav.component';
import { SchoolStructureTreeComponent } from '../school-structure-tree/school-structure-tree.component';

@Component({
  selector: 'ds-mobile-menu',
  templateUrl: './mobile-menu.page.html',
  styleUrls: ['./mobile-menu.page.scss'],
  providers: [SchoolStructureListingService],
  standalone: true,
  imports: [
    IonContent,
    FontAwesomeModule,
    TranslocoDirective,
    MobileMenuItemComponent,
    SchoolScopeSelectorComponent,
    SchoolSelectorComponent,
    MobileMenuItemComponent,
    AcademicYearSelectionComponent,
    AcademicYearSelectorComponent,
  ],
})
export class MobileMenuPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly studentSelectionScope = inject(StudentSelectionScopeService);
  private readonly schoolStructureListingService = inject(
    SchoolStructureListingService,
  );
  private readonly rbac = inject(RoleBaseAccessControlService);
  private readonly schoolStructureScopeService = inject(
    SchoolStructureScopeService,
  );
  private readonly modalController = inject(ModalController);
  isGuardianUser = signal(this.auth.user()?.type === UserType.GUARDIAN);
  isPersonnelUser = signal(this.auth.user()?.type === UserType.PERSONNEL);
  isSuperAdmin = this.rbac.isSuperAdmin();
  isSchoolStructureEmpty =
    this.schoolStructureScopeService.isSchoolStructureEmpty;
  private animationPlayFunctions = new Map<string, () => void>();

  readonly menuRoutes = signal<IMenuRoutes[]>([]);
  readonly menusRoutes = mainMenuRoutes();
  selectedStudent = this.studentSelectionScope.selectedStudent;

  /**
   * Student options for student selector
   */
  studentsOptions = computed(() => {
    return this.studentSelectionScope.studentSelectionScope().map((s) => ({
      id: s.id.toString(),
      fullName: s.fullName,
      class: s?.school?.class?.displayName || '',
      level: s?.school?.level?.displayName || '',
      imageUrl: s?.image || '',
    }));
  });

  constructor() {}

  ngOnInit() {
    this.menuRoutes.set(this.populateMobileRoutes());
  }

  populateMobileRoutes() {
    const isSchoolStructureEmpty =
      this.schoolStructureScopeService.isSchoolStructureEmpty();
    if (isSchoolStructureEmpty) {
      return this.menusRoutes()
        .filter((item) => item.isPublic === true)
        .map((item) => ({ ...item, placement: 'upper' }) as IMenuRoutes);
    }
    return this.menusRoutes()
      .filter((item) =>
        item.UserTypes
          ? item.UserTypes?.some(
              (userType) => userType === this.auth.user()?.type,
            )
          : true,
      )
      .filter((item) => !(item.path === 'home' || item.path === 'feed'))
      .filter((item) => (item.isHideFromSuperAdmin ? !this.isSuperAdmin : true))
      .filter((item) =>
        !!item.permissions
          ? this.rbac.hasSomePermission(item.permissions)
          : true,
      );
  }

  /**
   * Handle student selection change
   */
  onStudentChange(student?: Student): void {
    if (!student) return;

    const studentId = parseInt(student.id, 10);
    if (isNaN(studentId)) {
      console.error('Invalid student ID:', student.id);
      return;
    }

    this.studentSelectionScope.updateSelectedStudent(studentId);

    if (studentId) {
      this.schoolStructureScopeService.updateSelectedStructure({
        id: this.selectedStudent()?.school?.id,
        type: 'school',
      } as sideMenuSchoolStructureItem);
    }
  }

  async onClickableItemClick(_route: ISideMenuItem) {
    const modal = await this.modalController.create({
      component: SchoolStructureTreeComponent,
      componentProps: {
        onClose: () => modal.dismiss(),
      },
      breakpoints: [0, 0.4, 0.6, 0.8, 1],
      initialBreakpoint: 0.8,
      showBackdrop: true,
      backdropDismiss: true,
      cssClass: 'school-structure-bottom-sheet',
    });
    await modal.present();
  }
}
