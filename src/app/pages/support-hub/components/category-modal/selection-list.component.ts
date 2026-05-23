import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { faCircleQuestion } from '@fortawesome/pro-regular-svg-icons';
import { DsIconComponent } from '@ds/icon/icon.component';

export interface SelectionListItem {
  readonly id: number;
  readonly title: string;
  readonly description: string;
  readonly icon: any;
}

@Component({
  selector: 'app-selection-list',
  standalone: true,
  templateUrl: './selection-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DsIconComponent],
})
export class SelectionListComponent {
  readonly fallbackIcon = faCircleQuestion;
  readonly items = input.required<SelectionListItem[]>();
  readonly selectedId = input<number | null>(null);
  readonly itemSelect = output<SelectionListItem>();

  protected handleItemClick(item: SelectionListItem): void {
    this.itemSelect.emit(item);
  }
}
