import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';
import { DsTimePickerControlComponent } from '@ds/time-picker';
import { DsFormControlGeneratorComponent } from '@shared/components/ds-form-control-generator/ds-form-control-generator.component';
import { DsFormControl } from '@shared/components/ds-form-control-generator/ds-form-control-generator.model';
import { DsAttachmentFormControlComponent } from '@ds/attachment/ds-attachment-form-control.component';
import { OptionCreatorDemoComponent } from '../../option-creator-demo/option-creator-demo.component';
import { DemoPageWrapperComponent } from '../../components/demo-page-wrapper.component';

@Component({
  selector: 'app-data-entry-demo',
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    ReactiveFormsModule,
    DsTimePickerControlComponent,
    DsFormControlGeneratorComponent,
    DsAttachmentFormControlComponent,
    OptionCreatorDemoComponent,
    DemoPageWrapperComponent,
  ],
  templateUrl: './data-entry-demo.page.html',
})
export class DataEntryDemoPage {
  attachmentControl = new FormControl();

  timeForm = new FormGroup({
    time: new FormControl<string | null>(null),
    endTime: new FormControl<string | null>({
      value: '04:30 AM',
      disabled: false,
    }),
    disabledField: new FormControl<string | null>({
      value: '12:30 PM',
      disabled: true,
    }),
  });

  datePickerForm = new FormGroup({
    selectedDate: new FormControl<any>(null),
    dateRange: new FormControl<any>(null),
  });

  datePickerControl: DsFormControl = {
    type: 'date',
    formControlName: 'selectedDate',
    label: 'Select Date',
    placeholder: 'Choose a date',
    required: false,
  };

  dateRangePickerControl: DsFormControl = {
    type: 'date-range',
    formControlName: 'dateRange',
    label: 'Select Date Range',
    placeholder: 'Choose date range',
    required: false,
  };
}
