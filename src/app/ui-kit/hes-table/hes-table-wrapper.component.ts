import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  ChangeDetectionStrategy,
  AfterViewInit,
} from '@angular/core';
import { HesTableComponent } from './hes-table.component';
import { ITableCol, UnknownObject, ITableModel, ITableSort } from './model';
import { IPagination } from '@shared/interfaces';
import {
  SizeColumnsToContentStrategy,
  SizeColumnsToFitGridStrategy,
  SizeColumnsToFitProvidedWidthStrategy,
  GridApi,
  DragStoppedEvent,
} from 'ag-grid-community';
import { SchoolStructureListingService } from '@core/school-structure-listing.service';

/**
 * Wrapper component around `HesTableComponent` used by `ListViewContainerComponent`.
 * It enforces the new table integration flag and disables any interaction with
 * `SchoolStructureListingService` by overriding the provider.
 */
@Component({
  selector: 'app-hes-table-wrapper',
  standalone: true,
  imports: [HesTableComponent],
  template: `
    <app-hes-table
      [columns]="columns"
      [rowData]="rowData"
      [pagination]="pagination"
      [hideEntriesSelection]="hideEntriesSelection"
      [hideColumnsSelection]="hideColumnsSelection"
      [autoSizeStrategy]="autoSizeStrategy"
      [rowSelection]="rowSelection"
      [withNewTableIntegration]="true"
      (filterSortModelChanged)="filterSortModelChanged.emit($event)"
      (dragStop)="dragStop.emit($event)"
      (sortChanged)="sortChanged.emit($event)"
      (selectedRowsChange)="selectedRowsChange.emit($event)"
      (rowClicked)="rowClicked.emit($event)"
    ></app-hes-table>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    // Override the real service with a null value to fully disable its behavior for the wrapped table.
    { provide: SchoolStructureListingService, useValue: null },
  ],
})
export class HesTableWrapperComponent implements AfterViewInit {
  // Pass-through Inputs
  @Input() columns: ITableCol[] = [];
  @Input() rowData: UnknownObject[] = [];
  @Input() pagination: IPagination | null = null;
  @Input() hideEntriesSelection = false;
  @Input() hideColumnsSelection = false;
  @Input() autoSizeStrategy:
    | SizeColumnsToFitGridStrategy
    | SizeColumnsToFitProvidedWidthStrategy
    | SizeColumnsToContentStrategy
    | undefined;
  @Input() rowSelection: 'single' | 'multiple' | undefined = undefined;

  // Pass-through Outputs
  @Output() filterSortModelChanged = new EventEmitter<ITableModel>();
  @Output() dragStop = new EventEmitter<DragStoppedEvent>();
  @Output() sortChanged = new EventEmitter<ITableSort | null>();
  @Output() selectedRowsChange = new EventEmitter<any[]>();
  @Output() rowClicked = new EventEmitter<any>();

  @ViewChild(HesTableComponent) private innerTable?: HesTableComponent;

  /**
   * Expose the underlying table's GridApi for parent components needing low-level access.
   */
  public get gridApi(): GridApi | undefined {
    return this.innerTable?.gridApi;
  }

  /**
   * Pass-through for updating selected columns state on inner table.
   */
  public updateSelectedColumns(columns: string[]): void {
    this.innerTable?.updateSelectedColumns(columns);
  }

  ngAfterViewInit(): void {
    // No-op: kept for symmetry & potential future hook.
  }
}
