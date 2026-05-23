import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { DsButtonComponent, ButtonVariant } from '@ds/button/button.component';

type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Configuration for a single action button in the cell.
 */
export interface DsActionButtonConfig<T = unknown> {
  /** Button label (pre-translated string) */
  label: string;
  /** DS button variant — defaults to 'primary' */
  variant?: ButtonVariant;
  /**
   * Controls button visibility.
   * - `boolean`: static show/hide
   * - `(row) => boolean`: evaluated reactively (supports signal reads)
   */
  visible?: boolean | ((row: T) => boolean);
  /**
   * Controls disabled state.
   * - `boolean`: static disabled flag
   * - `(row) => boolean`: evaluated reactively (supports signal reads)
   */
  disabled?: boolean | ((row: T) => boolean);
  /** Called when the button is clicked */
  action: (row: T) => void;
}

/**
 * The custom fields you pass via `cellRendererParams` in your column def.
 * AG Grid merges its own runtime fields (data, node, etc.) separately.
 */
export interface DsActionCellConfig<T = unknown> {
  /** List of possible actions — only visible ones are rendered */
  actions: DsActionButtonConfig<T>[];
  /** Button size — defaults to 'sm' */
  size?: ButtonSize;
}

/**
 * Full params type received inside the cell renderer (custom fields + AG Grid fields).
 * @internal Use `DsActionCellConfig` for `cellRendererParams` type-checking.
 */
export interface DsActionCellParams<T = unknown>
  extends ICellRendererParams<T>, DsActionCellConfig<T> {}

/**
 * Generic AG Grid cell renderer that shows one or more ds-button actions
 * directly in the cell (no three-dot menu).
 *
 * Usage in column config:
 * ```ts
 * {
 *   field: 'actions',
 *   cellRenderer: DsAgGridActionButtonCellComponent,
 *   cellRendererParams: {
 *     size: 'sm',
 *     actions: [
 *       {
 *         label: t('global.edit.btn'),
 *         visible: (row) => rbacService.hasPermission(PERMISSION.UPDATE),
 *         disabled: (row) => !row.isEditable,
 *         action: (row) => navigate(row.id),
 *       },
 *     ],
 *   } satisfies DsActionCellConfig<MyRowType>,
 * }
 * ```
 */
@Component({
  selector: 'ds-ag-grid-action-button-cell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DsButtonComponent],
  template: `
    @for (item of resolvedActions(); track item.action.label) {
      <ds-button
        [size]="buttonSize()"
        [variant]="item.action.variant ?? 'primary'"
        [disabled]="item.disabled"
        (click)="onActionClick($event, item.action)"
      >
        {{ item.action.label }}
      </ds-button>
    }
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      height: 100%;
    }
  `,
})
export class DsAgGridActionButtonCellComponent implements ICellRendererAngularComp {
  private readonly params = signal<DsActionCellParams | undefined>(undefined);

  /** Button size — reactive, defaults to 'sm' */
  readonly buttonSize = computed<ButtonSize>(() => this.params()?.size ?? 'sm');

  /**
   * Resolved list of visible actions with their disabled state.
   * All signal reads inside `visible()` and `disabled()` callbacks are tracked —
   * so this recomputes automatically when any referenced signal changes.
   */
  readonly resolvedActions = computed<
    { action: DsActionButtonConfig; disabled: boolean }[]
  >(() => {
    const ps = this.params();
    if (!ps?.actions) return [];
    const row = ps.data as unknown;

    return ps.actions
      .filter((action) => {
        if (typeof action.visible === 'function') return action.visible(row);
        return action.visible !== false;
      })
      .map((action) => ({
        action,
        disabled:
          typeof action.disabled === 'function'
            ? action.disabled(row)
            : (action.disabled ?? false),
      }));
  });

  agInit(params: DsActionCellParams): void {
    this.params.set(params);
  }

  refresh(params: DsActionCellParams): boolean {
    this.params.set(params);
    return true;
  }

  onActionClick(event: Event, action: DsActionButtonConfig): void {
    event.stopPropagation();
    const row = this.params()?.data;
    if (row !== undefined) {
      action.action(row);
    }
  }
}
