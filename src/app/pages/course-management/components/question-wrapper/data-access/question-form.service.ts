import { Injectable, inject } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { QuestionTypeEnum } from './question-enum';
import { IAttachmentControlValue } from '@ui-kit/hes-attachment-form-control/attachment-control-value.interface';

export type QuestionOption = FormGroup<{
  text: FormControl<string>;
  isCorrect: FormControl<boolean>;
}>;
@Injectable()
export class QuestionFormService {
  private fb = inject(NonNullableFormBuilder);

  readonly form = this.getForm();

  resetToNew() {
    this.form.controls.questionOptions.clear();
    this.form.controls.text.reset();
    this.form.controls.modelAnswer.reset();
    this.form.controls.isAttachmentAllowed.reset();
  }

  private getForm() {
    const typeControl = this.fb.control<QuestionTypeEnum | 'new'>('new', [
      Validators.required,
    ]);

    return this.fb.group({
      id: this.fb.control<number | null>(null),
      type: typeControl,
      text: this.fb.control<string>('', [
        Validators.required,
        conditionalMaxLengthValidator(typeControl),
      ]),
      modelAnswer: this.fb.control<string>(''),
      isAttachmentAllowed: this.fb.control<string | null>(null),
      questionOptions: this.getQuestionOptionFrom(),
      attachments: this.fb.control<Array<IAttachmentControlValue>>([]),
    });
  }

  private getQuestionOptionFrom() {
    return this.fb.array<QuestionOption>(
      [],
      [
        this.conditionalCorrectOptionValidator(),
        this.conditionalMinOptionsValidator(),
      ],
    );
  }

  conditionalCorrectOptionValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const formArray = control as FormArray; // Assert control as FormArray
      const parent = formArray.parent as FormGroup;
      if (!parent) return null;

      const type = parent.get('type')?.value;
      if (
        type === QuestionTypeEnum.mcq ||
        type === QuestionTypeEnum.trueFalse
      ) {
        const anyCorrect = formArray.controls.some(
          (control) => control.get('isCorrect')?.value === true,
        );
        return anyCorrect ? null : { noCorrectOption: true };
      }
      return null;
    };
  }

  markAsCorrect(idx: number) {
    this.form.controls.questionOptions.controls.forEach((optionCtrl, index) => {
      const isCorrectCtrl = optionCtrl.controls.isCorrect;
      if (idx !== index) {
        isCorrectCtrl.setValue(false);
        return;
      }
      if (idx === idx) isCorrectCtrl.setValue(true);
    });
  }
  conditionalMinOptionsValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const formArray = control as FormArray;
      const parent = formArray.parent as FormGroup;
      if (!parent) return null;

      const type = parent.get('type')?.value;
      if (
        type === QuestionTypeEnum.mcq ||
        type === QuestionTypeEnum.trueFalse
      ) {
        return formArray.length >= 2 ? null : { minOptions: true };
      }
      return null;
    };
  }
}

export function conditionalMaxLengthValidator(
  typeControl: AbstractControl,
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const type = typeControl.value;
    const value = control.value;
    let maxLength = 500; // default max length

    if (type === QuestionTypeEnum.essay) {
      maxLength = 4000;
    } else if (
      type === QuestionTypeEnum.mcq ||
      type === QuestionTypeEnum.trueFalse
    ) {
      maxLength = 1500;
    }

    return value && value.length > maxLength
      ? { maxlength: { requiredLength: maxLength, actualLength: value.length } }
      : null;
  };
}
