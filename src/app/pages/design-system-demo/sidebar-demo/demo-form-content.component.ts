import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DsInputComponent } from '@ds/input/input.component';
import { DsTextareaComponent } from '@ds/text-area/text-area.component';
import { DsButtonComponent } from '@ds/button/button.component';
import { DsSidebarService } from '@ds/sidebar';
import { DemoItemSelectionContentComponent } from './demo-item-selection-content.component';
import { faPlus } from '@fortawesome/pro-solid-svg-icons';

/**
 * Layer 1: A form with input fields and a "Choose Items" action.
 * Opens as the first sidebar/modal-sheet in the stack.
 */
@Component({
  selector: 'app-demo-form-content',
  standalone: true,
  imports: [
    FormsModule,
    DsInputComponent,
    DsTextareaComponent,
    DsButtonComponent,
  ],
  template: `
    <div class="flex flex-col gap-ds-xl">
      <app-ds-input
        label="Title"
        placeholder="Enter a title"
        [(ngModel)]="title"
      />

      <app-ds-input
        label="Category"
        placeholder="e.g. Curriculum, Extra-curricular"
        [(ngModel)]="category"
      />

      <app-ds-textarea
        label="Description"
        placeholder="Describe the entry in detail"
        [(ngModel)]="description"
        [rows]="4"
      />

      <app-ds-input
        label="Duration (minutes)"
        placeholder="e.g. 45"
        type="number"
        [(ngModel)]="duration"
      />

      <app-ds-input
        label="Instructor"
        placeholder="Enter instructor name"
        [(ngModel)]="instructor"
      />

      <app-ds-textarea
        label="Notes"
        placeholder="Any additional notes or instructions"
        [(ngModel)]="notes"
        [rows]="3"
      />

      <div class="flex flex-col gap-ds-sm">
        <label class="content-sm-default text-emphasis-mid">
          Items ({{ selectedItems().length }} selected)
        </label>
        <ds-button
          variant="tertiary"
          size="md"
          [fullWidth]="true"
          [iconStart]="faPlus"
          (click)="openItemSelection()"
        >
          {{
            selectedItems().length ? 'Change Selected Items' : 'Choose Items'
          }}
        </ds-button>
      </div>

      <app-ds-input
        label="Tags"
        placeholder="Comma-separated tags"
        [(ngModel)]="tags"
      />
    </div>
  `,
})
export class DemoFormContentComponent {
  private sidebarService = inject(DsSidebarService);

  closeModal!: (data?: unknown, role?: string) => void;

  title = '';
  category = '';
  description = '';
  duration = '';
  instructor = '';
  notes = '';
  tags = '';
  readonly selectedItems = signal<string[]>([]);

  protected readonly faPlus = faPlus;

  async openItemSelection(): Promise<void> {
    const ref = await this.sidebarService.open({
      component: DemoItemSelectionContentComponent,
      componentProps: {
        selectedItems: this.selectedItems(),
      },
      headerConfig: {
        title: 'Select Items',
        showCloseButton: true,
        showBackButton: true,
      },
      footerConfig: {
        primaryButton: { text: 'Done' },
        secondaryButton: { text: 'Back', variant: 'tertiary' },
      },
      mobilePresentation: 'modal-sheet',
      closeBehavior: 'all',
    });

    const result = await ref.onDismiss();
    if (result.role === 'confirm' && result.data) {
      this.selectedItems.set(result.data as string[]);
    }
  }

  onPrimaryClick(): void {
    this.closeModal(
      {
        title: this.title,
        category: this.category,
        description: this.description,
        duration: this.duration,
        instructor: this.instructor,
        notes: this.notes,
        tags: this.tags,
        items: this.selectedItems(),
      },
      'confirm',
    );
  }

  onSecondaryClick(): void {
    this.closeModal(undefined, 'cancel');
  }
}
