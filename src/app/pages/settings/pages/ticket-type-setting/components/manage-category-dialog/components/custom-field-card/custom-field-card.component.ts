import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoDirective } from '@jsverse/transloco';
import { DsButtonComponent } from '@ds/button/button.component';
import { faCheck, faXmark } from '@fortawesome/pro-solid-svg-icons';
import { CustomField } from '../../manage-category-dialog.types';

export type CustomFieldCardMode = 'select' | 'remove';

@Component({
  selector: 'app-custom-field-card',
  templateUrl: './custom-field-card.component.html',
  standalone: true,
  imports: [CommonModule, TranslocoDirective, DsButtonComponent],
})
export class CustomFieldCardComponent {
  @Input({ required: true }) field!: CustomField;
  @Input() mode: CustomFieldCardMode = 'select';
  @Input() isSelected = false;

  @Output() select = new EventEmitter<CustomField>();
  @Output() remove = new EventEmitter<CustomField>();

  protected readonly faCheck = faCheck;
  protected readonly faXmark = faXmark;

  protected onActionClick(): void {
    if (this.mode === 'select') {
      this.select.emit(this.field);
    } else {
      this.remove.emit(this.field);
    }
  }
}
