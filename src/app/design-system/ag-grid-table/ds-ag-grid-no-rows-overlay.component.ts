import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { INoRowsOverlayAngularComp } from 'ag-grid-angular';
import { INoRowsOverlayParams } from 'ag-grid-community';
import {
  NoDataCardComponent,
  NoDataFilterChip,
} from '@shared/components/no-data-card/no-data-card.component';
import { DsAgGridTableService } from './ds-ag-grid-table.service';

export interface DsAgGridNoRowsOverlayParams extends INoRowsOverlayParams {
  imagePath?: string;
  title?: string;
  description?: string;
  filteredByLabel?: string;
  filterChips?: NoDataFilterChip[];
  clearFiltersLabel?: string;
  onClearFilters?: () => void;
}

@Component({
  selector: 'ds-ag-grid-no-rows-overlay',
  standalone: true,
  imports: [CommonModule, NoDataCardComponent],
  template: `
    <div class="ds-ag-grid-no-rows-overlay">
      <app-no-data-card
        [noBgStyle]="true"
        [mainImagePath]="imagePath()"
        [title]="title()"
        [description]="description()"
        [filteredBy]="filterChips()"
        [filteredByLabel]="filteredByLabel()"
        [clearFiltersButton]="clearFiltersButton()"
      />
    </div>
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      padding: var(--ds-spacing-3xl, 48px) var(--ds-spacing-xl, 16px);
      background-color: var(--surface-primary);
    }

    .ds-ag-grid-no-rows-overlay {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DsAgGridNoRowsOverlayComponent implements INoRowsOverlayAngularComp {
  private readonly tableService = inject(DsAgGridTableService);

  /** Read reactively from service signal so template updates when filters change */
  private readonly params = this.tableService.noRowsOverlayParams;

  protected readonly imagePath = computed(
    () =>
      this.params().imagePath ?? 'assets/illustrations/no-search-result.svg',
  );
  protected readonly title = computed(
    () => this.params().title ?? 'No results found',
  );
  protected readonly description = computed(
    () => this.params().description ?? '',
  );
  protected readonly filterChips = computed(
    () => this.params().filterChips ?? [],
  );
  protected readonly filteredByLabel = computed(
    () => this.params().filteredByLabel ?? 'Filtered by',
  );
  protected readonly clearFiltersButton = computed(() => {
    const chips = this.filterChips();
    if (!chips.length) return undefined;
    return {
      label: this.params().clearFiltersLabel ?? 'Clear filters',
      onAction: () => this.params().onClearFilters?.(),
    };
  });

  agInit(_params: DsAgGridNoRowsOverlayParams): void {
    // Params are read reactively from the service signal, not from agInit
  }
}
