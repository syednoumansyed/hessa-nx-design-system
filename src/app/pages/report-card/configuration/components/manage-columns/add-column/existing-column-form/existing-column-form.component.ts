import {
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  FormControlGeneratorComponent,
  IControl,
} from '@shared/components/form-control-generator/form-control-generator.component';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { SelectColumnControlComponent } from '../../../column-selection-control/select-column-control.component';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { Idropdown } from '@shared/interfaces';
import { ReportCardExistingColumnDTO } from '@pages/report-card/configuration/data-access/report-card-configuration.model';
import { toDropdown } from '@shared/utils/to-dropdown';
import { ReportCardConfigurationAPIService } from '@pages/report-card/configuration/data-access/report-card-configuration.api-service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, switchMap } from 'rxjs';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { TranslocoDirective } from '@jsverse/transloco';
import { ModalController } from '@ionic/angular/standalone';
import { ManageReportCardContextService } from '@pages/report-card/configuration/services/manage-report-card-context.service';
import { FeedbackService } from '@shared/services/feedback.service';
import { ObjId } from '@shared/interfaces/common.interface';
import {
  ReportCardCalculatedFunctionEnum,
  ReportCardHorizontalFunctionEnum,
} from '@pages/report-card/configuration/data-access/report-card-configuration.enum';
import { STUDENT_REPORT_CARD_STATUS } from '@pages/report-card/processing/data-access/report-card-list.enum';
import {
  ReportCardColumnDetail,
  ReportCardDetail,
} from '@pages/report-card/configuration/data-access/report-card-configuration.interface';

@Component({
  selector: 'app-existing-column-form',
  templateUrl: './existing-column-form.component.html',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormControlGeneratorComponent,
    SelectColumnControlComponent,
    HesButtonModule,
    TranslocoDirective,
  ],
})
export class ExistingColumnFormComponent implements OnInit, OnDestroy {
  // #region Inputs
  reportCard = input.required<ReportCardDetail>();
  column = input<ReportCardExistingColumnDTO | null>(null);

  // #endregion

  // #region injector
  private readonly translateService = inject(HesTranslateService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly academicYearScopeService = inject(AcademicYearsScopeService);
  private readonly reportCardConfigurationAPIService = inject(
    ReportCardConfigurationAPIService,
  );
  private readonly controller = inject(ModalController);
  private readonly destroyRef$ = inject(DestroyRef);
  private readonly toaster = inject(HesToasterService);
  private readonly contextService = inject(ManageReportCardContextService);
  private readonly feedbackService = inject(FeedbackService);
  // #endregion

  // #region protected properties
  protected readonly form = this.fb.group({
    id: this.fb.control<number | null>(null),
    title: this.fb.control<string>('', Validators.required),
    semester: this.fb.control(null),
    reportCardId: this.fb.control<ObjId | null>(null),
    scaleMaxMarks: this.fb.control<number | null>(null),
    reportCardColumnId: this.fb.control<number[]>([], Validators.required),
  });

  protected readonly formConfig = computed<IControl[]>(() => {
    return [
      {
        label: this.translateService.t('global.title.label'),
        placeholder: this.translateService.t(
          'grade_management.column_title.placeholder',
        ),
        formControlName: 'title',
        type: 'input',
        required: true,
      },
      {
        label: this.translateService.t('global.semester.title'),
        placeholder: this.translateService.t(
          'global.select_semester.placeholder',
        ),
        formControlName: 'semester',
        type: 'searchable-select',
        selectValues: this.semesters(),
        required: false,
      },
      {
        label: this.translateService.t('grade_management.report_card.title'),
        placeholder: this.translateService.t(
          'grade_management.select_report_card.placeholder',
        ),
        formControlName: 'reportCardId',
        type: 'searchable-select',
        selectValues: this.reportCards(),
        required: false,
      },
      {
        label: this.translateService.t(
          'grade_management.scale_maximum_mark.title',
        ),
        placeholder: this.translateService.t(
          'grade_management.enter_max_mark.placeholder',
        ),
        formControlName: 'scaleMaxMarks',
        type: 'input',
        required: false,
        inputType: 'number',
      },
    ];
  });

  protected readonly selectedReportCardColumns = signal<Idropdown[]>([]);
  // #endregion

  // #region Private methods
  private readonly semesters = signal<Idropdown[]>([]);
  private readonly reportCards = signal<Idropdown[]>([]);

  // #endregion
  ngOnDestroy(): void {}

  // #region lifecycle hook
  ngOnInit() {
    this.setSemesters();
    this.fetchReportCards();
    this.form.controls.semester.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef$))
      .subscribe((semesterId) => {
        this.fetchReportCards(semesterId);
      });

    this.form.controls.reportCardId.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef$),
        switchMap((id) => {
          if (!id) return EMPTY;
          return this.reportCardConfigurationAPIService.getReportCardById(id);
        }),
      )
      .subscribe((reportCard) => {
        const { columns, existingColumns } = reportCard;
        this.selectedReportCardColumns.set(
          toDropdown(this.getValidColumns([...(columns ?? [])]), 'title'),
        );
      });

    if (this.column()) {
      const { id, title, scaleMaxMarks, reportCardColumnId } = this.column()!;
      this.reportCardConfigurationAPIService
        .getExistingColumns(id)
        .subscribe((resp) => {
          const { reportCardColumn } = resp;
          const column = toDropdown([reportCardColumn], 'title');
          this.selectedReportCardColumns.set(column);
        });
      this.form.patchValue({
        id,
        title,
        scaleMaxMarks,
        reportCardColumnId: [reportCardColumnId],
        reportCardId: this.column()!.reportCardId,
      });
    }
  }

  onCloseModal(isChange = false): void {
    setTimeout(() => {
      this.controller.dismiss(isChange);
    }, 300);
  }

  protected onSave() {
    if (this.column()) {
      this.showConfirmationModalForUpdate();
    } else {
      this.saveColumn();
    }
  }

  // #endregion

  // #region private methods

  private saveColumn() {
    const { id, title, scaleMaxMarks, reportCardColumnId } = this.form.value;
    const payload = {
      title: title!,
      scaleMaxMarks: scaleMaxMarks ?? null,
      reportCardColumnId: reportCardColumnId![0],
    };
    let obs$ = this.reportCardConfigurationAPIService.createExistingColumn({
      ...payload,
      reportCardId: this.reportCard().id,
    });
    if (id) {
      obs$ = this.reportCardConfigurationAPIService.updateExistingColumn(
        id,
        payload,
      );
    }
    obs$.subscribe({
      next: () => {
        this.onCloseModal(true);
        this.contextService.onRefatchReportCardDetail();
      },
      error: (error) => {
        this.toaster.showBackendError(error);
      },
    });
  }

  private fetchReportCards(semesterId?: string | null): void {
    this.reportCardConfigurationAPIService
      .fetchReportCards({
        academicYearId: this.reportCard().academicYearId,
        ...(semesterId && { semesterId }),
        pageNumber: 1,
        itemsPerPage: 300,
        schoolId: this.reportCard().schoolId,
        levelIds: this.reportCard().levels.map((level) => level.id),
        status: STUDENT_REPORT_CARD_STATUS.PUBLISHED,
      })
      .subscribe({
        next: (reportCards) => {
          const filteredReportCards = reportCards.data.filter(
            (rc) => rc.id !== this.reportCard().id,
          );
          this.reportCards.set(toDropdown(filteredReportCards, 'title'));
        },
        error: (error) => {
          this.reportCards.set([]);
          if (error.status !== 404) {
            this.toaster.showBackendError(error);
          }
        },
      });
  }
  private setSemesters(): void {
    const getSemesterByAcadmicYearId =
      this.academicYearScopeService.createSemestersByAcademicYearId();
    this.semesters.set(
      toDropdown(getSemesterByAcadmicYearId(this.reportCard().academicYearId)),
    );
  }

  private showConfirmationModalForUpdate() {
    this.feedbackService.openFeedbackModal(
      {
        type: 'error',
        modalTitle: this.translateService.t(
          'grade_management.update_report_card_alert.txt',
        ),
        primaryBtnStr: this.translateService.globalTObj.update,
        secondaryBtnStr: this.translateService.globalTObj.cancel,
      },
      () => {
        this.saveColumn();
      },
    );
  }

  private getValidColumns(
    columns: ReportCardColumnDetail[],
  ): ReportCardColumnDetail[] {
    return columns.filter((col) => {
      if (col.functionType) {
        return [
          ...new Set([
            ReportCardCalculatedFunctionEnum.SUM,
            ReportCardCalculatedFunctionEnum.AVERAGE,
            ReportCardCalculatedFunctionEnum.WEIGHTED_AVERAGE,
            ReportCardHorizontalFunctionEnum.SUM,
            ReportCardHorizontalFunctionEnum.AVERAGE,
          ]),
        ].includes(col.functionType);
      }
      return true;
    });
  }
  // #endregion
}
