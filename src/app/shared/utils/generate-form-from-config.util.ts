import { FormBuilder, Validators } from '@angular/forms';
import { IControl } from '@shared/components/form-control-generator/form-control-generator.component';
import { IAttachmentControlValue } from '@ui-kit/hes-attachment-form-control/attachment-control-value.interface';
import { SchoolStructureEntityType } from '@ui-kit/hes-school-structure-control/school-structure-control-item.interface';

export function createFormFromReportConfig(
  reportConfig: IControl[],
  fb: FormBuilder,
) {
  const filterForm = fb.group({});
  reportConfig.forEach((control) => {
    const validators = control.required ? Validators.required : [];
    switch (control.type) {
      case 'date':
      case 'date-time':
        filterForm.addControl(
          control.formControlName!,
          fb.control<Date | null>(null, validators),
        );
        break;
      case 'date-range':
        filterForm.addControl(
          control.formControlName!,
          fb.control<{ from: Date; to: Date } | null>(null, validators),
        );
        break;
      case 'searchable-select':
        if (control.isMultiple) {
          filterForm.addControl(
            control.formControlName!,
            fb.control<any[] | null>([], validators),
          );
        } else
          filterForm.addControl(
            control.formControlName!,
            fb.control<string | number | null>(null, validators),
          );
        break;
      case 'file':
        if (control.isMultiple) {
          filterForm.addControl(
            control.formControlName!,
            fb.control<IAttachmentControlValue[] | null>([], validators),
          );
        } else
          filterForm.addControl(
            control.formControlName!,
            fb.control<IAttachmentControlValue | null>(null, validators),
          );
        break;
      case 'school-structure':
        if (control.isMultiple) {
          filterForm.addControl(
            control.formControlName!,
            fb.control<
              | {
                  id: number;
                  type: SchoolStructureEntityType;
                  name: string;
                }[]
              | null
            >([], validators),
          );
        } else
          filterForm.addControl(
            control.formControlName!,
            fb.control<{
              id: number;
              type: SchoolStructureEntityType;
              name: string;
            } | null>(null, validators),
          );

        break;
      default:
        filterForm.addControl(
          control.formControlName!,
          fb.control<string | number | null>(null, validators),
        );
        break;
    }
  });
  return filterForm;
}
