import { Component, inject, input, signal } from '@angular/core';
import {
  ModalController,
  IonContent,
  IonSkeletonText,
} from '@ionic/angular/standalone';
import { RouterModule, Router } from '@angular/router';
import { NgClass } from '@angular/common';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { faPlus } from '@fortawesome/pro-solid-svg-icons';
import { openAddEditSchoolModal } from '@pages/school-structure/pages/campus/add-edit-school-modal';
import { CampusService } from '@pages/school-structure/pages/campus/campus.service';
import { CompanyService } from '@pages/school-structure/pages/company/company.service';
import {
  ProfileHeaderComponent,
  profileMetadata,
} from '@shared/components/profile-header/profile-header.component';
import {
  CardListItemConfig,
  CardListItemComponent,
} from '@shared/components/card-list-item/card-list-item.component';
import { isMobile } from '@shared/utils/platform';
import { NoDataCardComponent } from '@shared/components/no-data-card/no-data-card.component';
import { ICampus } from '@shared/interfaces';
import { FeedbackService } from '@shared/services/feedback.service';
import { Language } from '@shared/enums';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { HesSchoolGenderPipe } from '@shared/pipes/hes-school-gender.pipe';
import { HesEducationalPathPipe } from '@shared/pipes/educational-path.pipe';
import { RbacDirective } from '@shared/role-bace-acces-controller/rbac.directive';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { CardListItemSkeletonComponent } from '../../../../shared/components/card-list-item-skeleton/card-list-item-skeleton.component';
import { CardListSkeletonComponent } from '@shared/components/card-list-skeleton/card-list-skeleton.component';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { forkJoin } from 'rxjs';
import {
  Campus,
  School,
} from '@shared/dto-transformation/organization/organization.interface';

@Component({
  selector: 'app-campus-page',
  templateUrl: 'campus.page.html',
  standalone: true,
  imports: [
    IonSkeletonText,
    IonContent,
    TranslocoDirective,
    HesButtonModule,
    RouterModule,
    ProfileHeaderComponent,
    NoDataCardComponent,
    CardListItemComponent,
    RbacDirective,
    CardListItemSkeletonComponent,
    CardListSkeletonComponent,
    NgClass,
  ],
  providers: [HesSchoolGenderPipe, HesEducationalPathPipe],
})
export class CampusPage {
  campusId = input<string | null>(null);
  router = inject(Router);
  hesSchoolGenderPipe = inject(HesSchoolGenderPipe);
  isMobile = signal(isMobile());
  faPlus = faPlus;
  companyService = inject(CompanyService);
  campusService = inject(CampusService);
  feedbackService = inject(FeedbackService);
  translocoService = inject(TranslocoService);
  currentLang = signal<string>(
    this.translocoService.getActiveLang(),
  ).asReadonly();
  private readonly educationalPathPipe = inject(HesEducationalPathPipe);
  private modalCtrl = inject(ModalController);
  private readonly toaster = inject(HesToasterService);
  private readonly schoolStructureScopeService = inject(
    SchoolStructureScopeService,
  );
  campusDetails = signal<Campus | undefined>(undefined);
  campusMetadata = signal<profileMetadata[]>([]);
  schoolsMetadata = signal<CardListItemConfig[]>([]);
  citiesList = this.companyService.citiesList;
  districtsList = this.companyService.districtsList;
  schoolsText = signal<string>(
    this.translate('school_structure.schools.title'),
  ).asReadonly();
  levelsText = signal<string>(this.translate('resource.level')).asReadonly();
  noDataBtnConfig = signal<any>({
    label: this.translate('school_structure.add_school.btn'),
    onAction: () => {
      this.onAddEditSchool();
    },
  }).asReadonly();
  readonly schoolPermission = RESOURCE_PERMISSION.school;
  isLoading = signal(false);

  ionViewWillEnter() {
    this.isLoading.set(true);
    this.getCitiesAndDistricts();
    this.getCampusDetail();
  }

  translate(key: string, params: object = {}): string {
    return this.translocoService.translate(key, params);
  }

  /**
   * Retrieves the list of cities and districts from the company service.
   * Updates the citiesList and districtsList properties with the retrieved data.
   */
  getCitiesAndDistricts = () => {
    forkJoin([
      this.companyService.getCities(),
      this.companyService.getDistricts(),
    ]).subscribe();
  };

  closeModal = () => this.modalCtrl.dismiss();

  /**
   * Opens the add/edit school modal.
   *
   * @param school - The school object to be edited, or null if adding a new school.
   */
  onAddEditSchool = (school: School | null = null) => {
    const preDefinedData = {
      id: this.campusId(),
      companyName: this.campusDetails()?.company?.displayName,
      campusName: this.campusDetails()?.displayName,
    };

    openAddEditSchoolModal({
      modalCtrl: this.modalCtrl,
      closeModal: this.closeModal,
      preDefinedData: preDefinedData,
      schoolDetails: school ? school : null,
      mobile: this.isMobile(),
      refreshCampusDetails: () => {
        this.schoolStructureScopeService
          .populateDefaultScope(true)
          .subscribe(() => this.getCampusDetail());
      },
    });
  };

  setCampusMetadata(campus: Campus) {
    this.campusMetadata.set([
      {
        hesIcon: {
          src: 'assets/icons/school.svg',
          class: 'text-base',
        },
        title: `${campus.schools.length}  ${this.schoolsText()}`,
      },
      {
        hesIcon: {
          src: 'assets/icons/call.svg',
          class: 'text-base',
        },
        title: `${campus.countryCode} ${campus.phoneNumber}`,
        type: 'phoneNumber',
      },
      {
        hesIcon: {
          src: 'assets/icons/location.svg',
          class: 'text-base',
        },
        title: `${
          this.currentLang() === Language.ARABIC
            ? this.getArabicDistrictName(campus.district)
            : campus.district
        }, ${
          this.currentLang() === Language.ARABIC
            ? this.getArabicCityName(campus.city)
            : campus.city
        }`,
      },
    ]);
  }

  /**
   * Retrieves the Arabic name of a city based on its English name.
   * @param cityName - The English name of the city.
   * @returns The Arabic name of the city, if found. Otherwise, returns undefined.
   */
  getArabicCityName = (cityName: string) => {
    return this.citiesList()?.find((city) => city.name_en === cityName)
      ?.name_ar;
  };

  /**
   * Retrieves the Arabic name of a district based on its English name.
   * @param districtName - The English name of the district.
   * @returns The Arabic name of the district, if found. Otherwise, returns undefined.
   */
  getArabicDistrictName = (districtName: string) => {
    return this.districtsList()?.find(
      (district) => district.name_en === districtName,
    )?.name_ar;
  };

  setSchoolsMetadata(schools: School[]) {
    const schoolsMetadata = schools.map((school) => {
      const metadata = {
        title: school.displayName,
        icon: {
          hesIcon: {
            src: 'assets/icons/school.svg',
          },
        },
        data: {},
        info: [
          {
            label: this.hesSchoolGenderPipe.transform(school.gender),
            hesIcon: {
              src: 'assets/icons/user.svg',
            },
          },
          {
            label: `${school.schoolLevels.length} ${this.levelsText()}`,
            hesIcon: {
              src: 'assets/icons/level.svg',
            },
          },
          {
            label: this.educationalPathPipe.transform(school.educationalPath),
            hesIcon: {
              src: 'assets/icons/routing.svg',
            },
          },
          {
            label: `${school.stage?.displayName || ''}`,
            hesIcon: {
              src: 'assets/icons/school.svg',
            },
          },
        ],
        actions: [
          {
            label: this.translocoService.translate('global.view.btn'),
            onAction: () => {
              this.router.navigate(['school-structure/school', school.id]);
            },
            permissionId: this.schoolPermission.viewSchoolDetails,
            hasAccess: school.hasAccess,
          },
          {
            label: this.translocoService.translate('global.edit.btn'),
            onAction: () => {
              this.onAddEditSchool(school);
            },
            permissionId: this.schoolPermission.updateSchool,
            hasAccess: school.hasAccess,
          },
        ],
      };

      // Conditionally add "Delete" action if levelsCount is greater than 0
      if (school.schoolLevels.length === 0) {
        metadata.actions.push({
          label: this.translocoService.translate('global.delete.btn'),
          onAction: () => {
            this.onSchoolDelete(school.id);
          },
          permissionId: this.schoolPermission.deleteSchool,
          hasAccess: school.hasAccess,
        });
      }

      return metadata;
    });
    this.schoolsMetadata.set(schoolsMetadata);
  }

  /**
   * Retrieves the details of a company by its ID.
   */
  getCampusDetail = () => {
    this.isLoading.set(true);
    this.campusService.getCampusById(+this.campusId()!).subscribe((campus) => {
      this.campusDetails.set(campus);
      this.setCampusMetadata(campus);
      this.setSchoolsMetadata(campus.schools);
      this.isLoading.set(false);
    });
  };

  async onSchoolDelete(schoolId: number) {
    await this.feedbackService.openFeedbackModal(
      {
        type: 'error',
        modalTitle: this.translate('school_structure.school_delete_msg.text'),
        primaryBtnStr: this.translocoService.translate('global.delete.btn'),
        secondaryBtnStr: this.translocoService.translate('global.cancel.btn'),
      },
      () => {
        this.campusService.deleteSchool(schoolId).subscribe({
          next: () => {
            this.getCampusDetail();
            this.schoolStructureScopeService
              .populateDefaultScope(true)
              .subscribe();
            this.toaster.success(
              this.translate('global.delete_school_successfully.txt'),
            );
          },
          error: (err) => {
            this.toaster.showBackendError(err);
          },
        });
      },
    );
  }
}
