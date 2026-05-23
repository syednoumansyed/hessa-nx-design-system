import { Component } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';
import { faCheck } from '@fortawesome/pro-light-svg-icons';
import { DsButtonComponent } from 'src/app/design-system/button/button.component';
import { DsSwitchComponent } from '@ds/switch/switch.component';
import { DsChipComponent } from '@ds/chip/chip.component';
import { DsCheckboxComponent } from 'src/app/design-system/checkbox/checkbox.component';
import { DsCheckboxGroupComponent } from 'src/app/design-system/checkbox-group/checkbox-group.component';
import { DsRadioGroupComponent } from 'src/app/design-system/radio-button/radio-group/radio-group.component';
import { DsRadioComponent } from 'src/app/design-system/radio-button/radio/radio.component';
import { SelectTestingComponent } from '../../select-testing/select-testing.component';
import { SelectableDemoComponent } from '../../selectable-demo.component';
import { DemoPageWrapperComponent } from '../../components/demo-page-wrapper.component';

@Component({
  selector: 'app-selection-demo',
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    ReactiveFormsModule,
    DsButtonComponent,
    DsSwitchComponent,
    DsChipComponent,
    DsCheckboxComponent,
    DsCheckboxGroupComponent,
    DsRadioGroupComponent,
    DsRadioComponent,
    SelectTestingComponent,
    SelectableDemoComponent,
    DemoPageWrapperComponent,
  ],
  templateUrl: './selection-demo.page.html',
})
export class SelectionDemoPage {
  protected readonly checkIcon = faCheck;

  form = new FormGroup({
    radioCtrl: new FormControl('upi', { nonNullable: true }),
  });

  checkboxForm: FormGroup;
  checkboxGroupForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.checkboxForm = this.fb.group({
      agree: [{ value: true, disabled: false, required: true }],
      disagree: [{ value: true, disabled: true }],
    });

    this.checkboxGroupForm = this.fb.group({
      selectedOptions: [[], this.atLeastOneRequired()],
      selectedOptions2: [[], this.atLeastOneRequired()],
    });
  }

  atLeastOneRequired(): ValidatorFn {
    return (control: AbstractControl) => {
      const value = control.value;
      return Array.isArray(value) && value.length > 0
        ? null
        : { required: true };
    };
  }

  onSubmit(): void {
    console.log('Form value:', this.checkboxForm.getRawValue());
  }

  onGroupSubmit(): void {
    console.log('Group Form value:', this.checkboxGroupForm.getRawValue());
  }
}
