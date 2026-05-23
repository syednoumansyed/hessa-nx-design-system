import { WritableSignal } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import {
  FullNameValidators,
  OptionalFullNameValidators,
} from './full-name.validator';

/**
 * Sets up mutual full-name validators such that:
 *  - If both empty: both required
 *  - If only one filled: that one required, the other optional
 *  - If both filled: both optional (no required, keep pattern & length)
 * Returns signals reflecting current required status for each control.
 */
export function setupMutualFullNameValidators(
  enCtrl: AbstractControl,
  arCtrl: AbstractControl,
  enRequired: WritableSignal<boolean>,
  arRequired: WritableSignal<boolean>,
): { destroy: () => void } {
  const updateValidators = () => {
    const enVal = (enCtrl.value ?? '').toString().trim();
    const arVal = (arCtrl.value ?? '').toString().trim();
    if (!enVal && !arVal) {
      enCtrl.setValidators(FullNameValidators);
      arCtrl.setValidators(FullNameValidators);
      enRequired.set(true);
      arRequired.set(true);
    } else if (enVal && !arVal) {
      enCtrl.setValidators(FullNameValidators);
      arCtrl.setValidators(OptionalFullNameValidators);
      enRequired.set(true);
      arRequired.set(false);
    } else if (!enVal && arVal) {
      enCtrl.setValidators(OptionalFullNameValidators);
      arCtrl.setValidators(FullNameValidators);
      enRequired.set(false);
      arRequired.set(true);
    } else {
      enCtrl.setValidators(OptionalFullNameValidators);
      arCtrl.setValidators(OptionalFullNameValidators);
      enRequired.set(false);
      arRequired.set(false);
    }
    enCtrl.updateValueAndValidity({ emitEvent: false });
    arCtrl.updateValueAndValidity({ emitEvent: false });
  };

  updateValidators();
  const enSub = enCtrl.valueChanges.subscribe(updateValidators);
  const arSub = arCtrl.valueChanges.subscribe(updateValidators);

  const destroy = () => {
    enSub.unsubscribe();
    arSub.unsubscribe();
  };

  return { destroy };
}
