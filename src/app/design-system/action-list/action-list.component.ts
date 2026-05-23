import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DsActionListItemComponent } from '@ds/action-list/action-list-item.component';
import {
  DsActionListItemConfig,
  DsActionListConfig,
} from '@ds/action-list/action-list.interface';
import { DsObjId } from '@ds/common.types';
import { DsTranslatePipe } from '@ds/i18n/ds-translate.pipe';
import { DsIconComponent } from '@ds/icon/icon.component';
import { faCircleXmark } from '@fortawesome/pro-solid-svg-icons';

@Component({
  standalone: true,
  imports: [DsActionListItemComponent, DsIconComponent, DsTranslatePipe],
  selector: 'ds-action-list',
  template: `
    <div class="flex h-full flex-col pt-ds-xl">
      <div class="mb-ds-xl flex justify-between px-ds-xl ">
        <div class="single-line-lg-high-emphasis  text-emphasis-high">
          {{ config.title | dsTranslate }}
        </div>
        @if (config.showCloseButton) {
          <div class="hidden text-[#B3B3B3] md:block" (click)="onClose()">
            <app-ds-icon [icon]="closeIcon" />
          </div>
        }
      </div>
      <div
        class="grow-1 flex h-full flex-col gap-ds-md overflow-auto px-ds-xl pb-ds-xl"
      >
        @for (
          item of config.items;
          track trackByItemId($index, item);
          let i = $index
        ) {
          <ds-action-list-item
            [config]="item"
            (click)="triggerAction(item, i)"
            [active]="config.activeItemIndex === i"
            class="cursor-pointer"
          />
        }
      </div>
    </div>
  `,
})
export class DsActionListComponent {
  @Input() config: DsActionListConfig;
  @Input() closeCb: () => void = () => {};

  protected readonly closeIcon = faCircleXmark;

  trackByItemId = (index: number, item: DsActionListItemConfig): DsObjId => {
    return item.id || `${index}-${item.title}`;
  };

  triggerAction(item: DsActionListItemConfig, index: number): void {
    // Execute the callback if provided
    const onItemAction = this.config.onItemAction;

    if (onItemAction) {
      onItemAction(item, index);
    }

    // Emit the action event
    this.closeCb();
  }

  onClose(): void {
    this.closeCb();
  }
}
