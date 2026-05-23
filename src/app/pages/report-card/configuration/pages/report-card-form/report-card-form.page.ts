import {
  Component,
  DestroyRef,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  NonNullableFormBuilder,
  Validators,
} from '@angular/forms';
import { IonContent, IonButton } from '@ionic/angular/standalone';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { HessaBtnDirective } from '@ui-kit/hes-button/hes-button.directive';
import { TranslocoDirective } from '@jsverse/transloco';
import { ReportCardOverviewFormComponent } from '../../components/report-card-overview-form/report-card-overview-form.component';
import { HesStepperComponent } from '@ui-kit/hes-stepper/hes-stepper.component';
import { CdkStepperModule } from '@angular/cdk/stepper';
import { ManageColumnsLandingComponent } from '../../components/manage-columns/manage-columns-landing.component';
import { isMobile } from '@shared/utils/platform';
import { faAngleRight, faPlus } from '@fortawesome/pro-regular-svg-icons';
import { ObjId } from '@shared/interfaces/common.interface';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { ReportCardFormPayload } from '@pages/report-card/configuration/data-access/report-card-configuration.model';
import { ReportCardConfigurationAPIService } from '@pages/report-card/configuration/data-access/report-card-configuration.api-service';
import { SchoolStructureEntityType } from '@ui-kit/hes-school-structure-control/school-structure-control-item.interface';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { RbacDirective } from '@shared/role-bace-acces-controller/rbac.directive';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { ManageReportCardContextService } from '../../services/manage-report-card-context.service';
import { createReportCardPreviewDialog } from '@pages/report-card/configuration/components/report-card-preview/report-card-preview-dialog';
import { ReportCardDetail } from '../../data-access/report-card-configuration.interface';
import { ensureArray } from '@shared/utils/array.util';

@Component({
  templateUrl: './report-card-form.page.html',
  standalone: true,
  imports: [
    IonButton,
    HesButtonModule,
    HessaBtnDirective,
    IonContent,
    CommonModule,
    FormsModule,
    TranslocoDirective,
    ReportCardOverviewFormComponent,
    HesStepperComponent,
    CdkStepperModule,
    FontAwesomeModule,
    RbacDirective,
    ManageColumnsLandingComponent,
  ],
})
export class ReportCardFormPage implements OnInit {
  reportCardId = input<ObjId | null>(null);
  // #region Injectable
  private readonly toaster = inject(HesToasterService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly contextService = inject(ManageReportCardContextService);
  private readonly translateService = inject(HesTranslateService);
  private readonly reportCardConfigurationAPIService = inject(
    ReportCardConfigurationAPIService,
  );
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly previewDialog = createReportCardPreviewDialog();

  // #endregion

  // #region Protected properties
  protected readonly isView = this.contextService.isView;
  protected readonly isEdit = this.contextService.isEdit;
  protected readonly isCreate = this.contextService.isCreate;
  protected readonly isMobile = isMobile();
  protected readonly currentStep = this.contextService.currentStep;
  protected readonly overviewForm = this.fb.group({
    title: this.fb.control<string>('', Validators.required),
    schoolIds: this.fb.control<
      Array<{
        id: number;
        type: SchoolStructureEntityType;
      }>
    >([], Validators.required),
    levelIds: this.fb.control<number[]>([], Validators.required),
    academicYearId: this.fb.control<number | null>(null, Validators.required),
    semesterId: this.fb.control<number | null>(null),
    startDate: this.fb.control<Date | null>(null, Validators.required),
    endDate: this.fb.control<Date | null>(null, Validators.required),
  });
  protected readonly addIcon = faPlus;
  protected readonly angleRight = faAngleRight;
  protected readonly reportCardDetail = signal<ReportCardDetail | null>(null);
  protected readonly createReportCardPermission =
    RESOURCE_PERMISSION.GRADE_MANAGEMENT.REPORT_CARD.CREATE;
  protected readonly viewReportCardPermission =
    RESOURCE_PERMISSION.GRADE_MANAGEMENT.REPORT_CARD.VIEW;
  protected readonly updateReportCardPermission =
    RESOURCE_PERMISSION.GRADE_MANAGEMENT.REPORT_CARD.UPDATE;
  protected isDisableBtn = signal<boolean>(false);
  // #endregion

  // #region Private properties
  private readonly destroyRef$ = inject(DestroyRef);
  // #endregion
  constructor() {}

  ngOnInit() {
    this.contextService.refatchReportCardDetail$
      .pipe(takeUntilDestroyed(this.destroyRef$))
      .subscribe(() => {
        this.fetchReportCardDetail();
      });
  }

  ionViewWillEnter() {
    this.initFormState();
  }

  onCancel() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  // #region Protected methods
  protected onOverViewNext() {
    this.contextService.setStep(1);
    if (!this.reportCardDetail()?.columns) {
      this.contextService.setCreateState();
    }
  }

  protected onPreviewReportCard() {
    const reportCard = this.reportCardDetail();
    if (!reportCard) return;
    this.previewDialog(reportCard, this.isMobile);
  }

  protected onEditClick() {
    this.contextService.setEditState();
  }

  protected onPrevious() {
    this.contextService.setStep(0);
    this.initFormState();
  }

  protected onAllowEditSecondStep() {
    this.contextService.setEditState();
  }

  protected onSave() {
    this.isDisableBtn.set(true);
    if (this.reportCardId()) {
      this.onUpdate();
    } else {
      this.onReportCardCreate();
    }
  }

  protected selectedIndexChange(idx: number) {
    this.contextService.setStep(idx);
  }
  // #endregion

  // #region Private methods
  private initFormState() {
    if (this.reportCardId()) {
      if (this.currentStep() === 0) {
        this.contextService.setViewState();
      }
      this.fetchReportCardDetail();
    } else {
      this.contextService.setCreateState();
    }
  }

  private fetchReportCardDetail() {
    const reportCardId = this.reportCardId();
    if (!reportCardId) return;
    this.reportCardConfigurationAPIService
      .getReportCardById(reportCardId)
      .subscribe((resp) => {
        const { startDate, endDate } = resp;
        this.reportCardDetail.set(resp);
        this.overviewForm.patchValue({
          title: resp.title,
          schoolIds: [{ id: resp.schoolId, type: 'school' }],
          levelIds: resp.levels.map((level) => level.id),
          academicYearId: resp.academicYearId,
          semesterId: resp.semesters?.length ? resp.semesters[0].id : null,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
        });
      });
  }
  private onUpdate() {
    this.reportCardConfigurationAPIService
      .updateReportCard(this.reportCardId()!, this.restPayload())
      .subscribe({
        next: () => {
          this.contextService.setStep(1);
          this.initFormState();
          this.toaster.success(
            this.translateService.t(
              'grade_management.report_card_update_success.txt',
            ),
          );
          this.isDisableBtn.set(false);
        },
        error: (error) => {
          this.toaster.showBackendError(error);
          this.isDisableBtn.set(false);
        },
      });
  }

  private onReportCardCreate() {
    this.reportCardConfigurationAPIService
      .createReportCard(this.restPayload())
      .subscribe({
        next: (resp) => {
          this.contextService.setStep(1);
          this.contextService.setCreateState();
          this.router.navigate(['../', resp.id], { relativeTo: this.route });
          this.toaster.success(
            this.translateService.t('grade_management.report_card_success.txt'),
          );
          this.isDisableBtn.set(false);
        },
        error: (error) => {
          this.toaster.showBackendError(error);
          this.isDisableBtn.set(false);
        },
      });
  }

  private restPayload(): ReportCardFormPayload {
    const {
      title,
      schoolIds,
      levelIds,
      academicYearId,
      semesterId,
      startDate,
      endDate,
    } = this.overviewForm.value;
    const schoolId = ensureArray(schoolIds!).length
      ? ensureArray(schoolIds!)[0].id
      : null;

    // Set endDate to end of day (23:59:59.999)
    const endOfDay = endDate ? new Date(endDate) : null;
    if (endOfDay) {
      endOfDay.setHours(23, 59, 59, 999);
    }

    return {
      title: title!,
      schoolId: schoolId!,
      levelIds: ensureArray(levelIds),
      academicYearId: academicYearId!,
      semesterId: semesterId ?? null,
      startDate: startDate!,
      endDate: endOfDay!,
    };
  }
  // #endregion
}
