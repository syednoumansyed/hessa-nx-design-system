import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { IonButton } from '@ionic/angular/standalone';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { HessaBtnDirective } from '@ui-kit/hes-button/hes-button.directive';
import { faClose } from '@fortawesome/pro-regular-svg-icons';
import { SingleEntryFormComponent } from '../single-entry-form/single-entry-form.component';
import { CalculatedColumnFormComponent } from '../calculated-column-form/calculated-column-form.component';
import { HorizentalCalculatedFormComponent } from '../horizental-calculated-form/horizental-calculated-form.component';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import {
  FormControlGeneratorComponent,
  IControl,
  ISelectValue,
} from '@shared/components/form-control-generator/form-control-generator.component';
import { CommonModule } from '@angular/common';
import {
  ReportCardCalculatedFunctionEnum,
  ReportCardColumnTypeEnum,
  ReportCardHorizontalFunctionEnum,
} from '@pages/report-card/configuration/data-access/report-card-configuration.enum';
import { TranslocoDirective } from '@jsverse/transloco';
import { ReportCardConfigurationAPIService } from '@pages/report-card/configuration/data-access/report-card-configuration.api-service';
import { ObjId } from '@shared/interfaces/common.interface';
import {
  ReportCardColumnDetailDTO,
  ReportCardColumnFormPayload,
  SubjectWithMaxMarks,
} from '@pages/report-card/configuration/data-access/report-card-configuration.model';
import { Idropdown } from '@shared/interfaces';
import { toDropdown } from '@shared/utils/to-dropdown';
import { ModalController } from '@ionic/angular/standalone';
import { ManageReportCardContextService } from '@pages/report-card/configuration/services/manage-report-card-context.service';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { FeedbackService } from '@shared/services/feedback.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ReportCardDetail } from '@pages/report-card/configuration/data-access/report-card-configuration.interface';

const DefaultNewColumnType = ReportCardColumnTypeEnum.CALCULATED;

@Component({
  selector: 'app-new-column-form',
  templateUrl: './new-column-form.component.html',
  standalone: true,
  imports: [
    IonButton,
    HesButtonModule,
    HessaBtnDirective,
    CommonModule,
    TranslocoDirective,
    ReactiveFormsModule,
    FormControlGeneratorComponent,
    SingleEntryFormComponent,
    CalculatedColumnFormComponent,
    HorizentalCalculatedFormComponent,
  ],
})
export class NewColumnFormComponent implements OnInit {
  // #region Inputs
  reportCard = input.required<ReportCardDetail>();
  column = input<ReportCardColumnDetailDTO | null>(null);

  // #endregion

  // #region Injectables
  private readonly destroyRef$ = inject(DestroyRef);
  private readonly toaster = inject(HesToasterService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly translateService = inject(HesTranslateService);
  private readonly reportCardConfigurationAPIService = inject(
    ReportCardConfigurationAPIService,
  );
  private readonly controller = inject(ModalController);
  private readonly contextService = inject(ManageReportCardContextService);
  private readonly feedbackService = inject(FeedbackService);
  // #endregion

  // #region Angular Refs
  calculatedColumnRef = viewChild<CalculatedColumnFormComponent>(
    CalculatedColumnFormComponent,
  );
  horizentalColumnRef = viewChild<HorizentalCalculatedFormComponent>(
    HorizentalCalculatedFormComponent,
  );
  singleEntryColumnRef = viewChild<SingleEntryFormComponent>(
    SingleEntryFormComponent,
  );
  // #endregion
  // #region Protected Properties

  protected readonly calculationType =
    signal<ReportCardColumnTypeEnum>(DefaultNewColumnType);

  protected faClose = faClose;

  protected readonly form = this.fb.group({
    id: this.fb.control<ObjId | null>(null),
    title: this.fb.control('', Validators.required),
    columnType: this.fb.control<ReportCardColumnTypeEnum>(
      DefaultNewColumnType,
      Validators.required,
    ),
    reportCardId: this.fb.control<number | null>(null),
  });

  protected readonly isSingleEntry = computed(
    () => this.calculationType() === ReportCardColumnTypeEnum.SINGLE_ENTRY,
  );
  protected readonly isCalculated = computed(
    () => this.calculationType() === ReportCardColumnTypeEnum.CALCULATED,
  );
  protected readonly isHorizentalCalculated = computed(
    () => this.calculationType() === ReportCardColumnTypeEnum.HORIZENTAL,
  );

  protected readonly formConfig = computed<IControl[]>(() => {
    const fileds: IControl[] = [
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
        label: this.translateService.t('grade_management.column_type.title'),
        formControlName: 'columnType',
        type: 'radio',
        readonly: this.isEdit(),
        selectValues: [
          {
            displayedValue: this.translateService.t(
              'grade_management.calculated.txt',
            ),
            value: ReportCardColumnTypeEnum.CALCULATED,
          },
          {
            displayedValue: this.translateService.t(
              'grade_management.horizontal_calculated.txt',
            ),
            value: ReportCardColumnTypeEnum.HORIZENTAL,
          },
          {
            displayedValue: this.translateService.t(
              'grade_management.single_entry.txt',
            ),
            value: ReportCardColumnTypeEnum.SINGLE_ENTRY,
          },
        ],
        required: true,
      },
    ];

    return fileds;
  });
  protected readonly subjectList = signal<ISelectValue[]>([]);
  // #endregion

  // #region Private Properties
  protected isEdit = toSignal(
    this.form.controls.id.valueChanges.pipe(map(Boolean)),
  );
  // #endregion

  // #region Private Methods
  // #endregion
  // #region Lifecycle Hooks
  ngOnInit(): void {
    if (this.column()) {
      this.calculationType.set(this.column()!.columnType);
    }
    this.reportCardConfigurationAPIService
      .fetchSubjects({
        schoolId: this.reportCard().schoolId,
        levelIds: this.reportCard().levels.map((level) => level.id),
        academicYearId: this.reportCard().academicYearId,
      })
      .subscribe({
        next: (resp) => {
          const isMoreThanOneLevel = this.reportCard().levels.length > 1;
          this.subjectList.set(
            resp.map((subject) => ({
              displayedValue: subject.displayName,
              value: subject.id,
              ...(isMoreThanOneLevel && {
                disabled: !this.reportCard().levels.every((level) =>
                  subject.levelIds.includes(level.id),
                ),
              }),
              ...(isMoreThanOneLevel && {
                extraData: {
                  subTitle: subject.levelDisplayNames,
                },
              }),
            })),
          );
        },
      });

    this.form.controls.columnType.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef$))
      .subscribe((value) => {
        if (value) this.calculationType.set(value);
      });
  }

  ngAfterViewInit() {
    const column = this.column();
    if (column) {
      this.form.patchValue({
        ...this.column(),
      });
      this.currentActiveColumnTypeRef()!.patchForm(
        this.buildColumnFormPayload(column),
      );
    }
  }
  // #endregion

  // #region Methods
  onCloseModal = (isChange = false) => {
    setTimeout(() => {
      this.controller.dismiss(isChange);
    }, 300);
  };
  // #endregion

  protected onSave() {
    const { id } = this.form.value;
    if (id) {
      this.showConfirmationModalForUpdate();
    } else {
      this.save();
    }
  }

  private buildColumnFormPayload(
    column: ReportCardColumnDetailDTO,
  ): ReportCardColumnFormPayload {
    const subjectIds: SubjectWithMaxMarks[] = (column.subjects ?? []).map(
      (subject) => ({
        id: subject.id,
        ...(subject.maxMarks != null && { maxMarks: subject.maxMarks }),
      }),
    );
    const basePayload = {
      reportCardId: this.reportCard().id!,
      title: column.title,
      columnType: column.columnType,
      subjectIds,
    };

    switch (column.columnType) {
      case ReportCardColumnTypeEnum.CALCULATED:
        return {
          ...basePayload,
          functionType: column.functionType as ReportCardCalculatedFunctionEnum,
          maxMarks: column.maxMarks ?? null,
          minEntries: column.minEntries ?? null,
          maxEntries: column.maxEntries ?? null,
        };
      case ReportCardColumnTypeEnum.HORIZENTAL:
        return {
          ...basePayload,
          functionType: column.functionType as ReportCardHorizontalFunctionEnum,
          sumAggregate: column.sumAggregate ?? null,
          selectedColumns:
            column.selectedColumns?.map(
              (selectedColumn) => selectedColumn.id,
            ) ?? [],
          scaleTo: column.scaleTo ?? null,
          isCalculatePercentage: false,
          isCalculateGpa: false,
        };
      case ReportCardColumnTypeEnum.SINGLE_ENTRY:
      default:
        return {
          ...basePayload,
          maxMarks: column.maxMarks ?? null,
        };
    }
  }
  // #region Private Methods

  private save() {
    if (this.isCalculated()) {
      this.onSaveCalculatedColumn();
    } else if (this.isHorizentalCalculated()) {
      this.onSaveHorizentalCalculatedColumn();
    } else if (this.isSingleEntry()) {
      this.onSaveSingleEntryColumn();
    }
  }
  private handleSaveColumn<T>(
    getPayload: () => T | undefined,
    createFn: (payload: T & ReturnType<typeof this.commonPayload>) => any,
    updateFn: (
      id: ObjId,
      payload: T & ReturnType<typeof this.commonPayload>,
    ) => any,
  ): void {
    const payloadData = getPayload();
    if (!payloadData) return;
    const { id } = this.form.value;
    const payload = { ...payloadData, ...this.commonPayload() };
    const obs$ = id ? updateFn(id, payload) : createFn(payload);
    obs$.subscribe({
      next: () => {
        this.onCloseModal(true);
        this.contextService.onRefatchReportCardDetail();
      },
      error: (error: HttpErrorResponse) => this.toaster.showBackendError(error),
    });
  }

  private onSaveSingleEntryColumn(): void {
    this.handleSaveColumn(
      () => this.singleEntryColumnRef()?.getRestPayload(),
      (payload) =>
        this.reportCardConfigurationAPIService.createSingleEntryColumn(payload),
      (id, payload) =>
        this.reportCardConfigurationAPIService.updateSingleEntryColumn(
          id,
          payload,
        ),
    );
  }

  private onSaveHorizentalCalculatedColumn(): void {
    this.handleSaveColumn(
      () => this.horizentalColumnRef()?.getRestPayload(),
      (payload) =>
        this.reportCardConfigurationAPIService.createHorizontalColumn(payload),
      (id, payload) =>
        this.reportCardConfigurationAPIService.updateHorizontalColumn(
          id,
          payload,
        ),
    );
  }

  private onSaveCalculatedColumn(): void {
    this.handleSaveColumn(
      () => this.calculatedColumnRef()?.getRestPayload(),
      (payload) =>
        this.reportCardConfigurationAPIService.createCalculatedColumn(payload),
      (id, payload) =>
        this.reportCardConfigurationAPIService.updateCalculatedColumn(
          id,
          payload,
        ),
    );
  }

  private commonPayload() {
    const { title, columnType, id } = this.form.value;
    return {
      title: title!,
      columnType: columnType!,
      ...(!id && { reportCardId: this.reportCard().id }),
    };
  }

  private currentActiveColumnTypeRef() {
    if (this.isCalculated()) return this.calculatedColumnRef();
    if (this.isHorizentalCalculated()) return this.horizentalColumnRef();
    return this.singleEntryColumnRef();
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
        this.save();
      },
    );
  }
  // #endregion
}
