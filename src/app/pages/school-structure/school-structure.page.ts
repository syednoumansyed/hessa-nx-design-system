import { Component, inject, signal } from '@angular/core';
import {
  IonContent,
  ModalController,
  IonSkeletonText,
} from '@ionic/angular/standalone';
import { profileMetadata } from '@shared/components/profile-header/profile-header.component';
import {
  CardListItemComponent,
  CardListItemConfig,
} from '@shared/components/card-list-item/card-list-item.component';
import { SchoolStructureService } from './school-structure.service';
import { faPlus } from '@fortawesome/pro-solid-svg-icons';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { Router } from '@angular/router';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { openAddEditCompanyModal } from './components/add-edit-company-modal';
import { FeedbackService } from '@shared/services/feedback.service';
import { isMobile } from '@shared/utils/platform';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { CardListSkeletonComponent } from '../../shared/components/card-list-skeleton/card-list-skeleton.component';
import { RESOURCE_PERMISSION } from '../../shared/role-bace-acces-controller/resource-permission.constant';
import { RbacDirective } from '@shared/role-bace-acces-controller/rbac.directive';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { Company } from '@shared/dto-transformation/organization';

@Component({
  selector: 'app-school-structure',
  templateUrl: './school-structure.page.html',
  styleUrls: ['./school-structure.page.scss'],
  standalone: true,
  imports: [
    IonSkeletonText,
    IonContent,
    CardListItemComponent,
    TranslocoDirective,
    HesButtonModule,
    CardListSkeletonComponent,
    RbacDirective,
  ],
})
export class SchoolStructurePage {
  isMobile = signal(isMobile());

  private schoolService = inject(SchoolStructureService);
  private translocoService = inject(TranslocoService);
  private router = inject(Router);
  private modalCtrl = inject(ModalController);
  private feedbackService = inject(FeedbackService);
  private toastr = inject(HesToasterService);
  private schoolStructureScopeService = inject(SchoolStructureScopeService);

  isLoading = signal(false);

  metadata = signal<profileMetadata[]>([]);
  companiesMappedList = signal<CardListItemConfig[]>([]);
  faPlus = faPlus;

  companies = signal<Company[]>([]);

  addCompanyPermission = RESOURCE_PERMISSION.company.createCompany;

  primaryButton = {
    label: 'Add Company',
    onAction: () => {
      this.onAddEditCompany();
    },
  };

  ionViewWillEnter() {
    this.getParentCompanies();
  }

  getParentCompanies() {
    this.isLoading.set(true);
    this.schoolService.fetchParentCompanies().subscribe({
      next: (companies) => {
        this.companies.set(companies);
        this.setCompaniesMetadata(companies);
        this.schoolStructureScopeService.populateDefaultScope(true).subscribe();
        this.isLoading.set(false);
      },
    });
  }

  setCompaniesMetadata(companies: Company[]) {
    const mappedCompanies = companies.map((company) => {
      let schoolsCount = 0;
      if (company.campuses.length) {
        schoolsCount = company.campuses?.reduce(
          (acc, campus) => acc + campus.schools.length,
          0,
        );
      } else if (company.subCompanies.length) {
        schoolsCount = company.subCompanies?.reduce(
          (acc, subCompany) =>
            acc +
            subCompany.campuses.reduce(
              (acc, campus) => acc + campus.schools.length,
              0,
            ),
          0,
        );
      }
      const metadata = {
        title: company.displayName,
        icon: {
          hesIcon: {
            src: 'assets/icons/company.svg',
          },
        },
        data: {},
        info: [
          {
            label:
              company.subCompanies?.length +
              ' ' +
              this.translocoService.translate(
                'school_structure.sub_company.title',
              ),
            hesIcon: {
              src: 'assets/icons/sub-company.svg',
            },
          },
          {
            label:
              company.campuses.length +
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
              this.router.navigate(['school-structure', 'company', company.id]);
            },
            hasAccess: company.hasAccess,
          },
          {
            label: this.translocoService.translate('global.edit.btn'),
            onAction: () => {
              this.onAddEditCompany(company);
            },
            hasAccess: company.hasAccess,
          },
        ],
      };

      if (!company.subCompanies?.length && !company.campuses?.length) {
        metadata.actions.push({
          label: this.translocoService.translate('global.delete.btn'),
          onAction: () => {
            this.onDeleteCompany(company);
          },
          hasAccess: company.hasAccess,
        });
      }

      return metadata;
    });
    this.companiesMappedList.set(mappedCompanies);
  }

  onAddEditCompany = (company: Company | null = null) => {
    openAddEditCompanyModal({
      modalCtrl: this.modalCtrl,
      closeModal: this.closeModal,
      companyDetails: company ? company : undefined,
      isSubCompany: false,
      mobile: this.isMobile(),
      onSuccess: () => {
        this.getParentCompanies();
        this.schoolStructureScopeService.populateDefaultScope(true).subscribe();
      },
    });
  };

  onDeleteCompany(company: Company) {
    this.feedbackService.openFeedbackModal(
      {
        type: 'error',
        modalTitle: '',
        modalMessage: this.translocoService.translate(
          'school_structure.company_delete_msg.text',
        ),
        primaryBtnStr: this.translocoService.translate('global.delete.btn'),
        secondaryBtnStr: this.translocoService.translate('global.cancel.btn'),
      },
      () => {
        this.schoolService.deleteCompany(company.id.toString()).subscribe({
          next: () => {
            this.toastr.success(
              this.translocoService.translate(
                'global.delete_company_successfully.txt',
              ),
            );
            this.getParentCompanies();
            this.schoolStructureScopeService
              .populateDefaultScope(true)
              .subscribe();
          },
          error: (error) => {
            this.toastr.showBackendError(error);
          },
        });
      },
      () => {},
    );
  }

  translate(key: string, params: object = {}): string {
    return this.translocoService.translate(key, params);
  }

  closeModal = () => this.modalCtrl.dismiss();
}
