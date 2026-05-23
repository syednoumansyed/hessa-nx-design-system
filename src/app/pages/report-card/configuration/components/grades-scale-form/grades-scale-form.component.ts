import {
  Component,
  Input,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import {
  FormControlGeneratorComponent,
  IControl,
} from '@shared/components/form-control-generator/form-control-generator.component';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { TranslocoDirective } from '@jsverse/transloco';
import { HessaBtnDirective } from '@ui-kit/hes-button/hes-button.directive';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { faClose } from '@fortawesome/pro-regular-svg-icons';
import { LetterGradesFormComponent } from '../letter-grades-form/letter-grades-form.component';
import { EducationalPathEnum } from '@shared/enums';
import { Idropdown } from '@shared/interfaces';
import { formatToHesDate } from '@shared/utils/date';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { CommonModule } from '@angular/common';
import { GradeScaleAPIService } from '@pages/report-card/configuration/data-access/grage-scale.api-service';
import {
  LetterGrade,
  LetterGradeScaleDTO,
  LetterGradeScalesPayload,
} from '@pages/report-card/configuration/data-access/grade-scales.model';
import { ObjId } from '@shared/interfaces/common.interface';
import { IonSpinner, ModalController } from '@ionic/angular/standalone';
import { isEqual } from 'lodash';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { createGradeFormGroup, validateGradeOrder } from './grades-scale-form';
import { AcademicYearApiService } from '@pages/academic-year/data-access/academic-year-api.service';

@Component({
  selector: 'app-grades-scale-form',
  templateUrl: './grades-scale-form.component.html',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormControlGeneratorComponent,
    TranslocoDirective,
    HessaBtnDirective,
    HesButtonModule,
    LetterGradesFormComponent,
    HesButtonModule,
    CommonModule,
    IonSpinner,
  ],
})
export class GradesScaleFormComponent implements OnInit {
  //#region Inputs and Outputs
  @Input()
  gradeScaleId: ObjId;

  @Input()
  isView = false;
  // #endregion
  //#region Injectables
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly hesTranslateService = inject(HesTranslateService);
  private readonly academicYearApiService = inject(AcademicYearApiService);
  private readonly academicYearScope = inject(AcademicYearsScopeService);
  private readonly gradeScaleAPIService = inject(GradeScaleAPIService);
  private readonly controller = inject(ModalController);
  private readonly toastr = inject(HesToasterService);
  private createGradeGroup = createGradeFormGroup();
  //#endregion

  //#region Protected Properties
  protected readonly faClose = faClose;
  protected isLoading = signal<boolean>(false);
  protected readonly form = this.fb.group({
    educationalPath: this.fb.control<EducationalPathEnum | null>(
      null,
      Validators.required,
    ),
    academicYearId: this.fb.control<ObjId | null>(null, Validators.required),
    grades: this.fb.array([this.createGradeGroup()], {
      validators: [validateGradeOrder()],
    }),
  });

  protected readonly formConfig = computed<IControl[]>(() => {
    return [
      {
        label: this.hesTranslateService.t(
          'school_structure.educational_path_req.label',
        ),
        type: 'searchable-select',
        placeholder: this.hesTranslateService.t(
          'global.select_educational_path.placholder',
        ),
        formControlName: 'educationalPath',
        selectValues: Object.values(EducationalPathEnum).map((value) => ({
          value: value,
          displayedValue: this.hesTranslateService.enumT(value),
        })),
        required: true,
        readonly: !!this.gradeScaleId,
        helperText: this.hesTranslateService.t(
          'grade_management.path_selection_note.txt',
        ),
      },
      {
        label: this.hesTranslateService.t('global.academic_year.title'),
        formControlName: 'academicYearId',
        type: 'searchable-select',
        placeholder: this.hesTranslateService.t(
          'global.select_academic_year.txt',
        ),
        selectValues: this.academicYearDropdown(),
        required: true,
        readonly: !!this.gradeScaleId,
      },
    ];
  });

  //#endregion

  //#region Private Properties
  private academicYearDropdown = signal<Idropdown[]>([]);
  private lastSavedState: LetterGradeScaleDTO['grades'] = [];
  //#endregion

  //#region Lifecycle Hooks
  ngOnInit() {
    this.getAcademicYears();
    if (this.gradeScaleId) {
      this.fetchGradeScale();
    }
  }
  //#endregion

  //#region Protected Methods

  protected addGrade() {
    const lastGrade = this.grades.length
      ? this.grades.at(this.grades.length - 1).value
      : null;

    this.grades.push(
      this.createGradeGroup({
        maxValue: lastGrade ? getMaxValue(lastGrade.minValue) : '100.00',
      }),
    );
  }

  protected onCloseModal(isChange = false) {
    this.controller.dismiss(isChange);
  }

  protected onSave() {
    let obs = this.onCreateGradeScale();
    if (this.gradeScaleId) {
      obs = this.onUpdateGradeScale();
    }
    this.isLoading.set(true);
    obs.subscribe({
      next: () => {
        this.toastr.success(
          this.hesTranslateService.t(
            this.gradeScaleId
              ? 'grade_management.grade_scale_updated_success.txt'
              : 'grade_management.grade_scale_success_alert.txt',
          ),
        );
        this.onCloseModal(true);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.toastr.showBackendError(err);
        this.isLoading.set(false);
      },
    });
  }

  protected get grades(): FormArray {
    return this.form.get('grades') as FormArray;
  }

  protected isMinValueZero(): boolean {
    const lastGrade = this.grades.length
      ? this.grades.at(this.grades.length - 1).value
      : null;
    return lastGrade?.minValue == 0;
  }
  //#endregion

  //#region Private Methods
  private getAcademicYears() {
    return this.academicYearApiService.getAllAcademicYears(false).subscribe({
      next: (data: any) => {
        const dropdownOptions = data.data.map((ay: any) => ({
          value: ay.id,
          displayedValue: `${ay.name} (${formatToHesDate(ay.startDate)} - ${formatToHesDate(ay.endDate)})`,
        }));
        this.academicYearDropdown.set(dropdownOptions);
        const defAcademicYear =
          this.academicYearScope.selectedAcademicYear()?.id;
        if (defAcademicYear) {
          this.form.get('academicYearId')?.setValue(defAcademicYear); //SA: Confirm this
        }
      },
    });
  }

  private onCreateGradeScale() {
    return this.gradeScaleAPIService.createGradeScales(this.getRestPayload());
  }

  private onUpdateGradeScale() {
    return this.gradeScaleAPIService.updateGradeScale(
      this.gradeScaleId,
      this.getUpdatePayload(),
    );
  }

  private mapRestGradeFromForm(grades: LetterGrade[]): LetterGrade[] {
    return grades.map((grade) => ({
      gradeLetter: grade.gradeLetter,
      numericGrade: grade.numericGrade,
      minValue: grade.minValue,
      maxValue: grade.maxValue,
    }));
  }

  private getRestPayload(): LetterGradeScalesPayload {
    const { educationalPath, academicYearId, grades = [] } = this.form.value;
    return {
      educationalPath: educationalPath!,
      academicYearId: academicYearId!,
      grades: this.mapRestGradeFromForm(grades) ?? [],
    };
  }

  private getUpdatePayload() {
    const { grades = [] } = this.form.value;
    const savedGrade = grades.filter((i) => i.id);
    const grade = savedGrade[savedGrade.length - 1];
    const newlyAddGrid = grades.filter((item) => !item.id);
    const lastSavedState = this.lastSavedState.find(
      (item) => item.id === grade?.id,
    );
    return {
      ...(!isEqual(grade, lastSavedState) && { grade }),
      ...(newlyAddGrid.length && {
        grades: this.mapRestGradeFromForm(newlyAddGrid),
      }),
    };
  }

  private fetchGradeScale() {
    this.isLoading.set(true);
    this.gradeScaleAPIService.getGradeScale(this.gradeScaleId).subscribe({
      next: ({ data: { grades, educationalPath, academicYear } }) => {
        this.isLoading.set(false);
        this.lastSavedState = grades ?? [];
        this.form.patchValue({
          educationalPath: educationalPath,
          academicYearId: academicYear.id,
        });
        this.grades.clear();
        if (grades?.length) {
          grades.forEach((grade) => {
            this.grades.push(
              this.createGradeGroup({
                id: grade.id,
                gradeLetter: grade.gradeLetter,
                numericGrade: grade.numericGrade,
                minValue: grade.minValue,
                maxValue: grade.maxValue,
              }),
            );
          });
        } else if (!this.isView) {
          this.grades.push(this.createGradeGroup());
        }
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }
  //#endregion
}

// #region internal
function getMaxValue(minValue: number): number {
  return parseFloat((minValue - 0.01).toFixed(2));
}
// #endregion
