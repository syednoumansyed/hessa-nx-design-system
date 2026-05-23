import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CdkDragDrop,
  CdkDropList,
  CdkDrag,
  CdkDragHandle,
  CdkDragPlaceholder,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { DsCheckboxComponent } from '@ds/checkbox/checkbox.component';
import { DsIconComponent } from '@ds/icon/icon.component';
import { faGripDotsVertical } from '@fortawesome/pro-solid-svg-icons';
import { DsModalContentComponent } from '@ds/modal/modal-wrapper.component';

/**
 * Represents a column item for the customize columns modal
 */
export interface DsAgGridColumnItem {
  /** Unique column identifier (colId or field) */
  id: string;
  /** Display name for the column */
  name: string;
  /** Whether the column is currently visible */
  visible: boolean;
  /** Whether the column can be hidden (some columns like selection/actions can't be hidden) */
  canHide: boolean;
  /** Whether the column can be reordered */
  canReorder: boolean;
}

/**
 * Result returned when the customize columns modal is saved
 */
export interface DsAgGridCustomizeColumnsResult {
  /** Ordered list of column configurations */
  columns: DsAgGridColumnItem[];
}

@Component({
  selector: 'app-ds-ag-grid-customize-columns',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    CdkDragPlaceholder,
    DsCheckboxComponent,
    DsIconComponent,
  ],
  template: `
    <div class="flex w-full flex-col gap-3">
      @if (pinnedColumns().length > 0) {
        <div class="flex w-full flex-col gap-3">
          @for (column of pinnedColumns(); track column.id) {
            <div
              class="flex h-14 items-center gap-3 rounded-lg border-2 border-[var(--stroke-color-low-emphasis,#f0f0f1)] px-4 py-3"
            >
              <div
                class="flex h-6 w-6 flex-shrink-0 cursor-not-allowed items-center justify-center text-[var(--icon-low-emphasis,#b3b3b3)] opacity-50"
              >
                <app-ds-icon [icon]="gripIcon" size="lg" />
              </div>

              <app-ds-checkbox
                class="flex flex-shrink-0 items-center"
                size="sm"
                [ngModel]="column.visible"
                [disabled]="true"
                (ngModelChange)="onVisibilityToggle(column.id, $event)"
              />

              <span
                class="flex-1 truncate text-sm font-semibold leading-6 text-[var(--content-mid-emphasis,#808489)]"
              >
                {{ column.name }}
              </span>
            </div>
          }
        </div>
      }

      @if (reorderableColumns().length > 0) {
        <div
          class="flex w-full flex-col gap-3"
          cdkDropList
          (cdkDropListDropped)="onDrop($event)"
        >
          @for (column of reorderableColumns(); track column.id) {
            <div
              class="flex h-14 items-center gap-3 rounded-lg border-2 border-[var(--stroke-color-mid-emphasis,#e5e6e7)] bg-white px-4 py-3 transition-colors hover:bg-[var(--surface-secondary)]"
              cdkDrag
            >
              <div
                class="flex h-6 w-6 flex-shrink-0 cursor-grab items-center justify-center text-[var(--icon-mid-emphasis,#808489)] transition-colors active:cursor-grabbing"
                cdkDragHandle
              >
                <app-ds-icon [icon]="gripIcon" size="lg" />
              </div>

              <app-ds-checkbox
                class="flex flex-shrink-0 items-center"
                size="sm"
                [ngModel]="column.visible"
                [disabled]="!column.canHide"
                (ngModelChange)="onVisibilityToggle(column.id, $event)"
              />

              <span
                class="flex-1 truncate text-sm font-semibold leading-6"
                [class.text-[var(--content-high-emphasis,#131517)]="column.visible"
                [class.text-[var(--content-mid-emphasis)]="!column.visible"
              >
                {{ column.name }}
              </span>

              <ng-template cdkDragPlaceholder>
                <div
                  class="h-12 rounded-lg border-2 border-dashed border-[var(--stroke-color-mid-emphasis,#e5e6e7)] bg-[var(--surface-secondary)]"
                ></div>
              </ng-template>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    // CDK Drag animations
    .cdk-drag-preview {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      border-radius: var(--ds-corner-radius-md, 8px);
    }

    .cdk-drag-animating {
      transition: transform 200ms ease;
    }

    .cdk-drop-list-dragging .cdk-drag:not(.cdk-drag-placeholder) {
      transition: transform 200ms ease;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DsAgGridCustomizeColumnsComponent implements DsModalContentComponent {
  /** Initial columns configuration passed from the table */
  readonly columns = input.required<DsAgGridColumnItem[]>();

  /** Internal state for pinned columns (not reorderable) */
  protected readonly pinnedColumnsState = signal<DsAgGridColumnItem[]>([]);

  /** Internal state for reorderable columns */
  protected readonly reorderableColumnsState = signal<DsAgGridColumnItem[]>([]);

  /** Icon for drag handle */
  protected readonly gripIcon = faGripDotsVertical;

  /** Close modal function - injected by modal wrapper */
  closeModal?: (data?: unknown, role?: string) => void;

  /** Computed: pinned columns (always at top, not reorderable) */
  protected readonly pinnedColumns = computed(() => this.pinnedColumnsState());

  /** Computed: reorderable columns */
  protected readonly reorderableColumns = computed(() =>
    this.reorderableColumnsState(),
  );

  /** Combined columns state for saving */
  protected readonly columnsState = computed(() => [
    ...this.pinnedColumnsState(),
    ...this.reorderableColumnsState(),
  ]);

  /** Track if any changes were made */
  protected readonly hasChanges = computed(() => {
    const current = this.columnsState();
    const original = this.columns();
    if (current.length !== original.length) return true;

    for (let i = 0; i < current.length; i++) {
      if (
        current[i].id !== original[i].id ||
        current[i].visible !== original[i].visible
      ) {
        return true;
      }
    }
    return false;
  });

  constructor() {
    // Initialize columnsState when columns input changes
    // Using a computed effect pattern
  }

  ngOnInit(): void {
    // Split columns into pinned and reorderable
    const allColumns = this.columns().map((col) => ({ ...col }));
    const pinned = allColumns.filter((col) => !col.canReorder);
    const reorderable = allColumns.filter((col) => col.canReorder);

    this.pinnedColumnsState.set(pinned);
    this.reorderableColumnsState.set(reorderable);
  }

  /**
   * Called when primary button (Save) is clicked
   */
  onPrimaryClick(): void {
    const result: DsAgGridCustomizeColumnsResult = {
      columns: this.columnsState(),
    };
    this.closeModal?.(result, 'confirm');
  }

  /**
   * Called when secondary button (Cancel) is clicked
   */
  onSecondaryClick(): void {
    this.closeModal?.(undefined, 'cancel');
  }

  /**
   * Handle drag and drop reordering (only for reorderable columns)
   */
  protected onDrop(event: CdkDragDrop<DsAgGridColumnItem[]>): void {
    const current = [...this.reorderableColumnsState()];
    moveItemInArray(current, event.previousIndex, event.currentIndex);
    this.reorderableColumnsState.set(current);
  }

  /**
   * Toggle column visibility
   */
  protected onVisibilityToggle(columnId: string, visible: boolean): void {
    // Check if it's a pinned column
    const pinnedIndex = this.pinnedColumnsState().findIndex(
      (col) => col.id === columnId,
    );
    if (pinnedIndex !== -1) {
      const updated = this.pinnedColumnsState().map((col) =>
        col.id === columnId ? { ...col, visible } : col,
      );
      this.pinnedColumnsState.set(updated);
      return;
    }

    // Otherwise it's a reorderable column
    const updated = this.reorderableColumnsState().map((col) =>
      col.id === columnId ? { ...col, visible } : col,
    );
    this.reorderableColumnsState.set(updated);
  }
}
