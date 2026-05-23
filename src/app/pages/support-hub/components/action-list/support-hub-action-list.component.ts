import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { DsIcon, DsIconComponent } from '@ds/icon/icon.component';
import { TranslocoPipe } from '@jsverse/transloco';

export interface SupportHubActionItem {
  readonly label?: string;
  readonly labelKey?: string;
  readonly icon: DsIcon;
  readonly iconBackgroundClass: string;
  readonly iconColorClass: string;
  readonly onSelect?: (item: SupportHubActionItem) => void;
}

@Component({
  selector: 'app-support-hub-action-list',
  standalone: true,
  imports: [NgClass, DsIconComponent, TranslocoPipe],
  templateUrl: './support-hub-action-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportHubActionListComponent {
  readonly items = input<SupportHubActionItem[]>([]);
  readonly itemSelected = output<SupportHubActionItem>();

  protected onItemClick(item: SupportHubActionItem): void {
    item.onSelect?.(item);
    this.itemSelected.emit(item);
  }
}
