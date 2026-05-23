import { Component, ChangeDetectionStrategy, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { DsResponsiveMenuComponent } from '@ds/popup/responsive-menu/responsive-menu.component';
import { PopupItem } from '@ds/popup/types/popup.interface';
import { faEllipsisVertical } from '@fortawesome/pro-solid-svg-icons';
import { DsIconComponent } from '@ds/icon/icon.component';

export interface DsAgGridActionsParams {
  actions?: PopupItem[] | ((data: any) => PopupItem[]);
  onActionClick?: (action: PopupItem, data: any) => void;
}

@Component({
  selector: 'ds-ag-grid-actions-cell',
  standalone: true,
  imports: [CommonModule, DsResponsiveMenuComponent, DsIconComponent],
  template: `
    @if (menuItems.length) {
      <ds-responsive-menu
        [items]="menuItems"
        [triggerClass]="
          'flex h-full w-full cursor-pointer items-center justify-center'
        "
        class="h-full w-full"
        (itemSelected)="onItemSelected($event)"
      >
        <app-ds-icon
          [icon]="menuIcon"
          [size]="'md'"
          class="text-icon-mid"
        ></app-ds-icon>
      </ds-responsive-menu>
    }
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      cursor: pointer;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DsAgGridActionsCellComponent implements ICellRendererAngularComp {
  menuItems: PopupItem[] = [];
  menuIcon = faEllipsisVertical;
  private params: ICellRendererParams & DsAgGridActionsParams = {} as any;

  agInit(params: ICellRendererParams & DsAgGridActionsParams): void {
    this.params = params;
    this.updateMenuItems();
  }

  refresh(params: ICellRendererParams & DsAgGridActionsParams): boolean {
    this.params = params;
    this.updateMenuItems();
    return true;
  }

  private updateMenuItems(): void {
    const { actions, data } = this.params;
    if (!actions) {
      this.menuItems = [];
      return;
    }

    const items = typeof actions === 'function' ? actions(data) : actions;

    // Filter by visible callback, then bind row data to each action
    this.menuItems = items
      .filter((item) => {
        if (typeof item.visible === 'function') return item.visible(data);
        return item.visible !== false;
      })
      .map((item) => ({
        ...item,
        action: item.action ? () => item.action!(data) : undefined,
      }));
  }

  onItemSelected(item: PopupItem): void {
    // Action is already called by responsive menu with bound data
    // Only emit for external handlers if needed
    const { onActionClick, data } = this.params;
    if (onActionClick) {
      onActionClick(item, data);
    }
  }
}
