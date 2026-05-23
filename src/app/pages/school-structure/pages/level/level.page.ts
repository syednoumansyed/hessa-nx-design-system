import { Component, computed, inject, input, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { IonContent, IonSkeletonText } from '@ionic/angular/standalone';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { faPlus } from '@fortawesome/pro-solid-svg-icons';
import { ClassFormComponent } from './components/class-form.component';
import { LevelsService } from './data-access/levels.service';
import { FeedbackService } from '@shared/services/feedback.service';
import { DsModalService } from '@ds/modal';
import { isMobile } from '@shared/utils/platform';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import {
  ProfileHeaderComponent,
  profileMetadata,
} from '@shared/components/profile-header/profile-header.component';
import {
  NoDataBtnInterface,
  NoDataCardComponent,
} from '@shared/components/no-data-card/no-data-card.component';
import { RbacDirective } from '@shared/role-bace-acces-controller/rbac.directive';
import { ClassCardComponent } from './components/class-card/class-card.component';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { CardListItemSkeletonComponent } from '../../../../shared/components/card-list-item-skeleton/card-list-item-skeleton.component';
import { CardListSkeletonComponent } from '../../../../shared/components/card-list-skeleton/card-list-skeleton.component';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { SchoolService } from '../school/school.service';
import { Idropdown } from '@shared/interfaces';
import { Class, Level, School } from '@shared/dto-transformation/organization';
import { CommonApiService } from '@shared/dto-transformation/common/common.service';

@Component({
  selector: 'app-level-page',
  templateUrl: './level.page.html',
  standalone: true,
  imports: [
    IonSkeletonText,
    TranslocoDirective,
    IonContent,
    HesButtonModule,
    ProfileHeaderComponent,
    NoDataCardComponent,
    RbacDirective,
    ClassCardComponent,
    CardListItemSkeletonComponent,
    CardListSkeletonComponent,
    NgClass,
  ],
})
export class LevelPage {
  levelId = input<string | null>(null);
  schoolId = input<string | null>(null);
  readonly isMobile = isMobile();
  readonly faPlus = faPlus;
  private readonly translocoService = inject(TranslocoService);
  private readonly modalService = inject(DsModalService);
  private readonly levelApiService = inject(LevelsService);
  private readonly commonApiService = inject(CommonApiService);
  private readonly toastr = inject(HesToasterService);
  private readonly feedbackService = inject(FeedbackService);
  private readonly schoolStructureScopeService = inject(
    SchoolStructureScopeService,
  );
  schoolService = inject(SchoolService);
  readonly addClassPermissionId = RESOURCE_PERMISSION.class.createClass;
  readonly schoolDetail = signal<School | undefined>(undefined);
  readonly levelDetail = signal<Level | undefined>(undefined);
  readonly classMetadata = signal<Class[]>([]);
  globalClassesList = signal<Idropdown[]>([]);
  readonly noDataBtnConfig = signal<NoDataBtnInterface>({
    label: this.translate('school_structure.add_class.btn'),
    onAction: () => {
      this.onOpenClassForm();
    },
  }).asReadonly();
  private readonly classesText = signal<string>(
    this.translate('resource.class'),
  ).asReadonly();
  readonly levelMetaData = computed<profileMetadata[]>(() => {
    const numberOfClass = this.levelDetail()?.classes?.length || 0;
    return [
      {
        hesIcon: {
          src: 'assets/icons/level.svg',
          class: 'text-base',
        },
        title: `${numberOfClass}  ${this.classesText()}`,
      },
    ];
  });
  isLoading = signal(false);

  ionViewWillEnter() {
    this.isLoading.set(true);
    this.fetchSchool();
    this.fetchGlobalClassesList();
  }

  async onOpenClassForm(classDetail?: Class) {
    const isEdit = !!classDetail;
    const modalRef = await this.modalService.open({
      component: ClassFormComponent,
      componentProps: {
        schoolDetail: this.schoolDetail()!,
        levelDetail: this.levelDetail()!,
        globalClassesList: this.globalClassesList(),
        ...(classDetail && { classDetail }),
      },
      headerConfig: {
        title: this.translate(
          isEdit
            ? 'school_structure.edit_class.title'
            : 'school_structure.add_class.title',
        ),
        showCloseButton: true,
      },
      footerConfig: {
        primaryButton: { text: this.translate('global.save.btn') },
        secondaryButton: { text: this.translate('global.cancel.btn') },
        buttonSize: 'lg',
      },
      size: 'lg',
    });

    const result = await modalRef.onDismiss();
    if (result.role === 'confirm') {
      this.schoolStructureScopeService
        .populateDefaultScope(true)
        .subscribe(() => this.fetchSchool());
    }
  }

  private fetchSchool() {
    this.schoolService.getSchoolById(+this.schoolId()!).subscribe((data) => {
      this.schoolDetail.set(data);
      this.levelDetail.set(
        data.schoolLevels.find((l) => l.id === +this.levelId()!),
      );
      this.isLoading.set(false);
    });
  }

  private translate(key: string, params: object = {}): string {
    return this.translocoService.translate(key, params);
  }

  async onClassDelete(classId: number) {
    await this.feedbackService.openFeedbackModal(
      {
        type: 'error',
        modalTitle: this.translate('school_structure.class_delete_msg.text'),
        primaryBtnStr: this.translocoService.translate('global.delete.btn'),
        secondaryBtnStr: this.translocoService.translate('global.cancel.btn'),
      },
      () => this.handleClassDelete(classId),
    );
  }

  fetchGlobalClassesList() {
    return this.commonApiService.getClassList().subscribe({
      next: (res) => {
        this.globalClassesList.set(res as Idropdown[]);
      },
    });
  }

  private handleClassDelete(classId: number) {
    this.levelApiService.deleteClass(classId).subscribe({
      next: () => {
        this.toastr.success(
          this.translocoService.translate(
            'global.delete_class_successfully.txt',
          ),
        );
        this.schoolStructureScopeService
          .populateDefaultScope(true)
          .subscribe(() => this.fetchSchool());
      },
      error: (err) => {
        if (err.status === 400) {
          this.toastr.error('', this.translate(err.error.messageRef));
        } else {
          if (err.error.message) {
            this.toastr.error('', err.error.message);
          } else {
            this.toastr.error(
              this.translocoService.translate('global.delete_wrong_msg.txt'),
              this.translocoService.translate('global.wrong_msg.title'),
            );
          }
        }
      },
    });
  }
}
