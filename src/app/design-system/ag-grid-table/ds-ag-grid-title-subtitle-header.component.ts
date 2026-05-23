import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IHeaderAngularComp } from 'ag-grid-angular';
import { IHeaderParams, SortDirection } from 'ag-grid-community';
import { DsIconComponent } from '@ds/icon/icon.component';
import {
  faArrowDownArrowUp,
  faArrowUp,
  faArrowDown,
  faGripDotsVertical,
} from '@fortawesome/pro-solid-svg-icons';

export interface DsAgGridTitleSubtitleHeaderParams {
  title?: string;
  subtitle?: string;
}

@Component({
  selector: 'ds-ag-grid-title-subtitle-header',
  standalone: true,
  imports: [CommonModule, DsIconComponent],
  template: `
    <div class="ds-header-content flex flex-col gap-0.5 py-1">
      <div class="flex items-center gap-1">
        <span class="single-line-sm-high-emphasis text-emphasis-high">{{
          title
        }}</span>
        @if (enableSorting) {
          <app-ds-icon
            [icon]="currentSortIcon"
            [size]="'sm'"
            class="ds-ag-grid-sort-icon text-emphasis-mid"
            [class.is-sorted]="sortDirection"
            [class.text-emphasis-high]="sortDirection"
          ></app-ds-icon>
        }
      </div>
      @if (subtitle) {
        <span class="single-line-xs-mid-emphasis text-emphasis-mid">{{
          subtitle
        }}</span>
      }
    </div>
    @if (showDragHandle) {
      <div class="ds-ag-grid-drag-handle" (click)="$event.stopPropagation()">
        <app-ds-icon [icon]="gripIcon" size="md"></app-ds-icon>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: flex;
        align-items: center;
        position: relative;
        width: 100%;
        height: 100%;
      }
      .ds-header-content {
        padding-inline-end: 8px;
      }
      .ds-ag-grid-drag-handle {
        position: absolute;
        inset-inline-end: 2px;
        top: 50%;
        transform: translateY(-50%);
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        opacity: var(--ds-drag-handle-opacity, 0);
        transition: all 150ms ease;
        cursor: grab;
        color: var(--icon-mid-emphasis, #808489);
        border-radius: 50%;
        background-color: transparent;
      }
      .ds-ag-grid-drag-handle:hover {
        background-color: var(--surface-hover, rgba(19, 21, 23, 0.12));
      }
      .ds-ag-grid-drag-handle:active {
        cursor: grabbing;
        background-color: var(--surface-hover, rgba(19, 21, 23, 0.12));
      }
    `,
  ],
  host: {
    '(click)': 'onSortRequested($event)',
    '[class.cursor-pointer]': 'enableSorting',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DsAgGridTitleSubtitleHeaderComponent implements IHeaderAngularComp {
  private readonly cdr = inject(ChangeDetectorRef);

  title = '';
  subtitle = '';
  enableSorting = false;
  sortDirection: SortDirection = null;
  showDragHandle = false;
  gripIcon = faGripDotsVertical;

  /** Returns the appropriate sort icon based on current sort direction */
  get currentSortIcon() {
    if (this.sortDirection === 'asc') return faArrowUp;
    if (this.sortDirection === 'desc') return faArrowDown;
    return faArrowDownArrowUp;
  }

  private params!: IHeaderParams & DsAgGridTitleSubtitleHeaderParams;

  agInit(params: IHeaderParams & DsAgGridTitleSubtitleHeaderParams): void {
    this.params = params;
    this.title = params.title ?? params.displayName ?? '';
    this.subtitle = params.subtitle ?? '';
    this.enableSorting = params.enableSorting ?? false;
    this.showDragHandle = !params.column.getColDef().suppressMovable;

    if (this.enableSorting) {
      this.updateSortDirection();
      params.column.addEventListener('sortChanged', () => {
        this.updateSortDirection();
        this.cdr.markForCheck();
      });
    }
  }

  refresh(params: IHeaderParams & DsAgGridTitleSubtitleHeaderParams): boolean {
    this.params = params;
    this.title = params.title ?? params.displayName ?? '';
    this.subtitle = params.subtitle ?? '';
    this.showDragHandle = !params.column.getColDef().suppressMovable;
    this.updateSortDirection();
    return true;
  }

  onSortRequested(event: MouseEvent): void {
    if (!this.enableSorting) return;

    const order = this.getNextSortDirection();
    this.params.setSort(order, event.shiftKey);
  }

  private updateSortDirection(): void {
    this.sortDirection = this.params.column.getSort() ?? null;
  }

  private getNextSortDirection(): SortDirection {
    const current = this.sortDirection;
    if (current === null) return 'asc';
    if (current === 'asc') return 'desc';
    return null;
  }
}
