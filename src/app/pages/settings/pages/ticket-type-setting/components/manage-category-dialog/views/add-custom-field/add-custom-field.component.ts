import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';
import {
  DsFormRendererComponent,
  FormControlConfig,
} from '@shared/components/ds-form-control-generator/ds-form-renderer/ds-form-renderer.component';
import { DsInputComponent } from '@ds/input/input.component';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { Language } from '@shared/enums';

@Component({
  selector: 'app-add-custom-field',
  templateUrl: './add-custom-field.component.html',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslocoDirective,
    DsFormRendererComponent,
    DsInputComponent,
  ],
})
export class AddCustomFieldComponent {
  @Input({ required: true }) form!: FormGroup;

  private readonly t = inject(HesTranslateService);

  protected get formConfig(): FormControlConfig[] {
    return [
      {
        type: 'input',
        formControlName: 'enLabel',
        label: this.t.t('support.custom_field.label.en'),
        required: true,
        maxLength: 30,
        showCharacterCount: true,
      },
      {
        type: 'input',
        formControlName: 'arLabel',
        label: this.t.t('support.custom_field.label.ar'),
        required: true,
        maxLength: 30,
        showCharacterCount: true,
      },
      {
        type: 'input',
        formControlName: 'enDescription',
        label: this.t.t('support.custom_field.description.en'),
        localizedPair: 'arDescription',
        maxLength: 60,
        showCharacterCount: true,
      },
      {
        type: 'input',
        formControlName: 'arDescription',
        label: this.t.t('support.custom_field.description.ar'),
        localizedPair: 'enDescription',
        maxLength: 60,
        showCharacterCount: true,
      },
      {
        type: 'checkbox',
        formControlName: 'isRequired',
        size: 'sm',
        helperText: this.t.t('support.custom_field.required.helper'),
        selectValues: [
          {
            value: 'isRequired',
            displayedValue: this.t.t('support.custom_field.required'),
          },
        ],
      },
    ];
  }

  // Get current language for preview
  protected get isArabic(): boolean {
    return this.t.getActiveLang() === Language.ARABIC;
  }
}
