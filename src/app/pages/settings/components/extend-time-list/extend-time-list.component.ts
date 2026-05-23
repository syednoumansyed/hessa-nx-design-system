import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ExtendTimeListItemComponent } from '../extend-time-list-item/extend-time-list-item.component';
import { CommonModule } from '@angular/common';
import { ExtendedEndTime } from '@pages/settings/data-access/attendance-end-time.interface';

@Component({
  selector: 'app-extend-time-list',
  templateUrl: './extend-time-list.component.html',
  standalone: true,
  imports: [ExtendTimeListItemComponent, CommonModule],
})
export class ExtendTimeListComponent {
  // #region Inputs and Outputs
  @Input() items: ExtendedEndTime[] = [];
  @Output() itemDeleted = new EventEmitter<void>();
  // #endregion

  // #region Event Handlers
  onItemDeleted(): void {
    this.itemDeleted.emit();
  }
  // #endregion
}
