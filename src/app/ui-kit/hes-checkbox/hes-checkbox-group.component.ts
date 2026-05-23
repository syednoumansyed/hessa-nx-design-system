import {
  Component,
  forwardRef,
  ContentChildren,
  QueryList,
  AfterContentInit,
  Input,
  inject,
  DestroyRef,
} from '@angular/core';
import { IonCheckbox } from '@ionic/angular/standalone';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * Represents a checkbox group component that implements ControlValueAccessor and AfterContentInit interfaces.
 * This component allows multiple checkboxes to be grouped together and managed as a single value.
 *
 * @example
 * // In your template:
 * <app-hes-checkbox-group [(ngModel)]="selectedValues" [readonly]="true">
 *    <ion-checkbox value="option1">Option 1</ion-checkbox>
 *    <ion-checkbox value="option2">Option 2</ion-checkbox>
 *    <ion-checkbox value="option3">Option 3</ion-checkbox>
 * </app-hes-checkbox-group>
 *
 * // In your component:
 * selectedValues: string[] = [];
 */

@Component({
  selector: 'app-hes-checkbox-group',
  template: `<ng-content></ng-content>`,
  standalone: true,
  imports: [],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => HesCheckboxGroupComponent),
      multi: true,
    },
  ],
})
export class HesCheckboxGroupComponent
  implements ControlValueAccessor, AfterContentInit
{
  @ContentChildren(IonCheckbox, { read: IonCheckbox, descendants: true })
  checkboxes: QueryList<IonCheckbox>;

  // Add an input property for readonly. When true, the checkboxes will be disabled and won't update the value.
  @Input() readonly: boolean = false;

  // Track the disabled state from the form control
  disabled: boolean = false;

  // Store individual checkbox disabled states
  private individualDisabledStates = new Map<any, boolean>();

  value: any[] = [];

  private readonly destroyRef = inject(DestroyRef);

  writeValue(value: any[] | null): void {
    if (value && value.length) {
      this.value = [...value];
      this.checkboxes?.forEach((checkbox) => {
        checkbox.checked = this.value.includes(checkbox.value);
      });
    } else {
      this.value = [];
      this.checkboxes?.forEach((checkbox) => {
        checkbox.checked = false;
      });
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (this.checkboxes) {
      this.checkboxes.forEach((checkbox) => {
        // Get the stored individual disabled state or current state
        const individualDisabled =
          this.individualDisabledStates.get(checkbox.value) ||
          checkbox.disabled;
        // Disable if either the form control is disabled, readonly is true, or individually disabled
        checkbox.disabled = isDisabled || this.readonly || individualDisabled;
      });
    }
  }

  onChange: any = () => {};
  onTouched: any = () => {};

  get selectAllCheckbox() {
    return this.checkboxes.find((checkbox) => checkbox.value === 'SELECT_ALL');
  }

  get individualCheckboxes() {
    return this.checkboxes.filter(
      (checkbox) => checkbox.value !== 'SELECT_ALL',
    );
  }
  ngAfterContentInit() {
    // Store individual disabled states on init
    this.checkboxes?.forEach((checkbox) => {
      if (checkbox.disabled) {
        this.individualDisabledStates.set(checkbox.value, true);
      }
    });

    this.subscribeToCheckboxChanges();
    this.subscribeToCheckboxListChange();
    this.subscribeToSelectAllChanges();
  }

  updateValue(event: CustomEvent, value: any) {
    // Do not update value if readonly is true
    if (this.readonly) {
      return;
    }

    if (event.detail.checked) {
      if (!this.value.includes(value)) {
        this.value.push(value);
      }
    } else {
      this.value = this.value.filter((v) => v !== value);
    }
    this.onChange([...this.value]);
    this.onTouched();
  }

  private updateSelectAllState() {
    if (!this.selectAllCheckbox) {
      return;
    }
    if (this.value.length === this.individualCheckboxes.length) {
      this.selectAllCheckbox.checked = true;
      this.selectAllCheckbox.indeterminate = false;
    } else if (this.value.length) {
      this.selectAllCheckbox.indeterminate = true;
      this.selectAllCheckbox.checked = false;
    } else {
      this.selectAllCheckbox.checked = false;
      this.selectAllCheckbox.indeterminate = false;
    }
  }

  private subscribeToSelectAllChanges() {
    this.selectAllCheckbox?.ionChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event: CustomEvent) => {
        if (this.readonly) {
          return;
        }
        if (event.detail.checked) {
          this.value = this.individualCheckboxes.map(
            (checkbox) => (checkbox.checked = true && checkbox.value),
          );
        } else {
          this.value = [];
          this.individualCheckboxes.forEach((checkbox) => {
            checkbox.checked = false;
          });
        }
        this.onChange([...this.value]);
        this.onTouched();
      });
  }

  subscribeToCheckboxListChange() {
    // Update checkboxes on changes in the content
    this.checkboxes?.changes
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        // Store individual disabled states before modifying
        this.checkboxes?.forEach((checkbox) => {
          if (checkbox.disabled && !this.disabled && !this.readonly) {
            this.individualDisabledStates.set(checkbox.value, true);
          }
        });

        // subscribe when new list of checkboxes is available
        this.subscribeToCheckboxChanges();
        this.subscribeToSelectAllChanges();
        this.checkboxes?.forEach((checkbox) => {
          checkbox.checked = this.value.includes(checkbox.value);
          const individualDisabled =
            this.individualDisabledStates.get(checkbox.value) || false;
          checkbox.disabled =
            this.disabled || this.readonly || individualDisabled;
        });
        this.updateSelectAllState();
      });
  }

  subscribeToCheckboxChanges() {
    this.individualCheckboxes?.forEach((checkbox) => {
      // Store individual disabled state if it's set
      if (checkbox.disabled && !this.disabled && !this.readonly) {
        this.individualDisabledStates.set(checkbox.value, true);
      }

      // Initialize the checkbox state
      checkbox.checked = this.value.includes(checkbox.value);
      // Set the disabled state based on form control disabled, readonly flag, or individual disabled state
      const individualDisabled =
        this.individualDisabledStates.get(checkbox.value) || false;
      checkbox.disabled = this.disabled || this.readonly || individualDisabled;
      // Subscribe to changes
      checkbox.ionChange
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((event: CustomEvent) => {
          // Ignore changes if readonly is true
          if (this.readonly) {
            return;
          }
          this.updateValue(event, checkbox.value);
          this.updateSelectAllState();
        });
    });
  }
}
