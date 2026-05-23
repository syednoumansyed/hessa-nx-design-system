import { Component, inject, input, signal } from '@angular/core';
import {
  ModalController,
  IonContent,
  IonSkeletonText,
} from '@ionic/angular/standalone';
import { Router, RouterModule } from '@angular/router';
import { NgClass } from '@angular/common';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { faPlus } from '@fortawesome/pro-solid-svg-icons';
import { openAddEditLevelModal } from '@pages/school-structure/pages/school/add-edit-level-modal';
import { SchoolService } from '@pages/school-structure/pages/school/school.service';
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
import {
  NoDataBtnInterface,
  NoDataCardComponent,
} from '@shared/components/no-data-card/no-data-card.component';
import { FeedbackService } from '@shared/services/feedback.service';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { RbacDirective } from '@shared/role-bace-acces-controller/rbac.directive';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { ToastrService } from 'ngx-toastr';
import { HesSchoolGenderPipe } from '@shared/pipes/hes-school-gender.pipe';
import { HesEducationalPathPipe } from '@shared/pipes/educational-path.pipe';
import { CardListItemSkeletonComponent } from '../../../../shared/components/card-list-item-skeleton/card-list-item-skeleton.component';
import { CardListSkeletonComponent } from '../../../../shared/components/card-list-skeleton/card-list-skeleton.component';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { Level, School } from '@shared/dto-transformation/organization';

@Component({
  selector: 'app-school-page',
  templateUrl: 'school.page.html',
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
export class SchoolPage {
  id = input<string | null>(null);
  isMobile = isMobile();
  hesSchoolGenderPipe = inject(HesSchoolGenderPipe);
  faPlus = faPlus;
  companyService = inject(CompanyService);
  schoolService = inject(SchoolService);
  feedbackService = inject(FeedbackService);
  translocoService = inject(TranslocoService);
  private readonly router = inject(Router);
  private modalCtrl = inject(ModalController);
  private toastr = inject(ToastrService);
  private readonly educationalPathPipe = inject(HesEducationalPathPipe);
  private readonly schoolStructureScopeService = inject(
    SchoolStructureScopeService,
  );
  schoolDetails = signal<School | undefined>(undefined);
  schoolMetadata = signal<profileMetadata[]>([]);
  levelsMetadata = signal<CardListItemConfig[]>([]);
  levelsText = signal<string>(this.translate('resource.level'));
  classesText = signal<string>(this.translate('resource.class'));
  noDataBtnConfig = signal<NoDataBtnInterface>({
    label: this.translate('school_structure.add_level.btn'),
    onAction: () => {
      this.onAddEditLevel();
    },
  });
  public readonly addLevelPermissoinId = RESOURCE_PERMISSION.level.createLevel;
  isLoading = signal(false);

  constructor() {}

  ionViewWillEnter() {
    this.getSchoolDetail();
  }

  translate(key: string, params: object = {}): string {
    return this.translocoService.translate(key, params);
  }

  closeModal = () => this.modalCtrl.dismiss();

  /**
   * Opens the add/edit level modal.
   */
  onAddEditLevel = () => {
    openAddEditLevelModal({
      modalCtrl: this.modalCtrl,
      closeModal: this.closeModal,
      schoolDetails: this.schoolDetails()!,
      mobile: this.isMobile,
      refreshSchoolDetails: () => {
        this.schoolStructureScopeService
          .populateDefaultScope(true)
          .subscribe(() => this.getSchoolDetail());
      },
    });
  };

  setSchoolMetadata(school: School) {
    this.schoolMetadata.set([
      {
        hesIcon: {
          src: 'assets/icons/user.svg',
          class: 'text-base',
        },
        title: this.hesSchoolGenderPipe.transform(school.gender),
      },
      {
        hesIcon: {
          src: 'assets/icons/level.svg',
          class: 'text-base',
        },
        title: `${school.schoolLevels.length} ${this.levelsText()}`,
      },
      {
        hesIcon: {
          src: 'assets/icons/routing.svg',
          class: 'text-base',
        },
        title: this.educationalPathPipe.transform(school.educationalPath),
      },
      {
        hesIcon: {
          src: 'assets/icons/school.svg',
          class: 'text-base',
        },
        title: `${school.stage?.displayName}`,
      },
    ]);
  }

  setLevelsMetadata(levels: Level[]) {
    const schoolsMetadata = levels.map((level) => {
      const metadata: CardListItemConfig = {
        title: level.displayName,
        icon: {
          hesIcon: {
            src: 'assets/icons/level.svg',
          },
        },
        data: {},
        info: [
          {
            label: `${level.classes?.length} ${this.classesText()}`,
            hesIcon: {
              src: 'assets/icons/class.svg',
            },
          },
        ],
        actions: [
          {
            label: this.translocoService.translate('global.view.btn'),
            onAction: () => {
              this.router.navigate([
                `school-structure/school/${this.id()}/level`,
                level.id,
              ]);
            },
            hasAccess: level.hasAccess ?? false,
          },
        ],
      };

      // Conditionally add "Delete" action if class count is greater than 0
      if (level.classes?.length === 0) {
        metadata.actions?.push({
          label: this.translocoService.translate('global.delete.btn'),
          onAction: () => {
            this.onLevelDelete(level.id);
          },
          permissionId: this.addLevelPermissoinId,
          hasAccess: level.hasAccess ?? false,
        });
      }

      return metadata;
    });
    this.levelsMetadata.set(schoolsMetadata);
  }

  /**
   * Retrieves the details of a school by its ID.
   */
  getSchoolDetail = () => {
    this.isLoading.set(true);
    this.schoolService.getSchoolById(+this.id()!).subscribe((school) => {
      this.schoolDetails.set(school);
      this.setSchoolMetadata(school);
      this.setLevelsMetadata(school.schoolLevels);
      this.isLoading.set(false);
    });
  };

  handleDeleteLevel = (levelId: number) => {
    const schoolDetails = this.schoolDetails();
    if (schoolDetails) {
      const levelIds = schoolDetails.schoolLevels
        .map((level: Level) => level.id)
        .filter((id: number) => id !== levelId);

      this.schoolService
        .updateSchoolLevels(schoolDetails.id, { levelIds: levelIds })
        .subscribe({
          next: () => {
            this.toastr.success(
              undefined,
              this.translocoService.translate(
                'global.delete_level_successfully.txt',
              ),
            );
            this.getSchoolDetail();
            this.schoolStructureScopeService
              .populateDefaultScope(true)
              .subscribe();
          },
          error: () => {
            this.toastr.error(
              undefined,
              this.translocoService.translate('global.delete_wrong_msg.txt'),
            );
          },
        });
    }
  };

  /**
   * Deletes a level from the school.
   * @param levelId The ID of the level to delete.
   */
  async onLevelDelete(levelId: number) {
    await this.feedbackService.openFeedbackModal(
      {
        type: 'error',
        modalTitle: this.translate('school_structure.level_delete_msg.text'),
        primaryBtnStr: this.translocoService.translate('global.delete.btn'),
        secondaryBtnStr: this.translocoService.translate('global.cancel.btn'),
      },
      () => this.handleDeleteLevel(levelId),
    );
  }
}
