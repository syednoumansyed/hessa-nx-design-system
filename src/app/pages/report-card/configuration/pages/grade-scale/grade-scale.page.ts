import {
  Component,
  computed,
  OnInit,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { TranslocoDirective } from '@jsverse/transloco';
import { ITableCol } from '@ui-kit/hes-table/model';
import { IAction } from '@ui-kit/hes-action-sheet/model';
import {
  faEye,
  faPen,
  faPlus,
  faTrashCan,
  faWarning,
} from '@fortawesome/pro-regular-svg-icons';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { GradeScaleAPIService } from '@pages/report-card/configuration/data-access/grage-scale.api-service';
import { LetterGradeScaleDTO } from '@pages/report-card/configuration/data-access/grade-scales.model';
import { ListViewContainerComponent } from '@ui-kit/hes-responsive-list-view/list-view-container/list-view-container.component';
import { ObjId } from '@shared/interfaces/common.interface';
import { FeedbackService } from '@shared/services/feedback.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { HesDatePipe } from '@shared/pipes/hessa-date.pipe';
import { EducationalPathEnum, enumArrayFromEnum } from '@shared/enums';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { createFormGradesScaleModal } from '../../components/grades-scale-form/grades-scale-form';
import { IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-grade-scale',
  templateUrl: './grade-scale.page.html',
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    FormsModule,
    TranslocoDirective,
    HesButtonModule,
    ListViewContainerComponent,
  ],
  providers: [HesDatePipe],
})
export class GradeScalePage implements OnInit {
  // #region Injectables
  private readonly toaster = inject(HesToasterService);
  private readonly feedbackService = inject(FeedbackService);
  private readonly translateService = inject(HesTranslateService);
  private readonly gradeScaleAPIService = inject(GradeScaleAPIService);
  private readonly rbacService = inject(RoleBaseAccessControlService);
  private readonly datePipe = inject(HesDatePipe);
  // #endregion

  // #region Angular ref
  viewContainerListRef = viewChild(ListViewContainerComponent);
  // #endregion
  // #region Protected Properties
  protected readonly primaryBtnConfig = {
    iconProps: { icon: faPlus },
    text: this.translateService.t('grade_management.add_grade_scale.btn'),
    onClick: () => this.openGradeScaleForm(),
    isVisible: () => {
      return this.rbacService.hasPermission(
        RESOURCE_PERMISSION.GRADE_MANAGEMENT.GRADE_SCALE.CREATE,
      );
    },
  };

  protected readonly actions = computed<IAction<any>[]>(() => {
    const { GRADE_SCALE } = RESOURCE_PERMISSION.GRADE_MANAGEMENT;
    return [
      {
        iconProps: { icon: faPen },
        hasPermission: () => {
          return this.rbacService.hasPermission(GRADE_SCALE.UPDATE);
        },
        text: this.translateService.t('global.edit.btn'),
        onClick: (data) => {
          this.onEditGradeScale(data.id);
        },
        mobileViewConfig: {
          isPrimaryBtn: true,
          buttonInfo: {
            color: 'secondary',
          },
        },
      },
      {
        iconProps: { icon: faEye },
        hasPermission: () => {
          return this.rbacService.hasPermission(GRADE_SCALE.READ);
        },
        text: this.translateService.t('global.view.btn'),
        onClick: (data) => {
          this.onViewGradeScale(data.id);
        },
        mobileViewConfig: {
          isPrimaryBtn: true,
          buttonInfo: {
            color: 'primary',
          },
        },
      },
      {
        iconProps: { icon: faTrashCan, flip: 'horizontal' },
        text: this.translateService.t('global.delete.btn'),
        hasPermission: () => {
          return this.rbacService.hasPermission(GRADE_SCALE.DELETE);
        },
        onClick: (data) => {
          this.showDeleteConfirmation(data.id);
        },
      },
    ];
  });

  protected readonly columnsDef: ITableCol<LetterGradeScaleDTO>[] = [
    {
      field: 'educationalPath',
      headerName: this.translateService.t(
        'grade_management.education_path.title',
      ),
      filter: true,
      filterType: 'chip-selector',
      filterSelectOptions: enumArrayFromEnum(EducationalPathEnum).map(
        (status) => ({
          value: status as string | number,
          displayedValue: this.translateService.enumT(status as string),
        }),
      ),
      sortable: false,
      valueFormatter: ({ data }) => {
        return this.translateService.enumT(data.educationalPath);
      },
    },
    {
      field: 'academicYear',
      headerName: this.translateService.t('global.academic_year.title'),
      filterType: 'chip-selector',
      filter: true,
      sortable: false,
      valueFormatter: ({ data }) => {
        return data.academicYear?.name;
      },
    },
    {
      field: 'lastEdited',
      headerName: this.translateService.t('grade_management.last_edited.title'),
      filter: false,
      sortable: false,
      valueFormatter: ({ data }) => {
        return this.datePipe.transform(data.updatedAt || data.createdAt);
      },
    },
    {
      field: 'actions',
      headerName: this.translateService.t('global.actions.title'),
      filter: false,
      sortable: false,
      type: 'action',
      actions: this.actions(),
    },
  ];

  protected readonly noDataCardConfig = computed(() => {
    const hasCreatePermission = this.rbacService.hasPermission(
      RESOURCE_PERMISSION.GRADE_MANAGEMENT.GRADE_SCALE.CREATE,
    );

    return {
      title: this.translateService.t(
        'grade_management.no_grade_scale_available.title',
      ),
      allowFullScreen: true,
      ...(hasCreatePermission && {
        description: this.translateService.t(
          'grade_management.no_grade_scale_added.txt',
        ),
        primaryButton: {
          label: this.translateService.t(
            'grade_management.add_grades_scale.btn',
          ),
          onAction: () => {
            this.openGradeScaleForm();
          },
        },
      }),
    };
  });

  protected readonly gradeScaleList = signal<any[]>([]); //specify type
  //#endregion

  // #region private Properties
  private readonly formGradesScaleModal = createFormGradesScaleModal();
  // #endregion

  //#region Lifecycle Hooks
  constructor() {}

  ngOnInit() {}
  //#endregion

  //#region Protected Methods

  protected fetchGradeScales = ({
    educationalPath,
    academicYear: academicYearId,
  }: any) => {
    return this.gradeScaleAPIService.getGradeScales({
      educationalPath,
      academicYearId,
    });
  };

  //#endregion

  // #region Private Methods

  private async showDeleteConfirmation(id: ObjId) {
    return await this.feedbackService.openFeedbackModal(
      {
        type: 'error',
        modalTitle: this.translateService.t(
          'grade_management.delete_grade_scale.title',
        ),
        primaryBtnStr: this.translateService.t('global.delete.btn'),
        secondaryBtnStr: this.translateService.t('global.cancel.btn'),
      },
      () => {
        return this.gradeScaleAPIService.deleteGradeScale(id).subscribe({
          next: () => {
            this.toaster.success(
              this.translateService.t('grade_management.delete_success.txt'),
            );
            this.reload();
          },
          error: (err) => {
            this.toaster.showBackendError(err);
          },
        });
      },
    );
  }

  private async onViewGradeScale(id: ObjId) {
    await this.formGradesScaleModal({ gradeScaleId: id, isView: true });
  }

  private async openGradeScaleForm() {
    await this.formGradesScaleModal();
    this.reload();
  }

  private async onEditGradeScale(id: ObjId) {
    const isChangeData = await this.formGradesScaleModal({ gradeScaleId: id });
    if (isChangeData) {
      this.reload();
    }
  }

  private reload() {
    this.viewContainerListRef()?.triggerFetch();
  }
  // #endregion
}
