import {
  Component,
  computed,
  input,
  signal,
  WritableSignal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ObjId } from '@shared/interfaces/common.interface';
import { DsPickerSelectOption } from '../picker-select.interface';
import { DsModalContentComponent } from '@ds/modal/modal-wrapper.component';
import { DsCheckboxComponent } from '@ds/checkbox/checkbox.component';
import { DsRadioComponent } from '@ds/radio-button/radio/radio.component';

@Component({
  selector: 'ds-picker-select-content',
  standalone: true,
  imports: [FormsModule, DsCheckboxComponent, DsRadioComponent],
  template: `
    <div class="flex flex-col gap-ds-md">
      @for (option of options(); track option.id) {
        <div
          class="flex cursor-pointer items-center justify-between rounded-ds-xl border-2 border-stroke-black-08 px-ds-xl py-ds-lg transition-colors"
          [class.border-brand-600]="isSelected(option.id)"
          [class.bg-surface-brand-subtle]="isSelected(option.id)"
          [class.border-stroke-low]="!isSelected(option.id)"
          [class.cursor-not-allowed]="option.disabled"
          (click)="toggleOption(option)"
        >
          <span
            class="heading-h5-mid-emphasis flex-1"
            [class.text-emphasis-low]="option.disabled"
            [class.text-emphasis-high]="!option.disabled"
          >
            {{ option.display }}
          </span>
          @if (isMultiple()) {
            <app-ds-checkbox
              class="pointer-events-none"
              [ngModel]="isSelected(option.id)"
              size="sm"
            />
          } @else {
            <app-ds-radio
              class="pointer-events-none"
              [ngModel]="isSelected(option.id)"
              size="sm"
            />
          }
        </div>
      } @empty {
        <div class="py-ds-xl text-center text-content-mid">
          No options found
        </div>
      }
    </div>
  `,
})
export class DsPickerSelectContentComponent implements DsModalContentComponent {
  // Inputs
  readonly options = input.required<DsPickerSelectOption[]>();
  readonly initialSelection = input<ObjId[]>([]);
  readonly isMultiple = input<boolean>(true);

  // Modal content interface
  closeModal?: (data?: unknown, role?: string) => void;
  primaryButtonDisabled: WritableSignal<boolean> = signal(true);

  // Internal state
  private readonly _selectedIds = signal<Set<ObjId>>(new Set());

  // Computed: selected IDs as array
  readonly selectedIds = computed(() => Array.from(this._selectedIds()));

  ngOnInit(): void {
    // Initialize with provided selection
    const initial = this.initialSelection();
    if (initial.length > 0) {
      this._selectedIds.set(new Set(initial));
      this.updateButtonState();
    }
  }

  isSelected(id: ObjId): boolean {
    return this._selectedIds().has(id);
  }

  toggleOption(option: DsPickerSelectOption): void {
    if (option.disabled) return;

    const currentSet = new Set(this._selectedIds());

    if (this.isMultiple()) {
      // Multi-select: toggle the option
      if (currentSet.has(option.id)) {
        currentSet.delete(option.id);
      } else {
        currentSet.add(option.id);
      }
    } else {
      // Single-select: replace selection
      currentSet.clear();
      currentSet.add(option.id);
    }

    this._selectedIds.set(currentSet);
    this.updateButtonState();
  }

  private updateButtonState(): void {
    // Disable button if no selection (for required scenarios, validation happens at form level)
    this.primaryButtonDisabled.set(this._selectedIds().size === 0);
  }

  onPrimaryClick(): void {
    // Return the selected IDs to the parent
    this.closeModal?.(this.selectedIds(), 'confirm');
  }

  onSecondaryClick(): void {
    this.closeModal?.(undefined, 'cancel');
  }
}
