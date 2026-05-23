import {
  Component,
  ContentChildren,
  QueryList,
  AfterContentInit,
  forwardRef,
  signal,
  effect,
  inject,
  runInInjectionContext,
  Injector,
  input,
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  FormsModule,
  NG_VALIDATORS,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DsCheckboxComponent } from '../checkbox/checkbox.component';

const SELECT_ALL = 'SELECT_ALL';

@Component({
  selector: 'app-ds-checkbox-group',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `<ng-content></ng-content>`,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DsCheckboxGroupComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => DsCheckboxGroupComponent),
      multi: true,
    },
  ],
})
export class DsCheckboxGroupComponent
  implements ControlValueAccessor, AfterContentInit
{
  @ContentChildren(DsCheckboxComponent)
  checkboxes!: QueryList<DsCheckboxComponent>;
  selected = signal<any[]>([]);
  injector = inject(Injector);
  required = input<boolean>(false);

  private onChange: (val: any[]) => void = () => {};
  private onTouched: () => void = () => {};

  ngAfterContentInit(): void {
    this.checkboxes.forEach((checkbox) => {
      const val = checkbox.value();

      checkbox.registerOnChange((checked: boolean) => {
        if (val === SELECT_ALL) {
          // SELECT ALL toggled
          checked ? this.selectAll() : this.clearAll();
        } else {
          // normal value toggled
          if (checked) {
            this.addValue(val);
          } else {
            this.removeValue(val);
          }
        }

        this.syncSelectAllCheckbox(); // keep SELECT_ALL checkbox in sync
        this.onChange(this.getFilteredSelected());
      });

      checkbox.registerOnTouched(() => this.onTouched());

      runInInjectionContext(this.injector, () => {
        effect(
          () => {
            checkbox.writeValue(this.selected().includes(val));
          },
          { allowSignalWrites: true }, // ✅ this allows .set() inside effect
        );
      });
    });
  }

  private getFilteredSelected(): any[] {
    return this.selected().filter((v) => v !== SELECT_ALL);
  }

  validate(control: AbstractControl): ValidationErrors | null {
    const selected = this.selected();
    if (
      this.required() &&
      (!Array.isArray(selected) || selected.length === 0)
    ) {
      return { required: true };
    }
    return null;
  }

  writeValue(value: any[]): void {
    const filtered = (value ?? []).filter((v) => v !== SELECT_ALL);
    this.selected.set(filtered);

    this.checkboxes?.forEach((cb) => {
      const val = cb.value();
      cb.writeValue(filtered.includes(val));
    });
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.checkboxes?.forEach((cb) => cb.setDisabledState(isDisabled));
  }

  private addValue(val: any): void {
    if (!this.selected().includes(val)) {
      this.selected.set([...this.selected(), val]);
    }
  }

  private removeValue(val: any): void {
    this.selected.set(this.selected().filter((v) => v !== val));
  }

  private selectAll(): void {
    const allValues = this.checkboxes
      .map((cb) => cb.value())
      .filter((v) => v !== SELECT_ALL);
    this.selected.set(allValues);
  }

  private clearAll(): void {
    this.selected.set([]);
  }

  private syncSelectAllCheckbox(): void {
    const allCheckboxes = this.checkboxes.filter(
      (cb) => cb.value() !== SELECT_ALL,
    );
    const allValues = allCheckboxes.map((cb) => cb.value());

    const allSelected = allValues.every((v) => this.selected().includes(v));
    const noneSelected = allValues.every((v) => !this.selected().includes(v));

    const selectAllCheckbox = this.checkboxes.find(
      (cb) => cb.value() === SELECT_ALL,
    );

    if (allSelected) {
      this.addValue(SELECT_ALL);
      selectAllCheckbox?.variant.set('determinate');
      selectAllCheckbox?.writeValue(true);
    } else if (noneSelected) {
      this.removeValue(SELECT_ALL);
      selectAllCheckbox?.variant.set('determinate');
      selectAllCheckbox?.writeValue(false);
    } else {
      this.addValue(SELECT_ALL); // still mark as "present"
      selectAllCheckbox?.variant.set('indeterminate');
      selectAllCheckbox?.writeValue(false); // not fully checked
    }
  }
}
