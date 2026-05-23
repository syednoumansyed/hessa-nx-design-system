import {
  Component,
  computed,
  EventEmitter,
  Input,
  Output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoDirective } from '@jsverse/transloco';
import { CustomField } from '../../manage-category-dialog.types';
import { SearchBoxComponent } from '@ds/search-box/search-box.component';
import { CustomFieldCardComponent } from '../../components/custom-field-card';

@Component({
  selector: 'app-search-custom-fields',
  templateUrl: './search-custom-fields.component.html',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    CustomFieldCardComponent,
    SearchBoxComponent,
  ],
})
export class SearchCustomFieldsComponent {
  @Input() customFields: CustomField[] = [];
  @Input() selectedFieldIds: string[] = [];

  @Output() onSelect = new EventEmitter<CustomField>();
  @Output() onDeselect = new EventEmitter<CustomField>();
  @Output() onAddNew = new EventEmitter<void>();

  protected searchQuery = signal('');

  protected filteredFields = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) {
      return this.customFields;
    }
    return this.customFields.filter((f) =>
      f.labelDisplayName.toLowerCase().includes(query),
    );
  });

  protected onSearchChange(value: string): void {
    this.searchQuery.set(value);
  }

  protected isSelected(field: CustomField): boolean {
    return this.selectedFieldIds.includes(field.id as string);
  }

  protected toggleSelection(field: CustomField): void {
    if (this.isSelected(field)) {
      this.onDeselect.emit(field);
    } else {
      this.onSelect.emit(field);
    }
  }

  protected addNewField(): void {
    this.onAddNew.emit();
  }
}
