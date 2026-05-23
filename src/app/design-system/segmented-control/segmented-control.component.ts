import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';

export interface DsSegmentedControlOption<T = string> {
  id: T;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'ds-segmented-control',
  standalone: true,
  templateUrl: './segmented-control.component.html',
  imports: [CommonModule],
})
export class DsSegmentedControlComponent<T = string> {
  options = input<DsSegmentedControlOption<T>[]>([]);
  value = input<T | undefined>(undefined);
  valueChange = output<T>();

  protected isActive(optionId: T): boolean {
    return this.value() === optionId;
  }

  protected onSelect(option: DsSegmentedControlOption<T>): void {
    if (option.disabled) {
      return;
    }

    if (this.value() === option.id) {
      return;
    }

    this.valueChange.emit(option.id);
  }
}
