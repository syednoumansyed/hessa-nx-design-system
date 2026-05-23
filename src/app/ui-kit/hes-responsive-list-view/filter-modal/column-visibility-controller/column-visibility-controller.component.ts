import { Component, DestroyRef, inject, signal } from '@angular/core';
import { HesCheckboxModule } from '@ui-kit/hes-checkbox/hes-checkbox.module';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faAngleDown } from '@fortawesome/pro-regular-svg-icons';
import { TranslocoDirective } from '@jsverse/transloco';
import { ListViewContextService } from '../../list-view-context.service';
import { CommonModule } from '@angular/common';
import { combineLatest, map, withLatestFrom } from 'rxjs';
import { isMobile } from '@shared/utils/platform';
import { isEmpty } from '@shared/utils/is-empty.util';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-column-visibility-controller',
  templateUrl: './column-visibility-controller.component.html',
  standalone: true,
  imports: [
    HesCheckboxModule,
    FormsModule,
    FontAwesomeModule,
    TranslocoDirective,
    CommonModule,
    ReactiveFormsModule,
  ],
})
export class ColumnVisibilityControllerComponent {
  // #region injector
  private readonly listViewContextService = inject(ListViewContextService);
  private readonly destroyRef = inject(DestroyRef);
  // #endregion

  // #region protected properties
  protected readonly selectAllCtrl = new FormControl(true);
  protected readonly tableConfig$ =
    this.listViewContextService.tableConfig$.pipe(
      map((cols) => {
        return cols
          .filter((col) => !(col.type === 'action' && this.isMobile))
          .map((col) => ({
            value: col.field,
            displayedValue: col.headerName,
          }));
      }),
    );

  protected readonly columnsState$ =
    this.listViewContextService.columnState$.pipe(
      withLatestFrom(this.listViewContextService.tableConfig$),
      map(([columnState, columns]) => {
        if (isEmpty(columnState)) {
          return columns.map((i) => i.field);
        }
        return columnState?.filter((i) => !i.hide).map((i) => i.field);
      }),
    );
  protected readonly angalDownIcon = faAngleDown;
  protected readonly isCollapsed = signal<boolean>(true);
  // #endregion

  // #region private properties
  private readonly isMobile = isMobile();
  private readonly isAllSelected$ = combineLatest([
    this.tableConfig$,
    this.columnsState$,
  ]).pipe(
    map(([tableConfig, columnsState]) => {
      if (!columnsState) {
        return true;
      }
      return (
        tableConfig.length ===
        columnsState.filter(
          (col) => !((col === 'actions' || col === 'action') && this.isMobile),
        ).length
      );
    }),
  );
  // #endregion

  // #region protected methods
  ngOnInit() {
    this.isAllSelected$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((isAllSelected) => {
        if (isAllSelected) {
          this.selectAllCtrl.disable();
        } else {
          this.selectAllCtrl.enable();
        }
        this.selectAllCtrl.setValue(isAllSelected);
      });
  }

  protected selectAllColumns(event: CustomEvent) {
    const allColumnsFields = this.listViewContextService
      .getTableConfigValue()
      .map((i) => i.field);
    if (event.detail.checked) {
      this.updateSelectedColumns(allColumnsFields);
    }
  }

  protected updateSelectedColumns(selectedColumns: string[]) {
    const columns = this.listViewContextService.getColumnsState();
    const allColumns = this.listViewContextService.getTableConfigValue();
    const updateColState =
      (columns ?? allColumns)?.map((i) => {
        return {
          ...i,
          hide: !selectedColumns.includes(i.field),
        };
      }) ?? [];
    this.listViewContextService.setColumnsState(updateColState);
  }

  protected onToggleCollapsed() {
    this.isCollapsed.set(!this.isCollapsed());
  }
  // #endregion
}
