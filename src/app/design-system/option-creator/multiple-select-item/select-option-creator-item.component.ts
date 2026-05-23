import { Component, computed, input, OnInit, output } from '@angular/core';
import { DsCheckboxComponent } from '@ds/checkbox/checkbox.component';
import { DsInputComponent } from '@ds/input/input.component';
import { DsIconComponent } from '@ds/icon/icon.component';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { faCircleXmark } from '@fortawesome/pro-solid-svg-icons';
import { DsRadioComponent } from '@ds/radio-button/radio/radio.component';
import { NgClass } from '@angular/common';

export enum TrueFalseOption {
  TRUE = 'TRUE',
  FALSE = 'FALSE',
}
@Component({
  selector: 'ds-select-option-creator-item',
  templateUrl: './select-option-creator-item.component.html',
  imports: [
    DsCheckboxComponent,
    DsInputComponent,
    DsIconComponent,
    ReactiveFormsModule,
    DsRadioComponent,
    NgClass,
  ],
})
export class DsSelectOptionCreatorItemComponent implements OnInit {
  formGroup = input<FormGroup>();
  remove = output<void>();
  isMultSelect = input<boolean>(false);
  singleSelected = output<void>();
  isTrueOrFalse = input<boolean>(false);
  removeEnabled = computed(() => !this.isTrueOrFalse());
  form: FormGroup;

  falseValue = TrueFalseOption.FALSE;
  readonly removeIcon = faCircleXmark;

  constructor() {}

  ngOnInit() {
    this.form = this.formGroup()!;
  }

  get isSelected() {
    return this.form.get('isCorrect')?.value;
  }
  onRemove() {
    this.remove.emit();
  }

  onSelectRadio() {
    this.singleSelected.emit();
  }
}
