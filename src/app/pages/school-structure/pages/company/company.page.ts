import { Component, computed, inject, input, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import {
  ModalController,
  IonContent,
  IonSkeletonText,
} from '@ionic/angular/standalone';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { faPlus } from '@fortawesome/pro-solid-svg-icons';
import { openAddEditCampusModal } from '@pages/school-structure/pages/company/add-edit-campus-modal';
import { CompanyService } from '@pages/school-structure/pages/company/company.service';
import {
  ProfileHeaderComponent,
  profileMetadata,
} from '@shared/components/profile-header/profile-header.component';
import {
  CardListItemConfig,
  CardListItemComponent,
} from '@shared/components/card-list-item/card-list-item.component';
import { NoDataCardComponent } from '@shared/components/no-data-card/no-data-card.component';
import { FeedbackService } from '@shared/services/feedback.service';
import { Language } from '@shared/enums';
import { isMobile } from '@shared/utils/platform';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { openAddEditCompanyModal } from '@pages/school-structure/components/add-edit-company-modal';
import { SchoolStructureService } from '@pages/school-structure/school-structure.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { RbacDirective } from '@shared/role-bace-acces-controller/rbac.directive';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { CardListItemSkeletonComponent } from '../../../../shared/components/card-list-item-skeleton/card-list-item-skeleton.component';
import { CardListSkeletonComponent } from '../../../../shared/components/card-list-skeleton/card-list-skeleton.component';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { forkJoin } from 'rxjs';
import { Campus, Company } from '@shared/dto-transformation/organization';

@Component({
  selector: 'app-company-page',
  templateUrl: 'company.page.html',
  standalone: true,
  imports: [
    IonSkeletonText,
    IonContent,
    TranslocoDirective,
    HesButtonModule,
    ProfileHeaderComponent,
    NoDataCardComponent,
    CardListItemComponent,
    RbacDirective,
    CardListItemSkeletonComponent,
    CardListSkeletonComponent,
    NgClass,
  ],
})
export class CompanyPage {
  isMobile = isMobile();
  currentLang: string = '';
  faPlus = faPlus;

  id = input<string | null>(null);

  router = inject(Router);
  activatedRoute = inject(ActivatedRoute);
  companyService = inject(CompanyService);
  schoolService = inject(SchoolStructureService);
  feedbackService = inject(FeedbackService);
  translocoService = inject(TranslocoService);
  private modalCtrl = inject(ModalController);
  private toastr = inject(HesToasterService);
  private schoolStructureScopeService = inject(SchoolStructureScopeService);
  readonly createCompanyPermission = RESOURCE_PERMISSION.company.createCompany;
  companyDetails = signal<Company | undefined>(undefined);
  cpmpanyMetadata = signal<profileMetadata[]>([]);
  campusesMetadata = signal<CardListItemConfig[]>([]);
  citiesList = this.companyService.citiesList;
  districtsList = this.companyService.districtsList;
  campusesText = signal<string>(
    this.translate('school_structure.campuses.title'),
  );
  schoolsText = signal<string>(
    this.translate('school_structure.schools.title'),
  );
  addCampusBtnTxt = signal<string>(
    this.translate('school_structure.add_campus.btn'),
  );
  addSubCompanyBtnTxt = signal<string>(
    this.translate('school_structure.add_new_sub_company.btn'),
  );

  subCompaniesMappedList = signal<CardListItemConfig[]>([]);

  noDataPrimaryButton = computed(() => {
    return {
      label: this.addCampusBtnTxt(),
      onAction: () => {
        this.onAddEditCampus();
      },
    };
  });

  noDataSecondaryButton = computed(() => {
    return {
      label: this.addSubCompanyBtnTxt(),
      onAction: () => {
        this.onAddEditCompany();
      },
    };
  });
  isLoading = signal(false);

  constructor() {}

  ionViewWillEnter() {
    this.isLoading.set(true);
    this.currentLang = this.translocoService.getActiveLang();

    this.getCitiesAndDistricts();
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
    ]).subscribe({
      next: ([_cities, _districts]) => {
        this.getCompanyDetail(true);
      },
    });
  };

  closeModal = () => this.modalCtrl.dismiss();

  /**
   * Opens the add/edit campus modal.
   *
   * @param campus - The campus object to be edited, or null if adding a new campus.
   */
  onAddEditCampus = (campus: Campus | null = null) => {
    const companyDetails = {
      id: this.id(),
      name: this.companyDetails()?.displayName,
    };

    openAddEditCampusModal({
      modalCtrl: this.modalCtrl,
      closeModal: this.closeModal,
      companyDetails: companyDetails,
      campusDetails: campus ? campus : null,
      mobile: this.isMobile,
      refreshCompanyDetails: () => {
        this.schoolStructureScopeService
          .populateDefaultScope(true)
          .subscribe(() => this.getCompanyDetail());
      },
    });
  };

  setCompanyMetadata(company: Company) {
    const schoolsCount = company.campuses?.reduce(
      (acc, campus) => acc + campus.schools.length,
      0,
    );
    const metaData = [
      {
        hesIcon: {
          src: 'assets/icons/campus.svg',
          class: 'text-base',
        },
        title: `${company.campuses.length} ${this.campusesText()}`,
      },
      {
        hesIcon: {
          src: 'assets/icons/school.svg',
          class: 'text-base',
        },
        title: `${schoolsCount}  ${this.schoolsText()}`,
      },
    ];
    if (company.subCompanies.length) {
      const subCompaniesLength = company.subCompanies.length;
      metaData.unshift({
        hesIcon: {
          src: 'assets/icons/company.svg',
          class: 'text-base',
        },
        title: `${company.subCompanies.length} ${subCompaniesLength === 1 ? this.translocoService.translate('global.company.title') : this.translocoService.translate('resource.company')}`,
      });
    }
    this.cpmpanyMetadata.set(metaData);
  }

  /**
   * Retrieves the Arabic name of a city based on its English name.
   * @param cityName - The English name of the city.
   * @returns The Arabic name of the city, if found. Otherwise, returns undefined.
   */
  getTranslatedCityName = (cityName: string) => {
    let city = this.citiesList()?.find(
      (city) => city.name_en === cityName || city.name_ar === cityName,
    );
    return this.currentLang == Language.ARABIC ? city?.name_ar : city?.name_en;
  };

  /**
   * Retrieves the Arabic name of a district based on its English name.
   * @param districtName - The English name of the district.
   * @returns The Arabic name of the district, if found. Otherwise, returns undefined.
   */
  getTranslatedDistrictName = (districtName: string) => {
    let district = this.districtsList()?.find(
      (district) =>
        district.name_en === districtName || district.name_ar === districtName,
    );
    return this.currentLang == Language.ARABIC
      ? district?.name_ar
      : district?.name_en;
  };

  setCampusesMetadata(campuses: Campus[]) {
    const campusesMetadata = campuses.map((campus) => {
      const metadata = {
        title: campus.displayName,
        icon: {
          hesIcon: {
            src: 'assets/icons/campus.svg',
          },
        },
        data: {},
        info: [
          {
            label: `${this.getTranslatedDistrictName(campus.district)},
                    ${this.getTranslatedCityName(campus.city)}`,
            hesIcon: {
              src: 'assets/icons/location.svg',
            },
          },
          {
            label: `${campus.schools.length} ${this.schoolsText()}`,
            hesIcon: {
              src: 'assets/icons/school.svg',
            },
          },
        ],
        actions: [
          {
            label: this.translocoService.translate('global.view.btn'),
            onAction: () => {
              this.router.navigate(['school-structure/campus', campus.id]);
            },
            permissionId: RESOURCE_PERMISSION.company.viewCompanyDetails,
            hasAccess: campus.hasAccess,
          },
          {
            label: this.translocoService.translate('global.edit.btn'),
            onAction: () => {
              this.onAddEditCampus(campus);
            },
            permissionId: RESOURCE_PERMISSION.company.updateCompany,
            hasAccess: campus.hasAccess,
          },
        ],
      };

      // Conditionally add "Delete" action if schoolsCount is greater than 0
      if (campus.schools.length === 0) {
        metadata.actions.push({
          label: this.translocoService.translate('global.delete.btn'),
          onAction: () => {
            this.onCampusDelete(campus.id);
          },
          permissionId: RESOURCE_PERMISSION.company.deleteCompany,
          hasAccess: campus.hasAccess,
        });
      }

      return metadata;
    });
    this.campusesMetadata.set(campusesMetadata);
  }

  setSubCompaniesMetadata(subCompanies: Company[]) {
    const mappedCompanies = subCompanies.map((subCompany) => {
      let schoolsCount = 0;
      if (subCompany.campuses.length) {
        schoolsCount = subCompany.campuses?.reduce(
          (acc, campus) => acc + campus.schools.length,
          0,
        );
      }
      const metadata = {
        title: subCompany.displayName,
        icon: {
          hesIcon: {
            src: 'assets/icons/company.svg',
          },
        },
        data: {},
        info: [
          {
            label:
              subCompany.campuses.length +
              ' ' +
              this.translocoService.translate(
                'school_structure.campuses.title',
              ),
            hesIcon: {
              src: 'assets/icons/campus.svg',
            },
          },
          {
            label:
              schoolsCount +
              ' ' +
              this.translocoService.translate('school_structure.schools.title'),
            hesIcon: {
              src: 'assets/icons/school.svg',
            },
          },
        ],
        actions: [
          {
            label: this.translocoService.translate('global.view.btn'),
            onAction: () => {
              this.router.navigate([
                'school-structure',
                'sub-company',
                subCompany.id,
              ]);
            },
            hasAccess: subCompany.hasAccess,
          },
          {
            label: this.translocoService.translate('global.edit.btn'),
            onAction: () => {
              this.onAddEditCompany(subCompany);
            },
            hasAccess: subCompany.hasAccess,
          },
        ],
      };

      if (!subCompany.campuses?.length) {
        metadata.actions.push({
          label: this.translocoService.translate('global.delete.btn'),
          onAction: () => {
            this.onDeleteCompany(subCompany);
          },
          hasAccess: subCompany.hasAccess,
        });
      }

      return metadata;
    });
    this.subCompaniesMappedList.set(mappedCompanies);
  }

  /**
   * Retrieves the details of a company by its ID.
   */
  getCompanyDetail = (fromRoute = false) => {
    this.isLoading.set(true);
    if (fromRoute) {
      const data = this.activatedRoute.snapshot.data;
      // this.activatedRoute.data.subscribe((data) => {
      this.companyDetails.set(data['company']);
      this.setCompanyMetadata(data['company']);
      if (data['company']?.campuses?.length)
        this.setCampusesMetadata(data['company'].campuses);
      else this.setSubCompaniesMetadata(data['company'].subCompanies);
      this.isLoading.set(false);
      // });
    } else
      this.companyService.getCompanyById(+this.id()!).subscribe({
        next: (company) => {
          this.companyDetails.set(company);
          this.setCompanyMetadata(company);
          if (company.campuses.length)
            this.setCampusesMetadata(company.campuses);
          else this.setSubCompaniesMetadata(company.subCompanies);
          this.isLoading.set(false);
        },
      });
  };

  async onCampusDelete(campusId: number) {
    await this.feedbackService.openFeedbackModal(
      {
        type: 'error',
        modalTitle: this.translate('school_structure.campus_delete_msg.text'),
        primaryBtnStr: this.translate('global.delete.btn'),
        secondaryBtnStr: this.translate('global.cancel.btn'),
      },
      () => {
        this.companyService.deleteCampus(campusId).subscribe({
          next: () => {
            this.toastr.success(
              this.translate('global.delete_campus_successfully.txt'),
            );
            this.schoolStructureScopeService
              .populateDefaultScope(true)
              .subscribe(() => this.getCompanyDetail());
          },
          error: (error) => {
            this.toastr.showBackendError(error);
          },
        });
      },
    );
  }

  onAddEditCompany = (company: Company | null = null) => {
    openAddEditCompanyModal({
      modalCtrl: this.modalCtrl,
      closeModal: this.closeModal,
      companyDetails: company ? company : undefined,
      parentCompany: this.companyDetails(),
      isSubCompany: true,
      mobile: this.isMobile,
      onSuccess: () => {
        this.schoolStructureScopeService
          .populateDefaultScope(true)
          .subscribe(() => this.getCompanyDetail());
      },
    });
  };

  onDeleteCompany(company: Company) {
    this.feedbackService.openFeedbackModal(
      {
        type: 'error',
        modalTitle: '',
        modalMessage: this.translate(
          'school_structure.sub_company_delete_msg.text',
        ),
        primaryBtnStr: this.translocoService.translate('global.delete.btn'),
        secondaryBtnStr: this.translocoService.translate('global.cancel.btn'),
      },
      () => {
        this.schoolService.deleteCompany(company.id.toString()).subscribe({
          next: () => {
            this.toastr.success(
              this.translocoService.translate(
                'global.delete_sub_company_successfully.txt',
              ),
            );
            this.schoolStructureScopeService
              .populateDefaultScope(true)
              .subscribe(() => this.getCompanyDetail());
          },
          error: (error) => {
            this.toastr.showBackendError(error);
          },
        });
      },
      () => {},
    );
  }
}
