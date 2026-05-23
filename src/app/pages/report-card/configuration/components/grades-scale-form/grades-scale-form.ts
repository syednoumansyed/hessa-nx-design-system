import { inject } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { GradesScaleFormComponent } from './grades-scale-form.component';
import { ObjId } from '@shared/interfaces/common.interface';
import {
  AbstractControl,
  FormArray,
  FormGroup,
  NonNullableFormBuilder,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';

export function createFormGradesScaleModal() {
  const modalCtrl = inject(ModalController);
  return async function (args?: { gradeScaleId: ObjId; isView?: boolean }) {
    const { gradeScaleId, isView = false } = args || {};
    const modal = await modalCtrl.create({
      component: GradesScaleFormComponent,
      componentProps: {
        gradeScaleId,
        isView,
      },
      cssClass: 'xl-modal overflow-y-auto',
    });
    modal.present();
    return await modal.onDidDismiss().then(({ data }) => {
      return data;
    });
  };
}

export function createGradeFormGroup() {
  const fb = inject(NonNullableFormBuilder);

  return function (args?: {
    maxValue?: string | number;
    minValue?: string;
    numericGrade?: string;
    gradeLetter?: string;
    id?: ObjId;
  }): FormGroup {
    const {
      maxValue = '100.00',
      minValue = '',
      numericGrade = '',
      gradeLetter = '',
      id = '',
    } = args ?? {};
    return fb.group({
      id: [id],
      gradeLetter: [
        gradeLetter,
        [Validators.required, Validators.maxLength(30)],
      ],
      numericGrade: [
        numericGrade,
        [Validators.required, Validators.pattern(numericGradePattern)],
      ],
      minValue: [
        minValue,
        [
          Validators.required,
          Validators.pattern(minMaxGradePattern),
          minValueLessThanMaxValueValidator(),
        ],
      ],
      maxValue: [
        maxValue,
        [Validators.required, Validators.pattern(minMaxGradePattern)],
      ],
    });
  };
}

function minValueLessThanMaxValueValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control || !control.parent) {
      return null;
    }

    const min = parseFloat(control.value);
    const max = parseFloat(control.parent.get('maxValue')?.value);

    if (!isNaN(min) && !isNaN(max) && min >= max) {
      return { minInvalid: true };
    }

    return null;
  };
}
const minMaxGradePattern = /^(100(\.00?)?|[0-9]{1,2}(\.\d{1,2})?)$/;
// const numaricGradePattern = /^(10(\.0)?|[0-9](\.\d)?)$/;
const numericGradePattern = /^(10(\.0{0,2})?|([0-9](\.\d{0,2})?))$/;

export function validateGradeOrder(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!(control instanceof FormArray)) return null;

    const controls = control.controls;
    let hasError = false;

    for (let i = 1; i < controls.length; i++) {
      const currentGrade = parseFloat(controls[i].get('numericGrade')?.value);
      const previousGrade = parseFloat(
        controls[i - 1].get('numericGrade')?.value,
      );

      const currentControl = controls[i].get('numericGrade');

      currentControl?.setErrors(null);

      if (!isNaN(currentGrade) && !isNaN(previousGrade)) {
        if (currentGrade === previousGrade) {
          currentControl?.setErrors({ duplicateGrade: true });
          hasError = true;
        } else if (currentGrade >= previousGrade) {
          currentControl?.setErrors({ invalidGradeOrder: true });
          hasError = true;
        }
      }
    }

    return hasError ? { gradeOrderInvalid: true } : null;
  };
}
