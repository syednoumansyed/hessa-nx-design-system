import {
  AbstractControl,
  ValidationErrors,
  Validators,
  FormGroup,
} from '@angular/forms';
// Regex to validate a full name with at least two words, allowing Latin and Arabic characters.
const fullNameRegex =
  /^(?! )[a-zA-Z\u0600-\u06FF]+(?: [a-zA-Z\u0600-\u06FF]+)+\s*$/;

export const FullNameValidators = [
  Validators.required,
  Validators.maxLength(150),
  Validators.pattern(fullNameRegex),
];

// Optional variant (no required) for cases where field is conditionally optional.
export const OptionalFullNameValidators = [
  Validators.maxLength(150),
  Validators.pattern(fullNameRegex),
];

// Utility validator that enforces at least one of two controls has a value.
// Attach this validator at the form group level to ensure at least one of the specified controls has a value.
export function atLeastOneFilledValidator(controlNames: string[]) {
  return (group: AbstractControl): ValidationErrors | null => {
    if (!(group instanceof FormGroup)) return null;
    const hasValue = controlNames.some((name) => {
      const ctrl = group.get(name);
      const value = ctrl?.value;
      return (
        value !== null && value !== undefined && value.toString().trim() !== ''
      );
    });
    return hasValue ? null : { atLeastOneRequired: true };
  };
}
