import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, input, computed } from '@angular/core';
import { faUser } from '@fortawesome/pro-duotone-svg-icons';
import { Gender, UserType } from '@shared/enums';
import { FaIconComponentsProps, hesIcon } from '@shared/types';
import { HesInitialsPipe } from '@shared/pipes/hes-name-initials.pipe';
import { HesIconComponent } from '@shared/components/hes-icon/hes-icon.component';
import { TranslocoDirective } from '@jsverse/transloco';
import { Router } from '@angular/router';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { RbacDirective } from '@shared/role-bace-acces-controller/rbac.directive';
import { HessaBtnDirective } from '@ui-kit/hes-button/hes-button.directive';
import { AuthService } from '@auth/auth.service';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import {
  findAllCampuses,
  findAllCompanies,
  findAllSchools,
} from '@utils/school-structure';
import {
  SupportTicketRole,
  SupportTicketSchoolStructure,
  SupportTicketUser,
} from '@shared/dto-transformation';

@Component({
  selector: 'app-ticket-initiator',
  templateUrl: './ticket-initiator.component.html',
  standalone: true,
  imports: [
    CommonModule,
    HesInitialsPipe,
    HesIconComponent,
    TranslocoDirective,
    RbacDirective,
    HessaBtnDirective,
  ],
})
export class TicketInitiatorComponent implements OnInit {
  private router = inject(Router);
  private schoolStructureScopeService = inject(SchoolStructureScopeService);
  LOGIN_AS_PERMISSION = RESOURCE_PERMISSION.LOGIN.LOGIN_AS_USER;
  readonly UserType = UserType;
  Gender = Gender;

  viewProfileIcon: hesIcon = {
    src: './assets/icons/export.svg',
    class: 'w-4 h-4',
  };

  userIcon: FaIconComponentsProps = {
    icon: faUser,
    primaryOpacity: 0.3,
    secondaryOpacity: 1.0,
    primaryColor: '#ECAD01',
    secondaryColor: '#ECAD01',
  };

  authService = inject(AuthService);
  schoolStructure = input<SupportTicketSchoolStructure>();
  user = input.required<SupportTicketUser>();
  userType = input<UserType>();
  currentUserTypeId = this.authService.user()?.userTypeId;
  currentUserType = this.authService.user()?.type;
  isLoggedInAsOtherUser = this.authService.isLoggedInAsOtherUser();

  role = input<SupportTicketRole>();
  allCompanies = computed(() => {
    return findAllCompanies(
      this.schoolStructureScopeService.userScopedSchoolStructure(),
    );
  });
  company = computed(() => {
    const company = this.allCompanies().find(
      (company) => company.id === this.schoolStructure()?.company?.id,
    );
    return { company, companyAccess: company?.hasAccess };
  });
  campus = computed(() => {
    const campus = findAllCampuses(
      this.schoolStructureScopeService.userScopedSchoolStructure(),
    ).find((campus) => campus.id === this.schoolStructure()?.campus?.id);
    return { campus, campusAccess: campus?.hasAccess };
  });
  school = computed(() => {
    const school = findAllSchools(
      this.schoolStructureScopeService.userScopedSchoolStructure(),
    ).find((school) => school.id === this.schoolStructure()?.school?.id);
    return { school, schoolAccess: school?.hasAccess };
  });

  createdByType = input<UserType>();

  constructor() {}

  ngOnInit() {}

  goToInitiatorProfile() {
    if (this.createdByType() === UserType.STUDENT) {
      this.router.navigate([
        'user-management/students',
        this.user()?.userTypeId,
      ]);
    } else if (this.createdByType() === UserType.GUARDIAN) {
      this.router.navigate([
        'user-management/guardians',
        this.user()?.userTypeId,
      ]);
    } else if (this.createdByType() === UserType.PERSONNEL) {
      this.router.navigate([
        'user-management/personnels',
        this.user()?.userTypeId,
      ]);
    }
  }

  showLoginDialog() {
    this.authService.displayLoginConfirmationDialog(
      this.user().id,
      this.user().userTypeId!,
      UserType.PERSONNEL,
    );
  }

  changeSelection(type: 'school' | 'company' | 'campus') {
    switch (type) {
      case 'company':
        const { company, companyAccess } = this.company();
        if (companyAccess && company)
          this.schoolStructureScopeService.updateSelectedStructure(company);
        break;
      case 'campus':
        const { campus, campusAccess } = this.campus();
        if (campusAccess && campus)
          this.schoolStructureScopeService.updateSelectedStructure(campus);
        break;
      case 'school':
        const { school, schoolAccess } = this.school();
        if (schoolAccess && school)
          this.schoolStructureScopeService.updateSelectedStructure(school);
        break;
    }
  }
}
