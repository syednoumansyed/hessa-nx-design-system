import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import {
  FormControlGeneratorComponent,
  IControl,
} from '@shared/components/form-control-generator/form-control-generator.component';
import { HesIconComponent } from '@shared/components/hes-icon/hes-icon.component';
import { isMobile } from '@shared/utils/platform';
import { IonSpinner } from '@ionic/angular/standalone';
import { ObjId } from '@shared/interfaces/common.interface';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { GradeScaleAPIService } from '@pages/report-card/configuration/data-access/grage-scale.api-service';
import { HesToasterService } from '@shared/services/hes-toaster.service';

@Component({
  selector: 'app-letter-grade-item-form',
  templateUrl: './letter-grade-item-form.component.html',
  standalone: true,
  imports: [
    CommonModule,
    FormControlGeneratorComponent,
    HesIconComponent,
    IonSpinner,
  ],
})
export class LetterGradeItemFormComponent implements OnInit {
  // #region Inputs and Outputs
  form = input<FormGroup>();
  isLastItem = input<boolean>();
  isFirst = input<boolean>();
  removed = output();
  totalItemLength = input.required<number>();
  isView = input.required<boolean>();
  // #endregion

  // #region Injectors
  private readonly gradeScaleAPIService = inject(GradeScaleAPIService);
  private readonly translationService = inject(HesTranslateService);
  private readonly toasterService = inject(HesToasterService);
  // #endregion
  // #region Protected Properties
  protected readonly isShowDelete = computed<boolean>(() => {
    if (this.isView()) {
      return false;
    }
    return (
      (this.totalItemLength() === 1 && !!this.gradeId()) ||
      (!!this.isLastItem() && !this.isFirst())
    );
  });
  protected isMobile = isMobile();
  protected readonly isRemoving = signal<boolean>(false);
  protected readonly minuIcon = {
    src: 'assets/icons/minus.svg',
  };
  inputCssClass = computed(() => {
    return this.isMobile ? '' : 'text-center';
  });

  protected readonly formConfig = computed<IControl[]>(() => {
    return [
      {
        label: '',
        placeholder: this.translationService.t(
          'grade_management.grade_letter.title',
        ),
        type: 'input',
        formControlName: 'gradeLetter',
        required: true,
        readonly: !this.isLastItem() || this.isView(),
        inputCssClass: this.inputCssClass(),
      },
      {
        label: '',
        placeholder: this.translationService.t(
          'grade_management.numeric_grade.title',
        ),
        type: 'input',
        formControlName: 'numericGrade',
        required: true,
        readonly: !this.isLastItem() || this.isView(),
        inputCssClass: this.inputCssClass(),
        decimalPrecision: 1,
      },
      {
        label: '',
        placeholder: this.translationService.t(
          'grade_management.minimum_value.title',
        ),
        type: 'input',
        formControlName: 'minValue',
        required: true,
        readonly: !this.isLastItem() || this.isView(),
        inputCssClass: this.inputCssClass(),
        decimalPrecision: 2,
      },
      {
        label: '',
        placeholder: this.translationService.t(
          'grade_management.maximum_value.title',
        ),
        type: 'input',
        formControlName: 'maxValue',
        required: true,
        readonly: true,
        inputCssClass: this.inputCssClass(),
        decimalPrecision: 2,
      },
    ];
  });

  // #endregion

  // #region Private Properties
  private gradeId = computed<ObjId>(() => {
    return this.form()?.value.id;
  });
  // #endregion
  constructor() {}

  ngOnInit() {}

  // #region Protected Methods
  onRemoved() {
    const id = this.gradeId();
    if (id) {
      this.isRemoving.set(true);
      this.gradeScaleAPIService.deleteGrade(id).subscribe({
        next: () => {
          this.removed.emit();
        },
        complete: () => {
          this.isRemoving.set(false);
        },
        error: (error) => {
          this.isRemoving.set(false);
          this.toasterService.showBackendError(error);
        },
      });
    } else {
      this.removed.emit();
    }
  }
  // #endregion
}
