import {
  SelectableOptionGroupConfig,
  SelectableOptionGroupMode,
  SelectableOptionVisualState,
} from './selectable-option.types';
import { Component, input, computed, output } from '@angular/core';
import { NgClass } from '@angular/common';
import { DsIconComponent } from '@ds/icon/icon.component';
import { faCircleExclamation } from '@fortawesome/pro-regular-svg-icons';
import { faCircleCheck as faCircleCheckSolid } from '@fortawesome/pro-solid-svg-icons';
import { faCircleCheck } from '@fortawesome/pro-regular-svg-icons';

@Component({
  selector: 'ds-selectable-option',
  standalone: true,
  imports: [NgClass, DsIconComponent],
  templateUrl: './selectable-option.component.html',
})
export class SelectableOptionComponent {
  value = input<string | number>(''); // unique id for option
  display = input<string>(''); // display text for option

  // Inputs for group context
  mode = input<SelectableOptionGroupMode>('attempt');
  selectedValue = input<string | number | undefined>(undefined); // student's selected value
  correctOptionValue = input<
    SelectableOptionGroupConfig['correctOptionValue'] | null
  >(null);
  revealAnswer = input<boolean>(false);

  selected = output<void>();

  optionState = computed(() => {
    // Attempt mode
    if (this.mode() === 'attempt') {
      if (this.value() === this.selectedValue()) {
        return SelectableOptionVisualState.Active;
      }
      return SelectableOptionVisualState.Default;
    }
    // View mode with revealAnswer true
    if (this.mode() === 'view' && this.revealAnswer()) {
      if (
        this.value() === this.correctOptionValue() &&
        this.value() === this.selectedValue()
      ) {
        return SelectableOptionVisualState.SelectCorrect;
      } else if (this.value() === this.correctOptionValue()) {
        return SelectableOptionVisualState.UnselectedCorrect;
      } else if (this.value() === this.selectedValue()) {
        return SelectableOptionVisualState.SelectIncorrect;
      } else {
        return SelectableOptionVisualState.Disabled;
      }
    }
    // View mode without revealAnswer
    if (this.mode() === 'view' && !this.revealAnswer()) {
      if (this.value() === this.selectedValue()) {
        return SelectableOptionVisualState.Active;
      }
      return SelectableOptionVisualState.Disabled;
    }
    // Default fallback
    return SelectableOptionVisualState.Default;
  });

  stateClasses = computed(() => this.STATE_CLASS_MAP[this.optionState()]);

  isDisabled = computed(() => {
    return this.optionState() === SelectableOptionVisualState.Disabled;
  });

  isUnselectedCorrect = computed(() => {
    return this.optionState() === SelectableOptionVisualState.UnselectedCorrect;
  });

  iconConfig = computed(() => {
    switch (this.optionState()) {
      case SelectableOptionVisualState.SelectCorrect:
        return {
          icon: faCircleCheck,
          class: 'text-icon-success',
        };
      case SelectableOptionVisualState.UnselectedCorrect:
        return {
          icon: faCircleCheckSolid,
          class: 'text-icon-success',
        };
      case SelectableOptionVisualState.SelectIncorrect:
        return {
          icon: faCircleExclamation,
          class: 'text-icon-error',
        };
      case SelectableOptionVisualState.Active:
        return {
          icon: faCircleCheck,
          class: 'text-icon-high',
        };
      default:
        return null;
    }
  });

  onClick() {
    if (this.mode() === 'attempt' && this.value() !== this.selectedValue()) {
      this.selected.emit();
    }
  }

  handleClick() {
    if (!this.isDisabled()) {
      this.onClick();
    }
  }
  STATE_CLASS_MAP: Record<SelectableOptionVisualState, string> = {
    [SelectableOptionVisualState.Active]:
      'border-stroke-dark bg-surface-primary',
    [SelectableOptionVisualState.Default]:
      'bg-surface-primary hover:bg-surface-contrast-over-color-lv0 border-stroke-cool-black-08 hover:border-stroke-cool-black-04 ',
    [SelectableOptionVisualState.SelectCorrect]:
      'border-feedback-stroke-positive bg-surface-success-subtle',
    [SelectableOptionVisualState.UnselectedCorrect]:
      'border-stroke-cool-black-08 bg-surface-primary',
    [SelectableOptionVisualState.SelectIncorrect]:
      'border-feedback-stroke-danger bg-surface-danger-subtle',
    [SelectableOptionVisualState.Disabled]:
      'border-stroke-cool-black-04 bg-surface-contrast-over-color-lv0 text-emphasis-low',
  };
}
