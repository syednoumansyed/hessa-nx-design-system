import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
  TemplateRef,
} from '@angular/core';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import {
  ITableCol,
  MobileDetailHeaderContext,
  UnknownObject,
} from '../../hes-table/model';
import { createDetailedViewModal } from '../detailed-view/detailed.view.modal';
import { HesActionSheetComponent } from '../../hes-action-sheet/hes-action-sheet.component';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { isRtl } from '@shared/utils/platform';
import { getFormattedValueByField } from '../utils/list-view.utils';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { faPlus } from '@fortawesome/pro-regular-svg-icons';
import { DynamicCellRendererDirective } from '../dynamic-cell-renderer.directive';
import { DsTranslatePipe } from '@ds/i18n/ds-translate.pipe';
import { ListViewContextService } from '../list-view-context.service';
import { HesCheckboxModule } from '../../hes-checkbox/hes-checkbox.module';

@Component({
  selector: 'app-data-card-grid',
  templateUrl: './data-card-grid.component.html',
  styleUrls: ['./data-card-grid.component.scss'],
  standalone: true,
  imports: [
    HesButtonModule,
    HesActionSheetComponent,
    CommonModule,
    DynamicCellRendererDirective,
    HesCheckboxModule,
    DsTranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataCardGridComponent {
  // #region input
  data = input<UnknownObject>();
  columns = input<ITableCol[]>([]);
  mobileVisibleFieldsLimit = input<number>();
  selectable = input<boolean>(false);
  selected = input<boolean>(false);
  // #endregion

  // #region output
  selectionChange = output<{ data: UnknownObject; selected: boolean }>();
  // #endregion

  // #region injector
  private readonly translation = inject(HesTranslateService);
  private readonly listViewContextService = inject(ListViewContextService);
  // #endregion

  // #region protected properties
  protected readonly faPlus = faPlus;
  protected readonly viewColumns = computed(() => {
    const allColumns = this.columns()
      .filter(
        (column) =>
          !(
            column.mobileViewConfig?.isPrimaryKey ||
            column.mobileViewConfig?.isDisplayName ||
            column.type === 'action'
          ),
      )
      .map((col, index) => ({
        ...col,
        mobileViewConfig: {
          ...col.mobileViewConfig,
          order: col.mobileViewConfig?.order ?? index + 1,
        },
      }))
      .sort((a, b) => a.mobileViewConfig?.order - b.mobileViewConfig?.order);
    const selectedColumns = this.columnsState();
    const columnCount = this.mobileVisibleFieldsLimit() ?? 0;

    const filterColumns = (columns: typeof allColumns) =>
      Array.isArray(selectedColumns)
        ? columns.filter((col) =>
            selectedColumns.find((i) => i.field === col.field && !i.hide),
          )
        : columns;

    const filteredColumns = filterColumns(allColumns);
    return columnCount > 0
      ? filteredColumns.slice(0, columnCount)
      : filteredColumns;
  });

  protected readonly isViewMore = computed(() => {
    const allColumns = this.columns().filter(
      (column) =>
        !(
          column.mobileViewConfig?.isPrimaryKey ||
          column.mobileViewConfig?.isDisplayName ||
          column.type === 'action'
        ),
    );
    const selectedColumns = this.listViewContextService.getColumnsState();

    if (Array.isArray(selectedColumns)) {
      return (
        allColumns.filter((col) =>
          selectedColumns.find((i) => i.field === col.field && !i.hide),
        ).length > this.viewColumns().length
      );
    }
    return allColumns.length > this.viewColumns().length;
  });

  protected displayName = computed(() => {
    const displayColumn = this.columns().find(
      (col) => col.mobileViewConfig?.isDisplayName,
    );
    return displayColumn?.field ? this.getValueByField(displayColumn) : '';
  });
  // #endregion

  // #region private properties
  private readonly isRtl = signal(isRtl());
  private detailedViewModal = createDetailedViewModal();
  private readonly columnsState = toSignal(
    this.listViewContextService.columnState$,
  );
  private actions = computed(() => {
    return (
      this.columns().find(
        (column) => column.type === 'action' && column.actions,
      )?.actions ?? []
    ).filter((action) =>
      action.hasPermission ? action?.hasPermission(this.data()) : true,
    );
  });
  // #endregion

  // #region protected mehtods
  protected getValueByField(col: ITableCol) {
    return getFormattedValueByField({
      col,
      data: this.data()!,
      translation: this.translation,
      isRtl: this.isRtl(),
    });
  }

  protected get detailHeaderTemplate(): TemplateRef<MobileDetailHeaderContext> | null {
    return (
      this.getDetailHeaderColumn()?.mobileViewConfig?.headerTemplate ?? null
    );
  }

  protected get detailHeaderContext(): MobileDetailHeaderContext | null {
    const column = this.getDetailHeaderColumn();
    const data = this.data();

    if (!column || !data || !column.mobileViewConfig?.headerTemplate) {
      return null;
    }

    return {
      $implicit: data,
      data,
      column,
      value: this.getValueByField(column),
    };
  }

  protected get hasDetailHeader(): boolean {
    return !!(this.detailHeaderTemplate && this.detailHeaderContext);
  }

  protected getPrimaryColumn() {
    return this.columns().find(
      (column) => column.mobileViewConfig?.isPrimaryKey,
    );
  }

  private getDetailHeaderColumn() {
    return this.columns().find(
      (column) => column.mobileViewConfig?.headerTemplate,
    );
  }

  protected viewDetails() {
    this.detailedViewModal({
      data: this.data()!,
      columns: this.columns(),
    });
  }

  protected primaryActionsButton = computed(() => {
    return this.actions()
      .filter((action) => action.mobileViewConfig?.isPrimaryBtn)
      .slice(0, 2);
  });

  protected nonPrimaryActionsButton = computed(() => {
    const primaryActions = this.primaryActionsButton(); // Retrieve the primary actions
    return this.actions().filter((action) => !primaryActions.includes(action)); // Exclude the primary actions
  });

  protected toggleSelection(): void {
    this.selectionChange.emit({
      data: this.data()!,
      selected: !this.selected(),
    });
  }
  // #endregion
}
