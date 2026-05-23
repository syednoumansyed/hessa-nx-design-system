import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DsInputComponent } from '@ds/input/input.component';
import { DsTextareaComponent } from '@ds/text-area/text-area.component';

/**
 * Layer 3: Form to add a new item.
 * Opens as the third sidebar/modal-sheet in the stack.
 * Back button → returns to item selection.
 * Close button → dismisses entire stack (handled by closeBehavior: 'all').
 */
@Component({
  selector: 'app-demo-add-item-content',
  standalone: true,
  imports: [FormsModule, DsInputComponent, DsTextareaComponent],
  template: `
    <div class="flex flex-col gap-ds-xl">
      <app-ds-input
        label="Item Name"
        placeholder="Enter item name"
        [(ngModel)]="itemName"
      />

      <app-ds-textarea
        label="Notes (optional)"
        placeholder="Add any notes"
        [(ngModel)]="notes"
        [rows]="3"
      />
    </div>
  `,
})
export class DemoAddItemContentComponent {
  closeModal!: (data?: unknown, role?: string) => void;

  itemName = '';
  notes = '';

  onPrimaryClick(): void {
    if (this.itemName.trim()) {
      this.closeModal(this.itemName.trim(), 'confirm');
    }
  }

  onSecondaryClick(): void {
    this.closeModal(undefined, 'back');
  }

  onBackClick(): void {
    this.closeModal(undefined, 'back');
  }
}
