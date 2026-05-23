import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { faSliders, faCircleXmark } from '@fortawesome/pro-solid-svg-icons';
import {
  TUI_TEXTFIELD_APPEARANCE_DIRECTIVE,
  TuiDialogService,
} from '@taiga-ui/core';
import { TUI_DATE_SEPARATOR } from '@taiga-ui/cdk';
import {
  TUI_DATE_RANGE_VALUE_TRANSFORMER,
  TUI_DATE_VALUE_TRANSFORMER,
} from '@taiga-ui/kit';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs/operators';
import { DsTranslatePipe } from '@ds/i18n/ds-translate.pipe';

import { startOfDay, endOfDay } from 'date-fns';
import { DsButtonComponent } from '@ds/button/button.component';
import { DsChipComponent } from '@ds/chip/chip.component';
import {
  ExampleDateTransformer,
  getExampleDateRangeTransformer,
} from '@shared/components/form-control-generator/date-range-value-transformer';
import { DsIconComponent } from '@ds/icon/icon.component';
import { DsFormControlGeneratorComponent } from '@shared/components/ds-form-control-generator/ds-form-control-generator.component';
import { DsFormControl } from '@shared/components/ds-form-control-generator/ds-form-control-generator.model';
import { DsSchoolStructureControlComponent } from '@ds/school-structure-control/ds-school-structure-control.component';
import { SearchBoxComponent } from '@ds/search-box/search-box.component';
import {
  DsFilterConfig,
  DsFilterValue,
  DsFiltersValue,
  DsDateFilterConfig,
  DsDateRangeFilterConfig,
  DsSelectFilterConfig,
  DsChipSelectorFilterConfig,
} from './ds-filter-panel.model';

interface ModalFilterChip {
  label: string;
  key: string;
  value?: unknown;
}

@Component({
  selector: 'app-ds-filter-panel',
  templateUrl: './ds-filter-panel.component.html',
  styleUrl: './ds-filter-panel.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DsButtonComponent,
    DsChipComponent,
    DsIconComponent,
    DsFormControlGeneratorComponent,
    DsSchoolStructureControlComponent,
    SearchBoxComponent,
    DsTranslatePipe,
  ],
  providers: [
    {
      provide: TUI_TEXTFIELD_APPEARANCE_DIRECTIVE,
      useValue: { appearance: 'hes-textfield' },
    },
    { provide: TUI_DATE_SEPARATOR, useValue: '/' },
    {
      provide: TUI_DATE_VALUE_TRANSFORMER,
      useClass: ExampleDateTransformer,
    },
    {
      provide: TUI_DATE_RANGE_VALUE_TRANSFORMER,
      deps: [TUI_DATE_VALUE_TRANSFORMER],
      useFactory: getExampleDateRangeTransformer,
    },
  ],
})
export class DsFilterPanelComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialogs = inject(TuiDialogService);
  private readonly filtersDialog = viewChild('filtersDialog', {
    read: TemplateRef,
  });
  private lastConfigSignature = '';
  private lastSelectionSignature = '';
  private lastEmittedSignature = '';
  private lastExposedSignature = '';
  private previousFilterValues: DsFiltersValue = {};
  readonly filters = input<DsFilterConfig[]>([]);
  readonly selection = input<DsFiltersValue>({});
  readonly filtersChange = output<DsFiltersValue>();

  readonly isOpen = signal(false);
  readonly currentValues = signal<DsFiltersValue>({});
  readonly appliedValues = signal<DsFiltersValue>({});
  readonly filterIcon = faSliders;
  readonly closeIcon = faCircleXmark;
  readonly formGroup = signal<FormGroup>(new FormGroup({}));

  readonly resolvedExposedFilters = computed(() => {
    return this.filters().filter((filter) => filter.exposed);
  });

  readonly hasExpandableExposedFilter = computed(() =>
    this.resolvedExposedFilters().some((f) => f.type !== 'date'),
  );

  readonly resolvedModalFilters = computed(() => {
    return this.filters().filter((filter) => !filter.exposed);
  });

  readonly allFilters = computed(() => {
    return this.filters();
  });

  readonly selectedCount = computed(() => {
    const configs = this.resolvedModalFilters().filter((c) => !c.hidden);
    const values = this.appliedValues();
    return configs.reduce((count, config) => {
      return this.isFilterActive(config, values[config.key])
        ? count + 1
        : count;
    }, 0);
  });

  readonly activeModalChips = computed<ModalFilterChip[]>(() => {
    const chips: ModalFilterChip[] = [];
    const values = this.currentValues();
    const configs = this.resolvedModalFilters().filter((c) => !c.hidden);

    for (const config of configs) {
      const value = values[config.key];
      if (!value || (Array.isArray(value) && !value.length)) continue;

      switch (config.type) {
        case 'chip-selector':
          if (Array.isArray(value)) {
            for (const v of value) {
              const opt = config.options.find((o) => o.value === v);
              // Skip stale values whose option no longer exists
              if (!opt) continue;
              chips.push({
                label: opt.displayedValue,
                key: config.key,
                value: v,
              });
            }
          } else {
            const opt = config.options.find((o) => o.value === value);
            // Skip stale values whose option no longer exists
            if (opt) {
              chips.push({
                label: opt.displayedValue,
                key: config.key,
              });
            }
          }
          break;
        case 'school-structure':
          if (Array.isArray(value)) {
            for (const v of value) {
              const entity = v as { name?: string };
              chips.push({
                label: entity.name ?? config.label,
                key: config.key,
                value: v,
              });
            }
          }
          break;
        case 'select':
          if (config.chipLabel) {
            chips.push({ label: config.chipLabel, key: config.key });
          } else if (config.config?.options && Array.isArray(value)) {
            // Multi-select: individual chip per selected value
            for (const id of value) {
              const opt = config.config.options.find(
                (o) => String(o.id) === String(id),
              );
              if (opt) {
                chips.push({
                  label: opt.display,
                  key: config.key,
                  value: id,
                });
              }
            }
          } else if (config.config?.options) {
            const opt = config.config.options.find(
              (o) => String(o.id) === String(value),
            );
            chips.push({
              label: opt?.display ?? String(value),
              key: config.key,
            });
          }
          break;
        case 'date': {
          const d = value instanceof Date ? value : new Date(value as string);
          if (!isNaN(d.getTime())) {
            const formatted = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
            chips.push({
              label: `${config.label}: ${formatted}`,
              key: config.key,
            });
          }
          break;
        }
        case 'date-range': {
          const r = value as { from: Date; to: Date } | null;
          if (r?.from && r?.to) {
            const fmt = (d: Date) =>
              `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
            chips.push({
              label: `${config.label}: ${fmt(r.from)} - ${fmt(r.to)}`,
              key: config.key,
            });
          }
          break;
        }
      }
    }
    return chips;
  });

  readonly isModalDirty = computed(() => {
    const modalKeys = this.resolvedModalFilters().map((f) => f.key);
    const current = this.currentValues();
    const applied = this.appliedValues();
    const pickModal = (vals: DsFiltersValue) =>
      modalKeys.reduce((acc, key) => {
        acc[key] = vals[key];
        return acc;
      }, {} as DsFiltersValue);
    return (
      this.safeStringify(pickModal(current)) !==
      this.safeStringify(pickModal(applied))
    );
  });

  readonly isApplyDisabled = computed(() => {
    if (!this.isModalDirty()) return true;
    const current = this.currentValues();
    return this.resolvedModalFilters().some((config) => {
      if (!config.required || config.hidden) return false;
      const value = current[config.key];
      return (
        value == null ||
        value === '' ||
        (Array.isArray(value) && value.length === 0)
      );
    });
  });

  constructor() {
    effect(() => {
      const configs = this.allFilters();
      const signature = this.buildConfigSignature(configs);
      if (signature === this.lastConfigSignature) {
        return;
      }
      this.lastConfigSignature = signature;
      this.formGroup.set(this.buildFormGroup(configs));
    });

    effect(() => {
      const form = this.formGroup();
      const selection = this.selection();
      const selectionSignature = this.safeStringify(selection);
      if (selectionSignature === this.lastSelectionSignature) {
        return;
      }
      this.lastSelectionSignature = selectionSignature;
      const patched = this.normalizeSelection(selection, this.allFilters());
      form.patchValue(patched, { emitEvent: false });
      this.currentValues.set(form.getRawValue() as DsFiltersValue);
      this.appliedValues.set(
        this.normalizeSelection(selection, this.resolvedModalFilters()),
      );
      // Seed the emitted signature so that the first interaction doesn't
      // falsely detect a change from the initial '' value.
      this.lastEmittedSignature = this.safeStringify(
        this.cleanFilters(selection),
      );
    });

    effect((onCleanup) => {
      const form = this.formGroup();
      // Seed the exposed signature with the current form state so that
      // the first modal filter change doesn't falsely emit (the exposed
      // values haven't actually changed — only a modal value did).
      const initial = form.getRawValue() as DsFiltersValue;
      this.lastExposedSignature = this.safeStringify(
        this.pickExposedValues(initial),
      );
      const subscription = form.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((value) => {
          const casted = value as DsFiltersValue;
          this.currentValues.set(casted);
          this.handleExposedChanges(casted);
          for (const config of this.allFilters()) {
            if (config.onChange && config.key in casted) {
              config.onChange(casted[config.key]);
            }
          }
          // Auto-clear dependent filters when parent value changes
          this.clearDependentFilters(form, casted);
        });
      onCleanup(() => subscription.unsubscribe());
    });
  }

  private mapFilterToControl(
    config:
      | DsDateFilterConfig
      | DsDateRangeFilterConfig
      | DsSelectFilterConfig
      | DsChipSelectorFilterConfig,
    hideLabel: boolean,
  ): DsFormControl {
    const label = hideLabel ? '' : config.label;

    switch (config.type) {
      case 'date':
        return {
          type: 'date',
          formControlName: config.key,
          label,
          placeholder: config.placeholder,
        };
      case 'date-range':
        return {
          type: 'date-range',
          formControlName: config.key,
          label,
          placeholder: config.placeholder,
        };
      case 'select': {
        const options = config.config.options ?? [];
        const placeholder = config.config.placeholder ?? (label || '');
        return {
          type: 'searchable-select',
          formControlName: config.key,
          label,
          placeholder,
          isMultiple: config.config.isMultiple ?? false,
          selectValues: options.map((option) => ({
            value: option.id,
            displayedValue: option.display,
          })),
          dsSelectConfig: {
            ...config.config,
            options,
            label,
            placeholder,
          },
        } as DsFormControl;
      }
      case 'chip-selector':
        return {
          type: 'chip-selector',
          formControlName: config.key,
          label,
          // Map ChipSelectorOption to DsSelectValue format
          selectValues: (config.options ?? []).map((opt) => ({
            value: opt.value,
            displayedValue: opt.displayedValue,
            disabled: opt.disabled,
            // Convert DsIcon to DsSelectValueIcon format if icon exists
            icon: opt.icon
              ? { name: opt.icon as any, placement: 'start' as const }
              : undefined,
          })),
          isMultiple: config.multiple ?? false,
        };
    }
  }

  protected filterControl(
    filter:
      | DsDateFilterConfig
      | DsDateRangeFilterConfig
      | DsSelectFilterConfig
      | DsChipSelectorFilterConfig,
    hideLabel: boolean,
  ) {
    return this.mapFilterToControl(filter, hideLabel);
  }

  protected removeModalChip(chip: ModalFilterChip): void {
    const form = this.formGroup();
    const control = form.get(chip.key);
    if (!control) return;

    if (chip.value !== undefined) {
      const current = control.value;
      if (Array.isArray(current)) {
        control.setValue(current.filter((v: unknown) => v !== chip.value));
      }
    } else {
      control.setValue(null);
    }
  }

  protected clearAllModalFilters(): void {
    const form = this.formGroup();
    for (const config of this.resolvedModalFilters()) {
      const control = form.get(config.key);
      if (!control) continue;
      // Use defaultValue for date/date-range if provided
      if (
        (config.type === 'date' || config.type === 'date-range') &&
        config.defaultValue != null
      ) {
        control.setValue(config.defaultValue);
      } else {
        control.setValue(
          (config.type === 'chip-selector' && config.multiple) ||
            config.type === 'school-structure'
            ? []
            : null,
        );
      }
    }
  }

  openModal() {
    if (this.isOpen()) {
      return;
    }
    const template = this.filtersDialog();
    if (!template) {
      return;
    }
    this.syncFormGroup();
    this.isOpen.set(true);
    this.dialogs
      .open(template, {
        appearance: 'ds-filter',
        dismissible: false,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isOpen.set(false)),
      )
      .subscribe();
  }

  protected applyFilters(): void {
    const form = this.formGroup();
    const values = form.getRawValue() as DsFiltersValue;
    this.currentValues.set(values);
    this.appliedValues.set(values);
    this.emitFiltersChange(values);
  }

  private syncFormGroup() {
    const configs = this.allFilters();
    const form = this.formGroup();
    const patched = this.normalizeSelection(this.selection(), configs);
    form.patchValue(patched, { emitEvent: false });
    const values = form.getRawValue() as DsFiltersValue;
    this.currentValues.set(values);
    this.appliedValues.set(
      this.normalizeSelection(this.selection(), this.resolvedModalFilters()),
    );
    // Notify onChange callbacks with the initial values so dependents
    // (e.g. a teacher dropdown that depends on the school filter) are
    // correct the moment the modal opens.
    for (const config of configs) {
      if (config.onChange && config.key in values) {
        config.onChange(values[config.key]);
      }
    }
  }

  private buildFormGroup(configs: DsFilterConfig[]): FormGroup {
    const group: Record<string, FormControl> = {};
    configs.forEach((config) => {
      group[config.key] = new FormControl(
        this.resolveControlValue(config, undefined),
      );
    });
    return new FormGroup(group);
  }

  private buildConfigSignature(configs: DsFilterConfig[]): string {
    return configs
      .map((config) => {
        const parts = [config.key, config.type];
        if (config.type === 'select') {
          parts.push(config.config.isMultiple ? 'multi' : 'single');
        }
        if (config.type === 'chip-selector') {
          parts.push(config.multiple ? 'multi' : 'single');
        }
        if (config.type === 'school-structure') {
          parts.push(config.isMultiSelect ? 'multi' : 'single');
          parts.push(String(config.depth ?? ''));
        }
        return parts.join(':');
      })
      .join('|');
  }

  private safeStringify(value: unknown): string {
    try {
      return JSON.stringify(value) ?? '';
    } catch {
      return '';
    }
  }

  private emitFiltersChange(values: DsFiltersValue) {
    const cleanedValues = this.cleanFilters(values);
    // Normalize date-range values: from → start of day, to → end of day
    this.normalizeDateRangeValues(cleanedValues);
    const emittedSignature = this.safeStringify(cleanedValues);
    if (emittedSignature === this.lastEmittedSignature) {
      return;
    }
    this.lastEmittedSignature = emittedSignature;
    this.filtersChange.emit(cleanedValues);
  }

  /** Ensure date-range from = start of day (00:00:00), to = end of day (23:59:59) */
  private normalizeDateRangeValues(values: DsFiltersValue): void {
    const configs = this.allFilters();
    for (const config of configs) {
      if (config.type !== 'date-range') continue;
      const val = values[config.key] as { from: Date; to: Date } | null;
      if (!val?.from || !val?.to) continue;
      val.from = startOfDay(new Date(val.from));
      val.to = endOfDay(new Date(val.to));
    }
  }

  private handleExposedChanges(values: DsFiltersValue) {
    const exposedValues = this.pickExposedValues(values);
    const exposedSignature = this.safeStringify(exposedValues);
    if (exposedSignature === this.lastExposedSignature) {
      return;
    }
    this.lastExposedSignature = exposedSignature;
    const mergedValues = {
      ...this.appliedValues(),
      ...exposedValues,
    };
    this.emitFiltersChange(mergedValues);
  }

  private pickExposedValues(values: DsFiltersValue): DsFiltersValue {
    const exposed = this.resolvedExposedFilters();
    return exposed.reduce((acc, filter) => {
      acc[filter.key] = values[filter.key];
      return acc;
    }, {} as DsFiltersValue);
  }

  private cleanFilters(values: DsFiltersValue): DsFiltersValue {
    const configs = this.allFilters();
    return configs.reduce((acc, config) => {
      if (config.hidden) return acc;
      const value = values[config.key];
      if (this.isFilterActive(config, value)) {
        acc[config.key] = value;
      }
      return acc;
    }, {} as DsFiltersValue);
  }

  private normalizeSelection(
    selection: DsFiltersValue,
    configs: DsFilterConfig[],
  ): DsFiltersValue {
    return configs.reduce((acc, config) => {
      acc[config.key] = this.resolveControlValue(config, selection[config.key]);
      return acc;
    }, {} as DsFiltersValue);
  }

  private resolveControlValue(
    config: DsFilterConfig,
    value: DsFilterValue,
  ): DsFilterValue {
    if (value !== undefined) {
      if (config.type === 'select' && config.config.isMultiple) {
        return Array.isArray(value) ? value : [];
      }
      if (config.type === 'chip-selector' && config.multiple) {
        return Array.isArray(value) ? value : [];
      }
      if (config.type === 'school-structure') {
        return Array.isArray(value) ? value : [];
      }
      return value;
    }

    switch (config.type) {
      case 'search':
        return null;
      case 'date':
        return null;
      case 'date-range':
        return null;
      case 'select':
        return config.config.isMultiple ? [] : null;
      case 'chip-selector':
        return config.multiple ? [] : null;
      case 'school-structure':
        return [];
      default:
        return null;
    }
  }

  private isFilterActive(
    config: DsFilterConfig,
    value: DsFilterValue,
  ): boolean {
    if (value === null || value === undefined) {
      return false;
    }

    if (config.type === 'date') {
      return value !== null && value !== undefined && value !== '';
    }

    if (config.type === 'date-range') {
      const r = value as { from: Date; to: Date } | null;
      return !!(r?.from && r?.to);
    }

    if (config.type === 'search') {
      return typeof value === 'string' ? value.trim() !== '' : false;
    }

    if (config.type === 'select') {
      return Array.isArray(value)
        ? value.length > 0
        : value !== null && value !== undefined && value !== '';
    }

    if (config.type === 'chip-selector') {
      if (Array.isArray(value)) {
        // Only count values that still exist in options
        return value.some((v) => config.options.some((o) => o.value === v));
      }
      if (value === null || value === undefined || value === '') return false;
      // Only active if value matches an existing option
      return config.options.some((o) => o.value === value);
    }

    if (config.type === 'school-structure') {
      return Array.isArray(value) ? value.length > 0 : false;
    }

    return false;
  }

  /**
   * When a parent filter changes, auto-clear all filters that declare
   * `dependsOn` pointing to that parent key.
   */
  private clearDependentFilters(
    form: FormGroup,
    currentValues: DsFiltersValue,
  ): void {
    const configs = this.allFilters();
    const prev = this.previousFilterValues;

    // Find which filter keys actually changed
    const changedKeys = new Set<string>();
    for (const config of configs) {
      const key = config.key;
      if (JSON.stringify(currentValues[key]) !== JSON.stringify(prev[key])) {
        changedKeys.add(key);
      }
    }

    if (changedKeys.size > 0) {
      // Clear dependents of changed keys
      for (const config of configs) {
        const deps = config.dependsOn
          ? Array.isArray(config.dependsOn)
            ? config.dependsOn
            : [config.dependsOn]
          : [];
        if (deps.some((dep) => changedKeys.has(dep))) {
          const control = form.get(config.key);
          if (control && control.value !== null) {
            const resetValue =
              (config.type === 'chip-selector' &&
                (config as DsChipSelectorFilterConfig).multiple) ||
              config.type === 'school-structure'
                ? []
                : null;
            control.setValue(resetValue, { emitEvent: false });
            config.onChange?.(resetValue);
          }
        }
      }
      // Re-read form after clearing dependents
      const updated = form.getRawValue() as DsFiltersValue;
      this.currentValues.set(updated);
    }

    this.previousFilterValues = { ...currentValues };
  }
}
