import { computed, Injectable, signal, WritableSignal } from '@angular/core';
import {
  DsSelectConfig,
  DsSelectedItem,
  DsSelectedItems,
  DsSelectedValue,
  DsSelectOption,
} from './select.interface';
import { FormControl } from '@angular/forms';
import { ObjId } from '@shared/interfaces/common.interface';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';

@Injectable()
export class DsSelectContextService<T = any> {
  //#region Signals and Observables
  private readonly config = signal<DsSelectConfig | null>(null);
  private readonly value = signal<DsSelectedValue>([]);
  private accumulatedOptions = signal<DsSelectOption[]>([]);
  public readonly selectedItems = signal<DsSelectedItems>([]);
  public readonly searchCtrl = new FormControl('');
  searchValueChange = toSignal(this.searchCtrl.valueChanges, {
    initialValue: '',
  });
  public readonly valueChange$ = toObservable(this.value);
  //#endregion

  //#region Computed Properties
  public readonly options = computed<DsSelectConfig['options']>(() => {
    const config = this.config();
    if (!config) return [];
    if (!this.isPaginated() && config.loadOptions) {
      return this.accumulatedOptions();
    }
    return config.options ?? [];
  });

  public readonly loadSelectedItem = computed(() => {
    const config = this.config();
    if (!config) return null;
    return config.loadSelectedItems ?? null;
  });

  public readonly isLoadOptionsWithoutPagination = computed(() => {
    const config = this.config();
    if (!config) return false;
    return !this.isPaginated() && !!config.loadOptions;
  });

  public readonly isPaginated = computed(() => {
    const config = this.config();
    if (!config) return false;
    return config.isPaginated ?? false;
  });

  public readonly isInitialLoad = signal<boolean>(false);

  public readonly searchResult = computed(() => {
    const searchText = this.searchValueChange();
    const config = this.config();
    if (!config) return [];

    return config.loadOptions && this.isPaginated()
      ? this.accumulatedOptions()
      : this.filterOptions(searchText);
  });

  public readonly isMultiple = computed(() => {
    const config = this.config();
    if (!config) return false;
    return config.isMultiple ?? false;
  });
  //#endregion

  //#region Modal Reference
  private modalRef: HTMLIonModalElement | null;
  //#endregion

  //#region State for Pagination and Loading
  private currentPage = 1;
  private hasMore = true;
  public isLoading = signal(false);
  //#endregion

  //#region Constructor
  constructor() {}
  //#endregion

  //#region Public API
  public setConfig(config: DsSelectConfig) {
    this.config.set(config);
    // Re-resolve selected items when options change (handles race condition
    // where value was set before options were available)
    const value = this.value();
    if (value != null && !(Array.isArray(value) && value.length === 0)) {
      this.selectItemsFromValue();
    }
  }

  /** Returns selected value excluding disabled options (like FormControl.value) */
  public getValue(): DsSelectedValue {
    const raw = this.value();
    if (!Array.isArray(raw)) return raw;
    const disabledIds = new Set(
      (this.options() ?? []).filter((o) => o.disabled).map((o) => o.id),
    );
    if (disabledIds.size === 0) return raw;
    return raw.filter((id) => !disabledIds.has(id));
  }

  /** Returns all selected values including disabled (like FormControl.getRawValue) */
  public getRawValue(): DsSelectedValue {
    return this.value();
  }

  public setValue(value: DsSelectedValue) {
    this.value.set(value);
    if (value == null || (Array.isArray(value) && value.length === 0)) {
      this.selectedItems.set([]);
      return;
    }
    this.selectItemsFromValue();
  }

  public isSelected(item: ObjId): boolean {
    const value = this.value();
    if (this.isMultiple() && Array.isArray(value)) {
      return value.includes(item);
    } else {
      return this.value() === item;
    }
  }

  public selectItemsFromValue(value: DsSelectedValue = this.value()) {
    const config = this.config();
    if (!config) return;
    if (config.loadSelectedItems) {
      // Skip the async fetch if selectedItems already correctly represents
      // the current value (e.g. immediately after the user picks an item).
      const valueIds =
        value == null || (Array.isArray(value) && !value.length)
          ? []
          : Array.isArray(value)
            ? value
            : [value];
      const itemIds = this.selectedItems().map((i) => i.id);
      const alreadyMatches =
        valueIds.length === itemIds.length &&
        valueIds.every((id) => itemIds.some((iid) => iid === id));
      if (alreadyMatches) {
        return;
      }
      this.loadSelectedItems(value);
      return;
    }
    const options = this.options();
    if (!options) return;
    const selectedItems: DsSelectedItems = [];
    if (this.isMultiple() && Array.isArray(value)) {
      value.forEach((id) => {
        const item = options.find((option) => option.id === id);
        if (item) {
          selectedItems.push({ id: item.id, display: item.display });
        }
      });
    } else {
      const item = options.find((option) => option.id === value);
      if (item) {
        selectedItems.push({ id: item.id, display: item.display });
      }
    }
    this.selectedItems.set(selectedItems);
  }

  public loadSelectedItems(value: DsSelectedValue) {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      this.selectedItems.set([]);
      return;
    }

    const config = this.config();
    if (!config || !config.loadSelectedItems) {
      console.warn('loadSelectedItems function is not defined in the config.');
      return;
    }

    const ids = Array.isArray(value) ? value : [value];

    const observables = ids.map((id) =>
      config.loadSelectedItems!({ selectedId: id }),
    );

    forkJoin(observables).subscribe({
      next: (results) => {
        const selectedItems: DsSelectedItems = results
          .map((item) => this.mapToInternalFormat(item.data))
          .flat();

        this.selectedItems.set(selectedItems);
      },
      error: (err) => {
        console.error('Error loading selected items:', err);
      },
    });
  }

  public setSelectedItems(item: DsSelectedItem) {
    const currentItems = this.selectedItems();
    const isAlreadySelected = currentItems.some(
      (selected) => selected.id === item.id,
    );

    if (this.isMultiple()) {
      if (isAlreadySelected) {
        this.selectedItems.set(
          currentItems.filter((selected) => selected.id !== item.id),
        );
      } else {
        this.selectedItems.set([...currentItems, item]);
      }

      const updatedIds = this.selectedItems().map((selected) => selected.id);
      this.value.set(updatedIds);
    } else {
      this.selectedItems.set([item]);
      this.value.set(item.id);
      this.onClose();
    }
  }

  public readonly showSelectAll = computed(() => {
    const config = this.config();
    if (!config) return false;
    return (config.showSelectAll ?? false) && (config.isMultiple ?? false);
  });

  public readonly isAllSelected = computed(() => {
    const options = this.searchResult();
    if (options.length === 0) return false;
    const selectedIds = new Set(this.selectedItems().map((item) => item.id));
    return options
      .filter((o) => !o.disabled)
      .every((o) => selectedIds.has(o.id));
  });

  public selectAll() {
    const options = this.searchResult();
    const currentItems = this.selectedItems();
    const currentIds = new Set(currentItems.map((item) => item.id));
    const newItems = options
      .filter((o) => !o.disabled && !currentIds.has(o.id))
      .map((o) => ({ id: o.id, display: o.display }));
    const merged = [...currentItems, ...newItems];
    this.selectedItems.set(merged);
    this.value.set(merged.map((item) => item.id));
  }

  public deselectAll() {
    // Keep disabled (locked) items selected — they cannot be removed
    const disabledIds = new Set(
      (this.options() ?? []).filter((o) => o.disabled).map((o) => o.id),
    );
    const keptItems = this.selectedItems().filter((item) =>
      disabledIds.has(item.id),
    );
    this.selectedItems.set(keptItems);
    this.value.set(keptItems.map((item) => item.id));
  }

  public removeByValue(value: ObjId) {
    // Prevent removal of disabled (locked) options
    const option = (this.options() ?? []).find((o) => o.id === value);
    if (option?.disabled) return;

    const currentItems = this.selectedItems();
    const updatedItems = currentItems.filter((item) => item.id !== value);
    this.selectedItems.set(updatedItems);

    const updatedIds = this.selectedItems().map((selected) => selected.id);
    this.value.set(this.isMultiple() ? updatedIds : (updatedIds[0] ?? null));
  }

  public setModalRef(modalRef: HTMLIonModalElement) {
    this.modalRef = modalRef;
  }

  public onClose() {
    this.searchCtrl.setValue('');
    this.modalRef?.dismiss();
  }
  //#endregion

  //#region Load Options and Pagination
  public loadOptions(): void {
    if (!this.isPaginated() && this.isInitialLoad()) {
      return;
    }
    const config = this.config();
    if (!config?.loadOptions || this.isLoading() || !this.hasMore) return;

    this.isLoading.set(true);
    const params = {
      pageNumber: this.currentPage,
      itemsPerPage: 20,
    };

    config
      .loadOptions({ params, searchText: this.searchCtrl.value ?? '' })
      .subscribe({
        next: (response) => {
          const newOptions = this.mapToInternalFormat(response.data);

          this.accumulatedOptions.update((options) => [
            ...options,
            ...newOptions,
          ]);
          if (this.isPaginated() && 'paginate' in response) {
            this.hasMore =
              response.paginate.pageNumber < response.paginate.totalPages;
            this.currentPage++;
          } else {
            this.hasMore = false;
          }

          this.isLoading.set(false);
          this.isInitialLoad.set(true);
          if (this.isLoadOptionsWithoutPagination()) {
            this.selectItemsFromValue();
          }
        },
        error: () => {
          this.isLoading.set(false);
          this.isInitialLoad.set(true);
        },
      });
  }

  public resetPagination() {
    this.currentPage = 1;
    this.hasMore = true;
    this.accumulatedOptions.set([]);
    this.isInitialLoad.set(false);
  }
  //#endregion

  //#region Helpers
  private filterOptions(
    searchText: string | null | undefined,
  ): DsSelectOption[] {
    const options: DsSelectOption[] = this.options() ?? [];
    if (searchText === undefined || searchText === null || searchText === '') {
      return options;
    }
    return options.filter((option) =>
      option.display
        .toLocaleLowerCase()
        .includes(searchText.toLocaleLowerCase()),
    );
  }

  private mapToInternalFormat(items: T[]): DsSelectOption[] {
    if (!this.config()) return [];
    const defaultFieldMapper = {
      id: 'id' as keyof T,
      display: 'display' as keyof T,
    };

    return items.map((item) => ({
      id: this.resolveField(
        item,
        this.config()!.fieldMapper?.id ?? ('id' as keyof T),
      ),
      display: this.resolveField(
        item,
        this.config()!.fieldMapper?.display ?? defaultFieldMapper.display,
      ),
      secondaryDisplay: this.resolveOptionalField(
        item,
        this.config()!.fieldMapper?.secondaryDisplay,
      ),
      icon: this.resolveOptionalField(item, this.config()!.fieldMapper?.icon),
      disabled: this.resolveOptionalField(
        item,
        this.config()!.fieldMapper?.disabled,
      ),
    }));
  }

  private resolveField(item: T, field: unknown) {
    return typeof field === 'function' ? field(item) : item[field as keyof T];
  }

  private resolveOptionalField(item: T, field: any) {
    if (!field) return undefined;
    return this.resolveField(item, field);
  }
  //#endregion
}
