import { CommonModule } from '@angular/common';
import {
  Component,
  inject,
  input,
  output,
  signal,
  computed,
  effect,
} from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { HesTranslateService } from '@shared/services/hes-translate.service';

export interface ChipFilterData {
  id: string;
  label: string;
  selected: boolean;
}

@Component({
  selector: 'app-chip-filter',
  standalone: true,
  templateUrl: './chip-filter.component.html',
  imports: [TranslocoDirective, CommonModule],
})
export class ChipFilterComponent {
  private readonly hesTranslateService = inject(HesTranslateService);
  selectedFilter = output<string | undefined>();
  clearSelection = input<boolean>(false);
  filterData = input<ChipFilterData[]>([]);

  // Local signal to manage filter selection state
  private selectedFilterId = signal<string | undefined>(undefined);

  constructor() {
    // Effect to emit initial selection when clearSelection is false
    effect(() => {
      const canClearSelection = this.clearSelection();
      const filters = this.filterData();
      const currentSelected = this.selectedFilterId();

      // If clearSelection is false and no current selection, emit first filter
      if (!canClearSelection && !currentSelected && filters.length > 0) {
        this.selectedFilter.emit(filters[0].id);
      }
    });
  }

  // Computed signal that combines input data with selection state
  localFilterData = computed(() => {
    const filters = this.filterData();
    const selectedId = this.selectedFilterId();
    const canClearSelection = this.clearSelection();

    // If no selection and clearSelection is false, select first item by default
    const effectiveSelectedId =
      selectedId ||
      (!canClearSelection && filters.length > 0 ? filters[0].id : undefined);

    return filters.map((filter) => ({
      ...filter,
      selected: filter.id === effectiveSelectedId,
    }));
  });

  onFilterSelected(filterId: string) {
    const canClearSelection = this.clearSelection();
    const currentSelected = this.selectedFilterId();

    // Determine what the new selection should be
    let newSelectedId: string | undefined;
    if (canClearSelection) {
      // Toggle selection: if same filter is clicked, deselect it
      newSelectedId = currentSelected === filterId ? undefined : filterId;
    } else {
      // Always select the clicked filter (no deselection allowed)
      newSelectedId = filterId;
    }

    // Only update and emit if the selection actually changed
    if (currentSelected !== newSelectedId) {
      this.selectedFilterId.set(newSelectedId);

      const filters = this.filterData();
      // Determine what to emit based on clearSelection mode
      const emitValue = canClearSelection
        ? newSelectedId
        : newSelectedId || (filters.length > 0 ? filters[0].id : undefined);

      this.selectedFilter.emit(emitValue);
    }
  }
}
