import { Component, inject, OnInit, signal } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { SchoolScopeSelectionButtonComponent } from '../../layout/components/school-scope-selection-button/school-scope-selection-button.component';
import { AcademicYearSelectionComponent } from '../../layout/components/academic-year-selection/academic-year-selection.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { mainMenuRoutes } from '@layout/menu-routes';
import { AuthService } from '@auth/auth.service';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { TranslocoDirective } from '@jsverse/transloco';
import { AcademicYearSelectionPopoverComponent } from '../../layout/components/academic-year-selection-popover/academic-year-selection-popover.component';
import { SchoolScopeSelectionPopoverComponent } from '../../layout/components/school-scope-selection-popover/school-scope-selection-popover.component';
import { StudentSelectionComponent } from '../../layout/components/student-selection/student-selection.component';
import { MobileMenuItemComponent } from './mobile-menu-item/mobile-menu-item.component';
import { IMenuRoutes } from '@layout/menu-routes.interface';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { SchoolStructureListingService } from '@core/school-structure-listing.service';

@Component({
  selector: 'app-mobile-menu',
  templateUrl: './mobile-menu.page.html',
  standalone: true,
  providers: [SchoolStructureListingService],
  imports: [
    IonContent,
    SchoolScopeSelectionButtonComponent,
    AcademicYearSelectionComponent,
    FontAwesomeModule,
    TranslocoDirective,
    AcademicYearSelectionPopoverComponent,
    SchoolScopeSelectionPopoverComponent,
    StudentSelectionComponent,
    MobileMenuItemComponent,
  ],
})
export class MobileMenuPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly schoolStructureListingService = inject(
    SchoolStructureListingService,
  );
  private readonly rbac = inject(RoleBaseAccessControlService);
  private readonly schoolStructureScopeService = inject(
    SchoolStructureScopeService,
  );
  isGuardianUser = signal(this.auth.user()?.type === 'GUARDIAN');
  isSuperAdmin = this.rbac.isSuperAdmin();

  readonly menuRoutes = signal<IMenuRoutes[]>([]);
  readonly menusRoutes = mainMenuRoutes();
  constructor() {}

  ngOnInit() {}

  ionViewWillEnter() {
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
    const mobileMenu = this.menusRoutes()
      .filter((item) =>
        item.UserTypes
          ? item.UserTypes?.some(
              (userType) => userType === this.auth.user()?.type,
            )
          : true,
      )
      .filter((item) => (item.isHideFromSuperAdmin ? !this.isSuperAdmin : true))
      .filter((item) =>
        !!item.permissions
          ? this.rbac.hasSomePermission(item.permissions)
          : true,
      );
    return mobileMenu;
  }
}
