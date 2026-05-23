import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DsButtonComponent } from '@ds/button/button.component';
import { DsIcon, DsIconComponent } from '@ds/icon/icon.component';
import { DsAgGridTableService } from './ds-ag-grid-table.service';
import { DsAgGridBulkAction } from './ds-ag-grid-table.model';
import { HesTranslateService } from '@shared/services/hes-translate.service';

// Re-export for backwards compatibility
export { DsAgGridBulkAction } from './ds-ag-grid-table.model';
import { faXmark } from '@fortawesome/pro-regular-svg-icons';
import { DsTooltipDirective } from '@ds/tooltip/ds-tooltip.directive';
import {
  faArrowTurnLeftDown,
  faColumns3,
} from '@fortawesome/pro-solid-svg-icons';

@Component({
  selector: 'app-ds-ag-grid-table-header',
  standalone: true,
  imports: [
    CommonModule,
    DsButtonComponent,
    DsIconComponent,
    DsTooltipDirective,
  ],
  templateUrl: './ds-ag-grid-table-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DsAgGridTableHeaderComponent {
  title = input<string>('');
  selectionLabel = input<string>('Select students to');
  selectionLabelIcon = input<DsIcon | undefined>(faArrowTurnLeftDown);
  showSelectionCount = input<boolean>(true);
  selectionCount = input<number | null>(null);
  selectionEntityLabel = input<string>('Students');
  actions = input<DsAgGridBulkAction[]>([]);
  showCustomizeColumns = input<boolean>(false);
  /** Disable all bulk actions (e.g., when showing empty state) */
  disableAllActions = input<boolean>(false);
  actionClick = output<{
    action: DsAgGridBulkAction;
    rows: Record<string, unknown>[];
  }>();
  closeSelection = output<void>();
  customizeColumnsClick = output<void>();

  protected readonly customizeColumnsIcon = faColumns3;
  private readonly tableService = inject(DsAgGridTableService);
  private readonly translocoService = inject(HesTranslateService);
  protected readonly closeIcon = faXmark;

  protected readonly customizeColumnsLabel = computed(() =>
    this.translocoService.t('global.customize_columns.title'),
  );

  protected readonly activeActionId = this.tableService.activeBulkActionId;
  protected readonly selectionEnabled = this.tableService.selectionEnabled;
  protected readonly selectedCount = computed(() => {
    // When "all pages selected", use the total count from the service
    const allPagesCount = this.tableService.allPagesSelectedCount();
    if (allPagesCount != null) return allPagesCount;
    return this.tableService.selectedRows().length;
  });
  protected readonly activeAction = computed(() => {
    const activeId = this.activeActionId();
    if (!activeId) return null;
    return this.actions().find((item) => item.id === activeId) ?? null;
  });
  protected readonly activeLabel = computed(() => {
    const activeId = this.activeActionId();
    if (!activeId) return '';
    const action = this.actions().find((item) => item.id === activeId);
    return action?.activeLabel ?? action?.label ?? '';
  });

  protected readonly selectionTitle = computed(() => {
    if (this.selectionEnabled()) {
      const count = this.selectedCount();
      if (this.showSelectionCount() && count > 0) {
        const selectedText = this.translocoService.t('global.selected.txt');
        const suffix =
          selectedText === 'global.selected.txt' ? 'selected' : selectedText;
        return `${count} ${this.selectionEntityLabel()} ${suffix}`;
      }
      // No rows selected yet — always show the selection prompt
      return this.selectionLabel();
    }
    const count = this.selectionCount();
    if (count === null || count === undefined) {
      return this.selectionLabel();
    }
    return `Select from ${count} ${this.selectionEntityLabel()}`;
  });

  protected isActionDisabled(action: DsAgGridBulkAction): boolean {
    // If all actions are disabled (e.g., empty state), return true
    if (this.disableAllActions()) return true;

    const selectedRows = this.tableService.selectedRows();

    // Check disabled property (supports both boolean and function)
    if (action.disabled !== undefined) {
      const isDisabled =
        typeof action.disabled === 'function'
          ? action.disabled(selectedRows)
          : action.disabled;
      if (isDisabled) return true;
    }

    if (selectedRows.length === 0) return false;
    if (action.visible !== undefined) {
      const isVisible =
        typeof action.visible === 'function'
          ? action.visible(selectedRows)
          : action.visible;
      return !isVisible;
    }
    return false;
  }

  protected actionDisabledReason(
    action: DsAgGridBulkAction,
  ): string | undefined {
    if (!this.isActionDisabled(action)) return undefined;
    if (!action.disabledReason) return undefined;
    const selectedRows = this.tableService.selectedRows();
    return typeof action.disabledReason === 'function'
      ? action.disabledReason(selectedRows)
      : action.disabledReason;
  }

  onActionClick(action: DsAgGridBulkAction): void {
    if (this.isActionDisabled(action)) return;

    const hasSelection =
      this.tableService.selectedRows().length > 0 ||
      this.tableService.allPagesSelectedCount() != null;

    // If no rows are selected, just activate the bulk action (selection mode)
    // so the user can select records first
    if (!hasSelection) {
      this.tableService.setActiveBulkAction(action.id);
      return;
    }

    // Rows are selected — perform the action
    this.tableService.setActiveBulkAction(action.id);
    action.action?.(this.tableService.selectedRows());
    this.actionClick.emit({
      action,
      rows: this.tableService.selectedRows(),
    });
  }

  onCloseSelection(): void {
    this.tableService.clearSelection();
    this.closeSelection.emit();
  }

  onCustomizeColumns(): void {
    this.customizeColumnsClick.emit();
  }
}
