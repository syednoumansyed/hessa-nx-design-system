import {
  Component,
  computed,
  inject,
  Input,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { FaIconComponentsProps, hesIcon } from '@shared/types';
import { faUser } from '@fortawesome/pro-duotone-svg-icons';
import { AuthService } from '@auth/auth.service';
import {
  findAllCampuses,
  findAllCompanies,
  findAllSchools,
} from '@utils/school-structure';
import { Gender, UserType } from '@shared/enums';
import { AnnouncementsService } from '@pages/announcements/announcements.service';
import { sideMenuSchoolStructureItem } from '@layout/layout.component';
import { CommonModule, NgClass } from '@angular/common';
import { AvatarComponent } from '@ds/avatar/avatar.component';
import { HesIconComponent } from '@shared/components/hes-icon/hes-icon.component';
import { TranslocoDirective } from '@jsverse/transloco';
import { RbacDirective } from '@shared/role-bace-acces-controller/rbac.directive';
import { HessaBtnDirective } from '@ui-kit/hes-button/hes-button.directive';
import { ModalController } from '@ionic/angular/standalone';
@Component({
  selector: 'app-view-author-modal',
  templateUrl: './view-author-modal.component.html',
  standalone: true,
  imports: [
    AvatarComponent,
    HesIconComponent,
    TranslocoDirective,
    RbacDirective,
    HessaBtnDirective,
    NgClass,
  ],
})
export class ViewAuthorModalComponent implements OnInit {
  private router = inject(Router);
  LOGIN_AS_PERMISSION = RESOURCE_PERMISSION.LOGIN.LOGIN_AS_USER;
  readonly UserType = UserType;
  Gender = Gender;
  private readonly modalCtrl = inject(ModalController);

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
  announcementService = inject(AnnouncementsService);
  schoolStructureScopeService = inject(SchoolStructureScopeService);
  @Input() postId: number;
  readonly isLoggedInAsOtherUser = this.authService.isLoggedInAsOtherUser;
  isSameUser = computed(() => {
    return (
      this.authService.user()?.type === UserType.PERSONNEL &&
      this.authService.user()?.userTypeId === this.authorInfo()?.personnelId
    );
  });
  authorInfo = this.announcementService.announcementAuthorInfo;
  createdByType = input<UserType>();
  allCompanies = computed(() => {
    return findAllCompanies(
      this.schoolStructureScopeService.userScopedSchoolStructure(),
    );
  });

  companies = computed(() => {
    const companies: sideMenuSchoolStructureItem[] = [];
    this.authorInfo()?.schoolStructure?.company.forEach((userCompany) => {
      const found = this.allCompanies().find(
        (company) => company.id === userCompany.id,
      );
      if (found) companies.push(found);
    });
    return companies;
  });
  campuses = computed(() => {
    const campuses: sideMenuSchoolStructureItem[] = [];
    this.authorInfo()?.schoolStructure?.campus.forEach((userCampus) => {
      const found = findAllCampuses(
        this.schoolStructureScopeService.userScopedSchoolStructure(),
      ).find((campus) => campus.id === userCampus.id);
      if (found) campuses.push(found);
    });
    return campuses;
  });
  schools = computed(() => {
    const schools: sideMenuSchoolStructureItem[] = [];
    this.authorInfo()?.schoolStructure?.school.forEach((userSchool) => {
      const found = findAllSchools(
        this.schoolStructureScopeService.userScopedSchoolStructure(),
      ).find((school) => school.id === userSchool.id);
      if (found) schools.push(found);
    });
    return schools;
  });

  constructor() {}

  ngOnInit() {
    this.getAuthorInfo();
  }

  getAuthorInfo() {
    if (!this.postId) return;
    this.announcementService
      .getAnnouncementPostAuthorDetails(this.postId)
      .subscribe();
  }

  goToInitiatorProfile() {
    this.modalCtrl.dismiss();
    this.router.navigate([
      'user-management/personnels',
      this.authorInfo()?.personnelId,
    ]);
  }

  async showLoginDialog() {
    const opened = await this.authService.displayLoginConfirmationDialog(
      this.authorInfo()?.userId!,
      this.authorInfo()?.personnelId!,
      UserType.PERSONNEL,
    );
    if (opened) this.modalCtrl.dismiss();
  }

  changeSelection(type: 'school' | 'company' | 'campus', index: number) {
    switch (type) {
      case 'company':
        const company = this.companies()[index];
        if (company?.hasAccess && company)
          this.schoolStructureScopeService.updateSelectedStructure(company);
        break;
      case 'campus':
        const campus = this.campuses()[index];
        if (campus?.hasAccess && campus)
          this.schoolStructureScopeService.updateSelectedStructure(campus);
        break;
      case 'school':
        const school = this.schools()[index];
        if (school?.hasAccess && school)
          this.schoolStructureScopeService.updateSelectedStructure(school);
        break;
    }
  }

  protected readonly Object = Object;
}
