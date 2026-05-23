import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';
import {
  DsFormRendererComponent,
  FormControlConfig,
} from '@shared/components/ds-form-control-generator/ds-form-renderer/ds-form-renderer.component';
import {
  CustomField,
  ManageCategoryView,
} from '../../manage-category-dialog.types';
import { DsButtonComponent } from '@ds/button/button.component';
import { DsInputComponent } from '@ds/input/input.component';
import { faPlus, faShieldCheck } from '@fortawesome/pro-solid-svg-icons';
import { faMagnifyingGlass } from '@fortawesome/pro-light-svg-icons';
import { CustomFieldCardComponent } from '../../components/custom-field-card';
import { HesTranslateService } from '@shared/services/hes-translate.service';

@Component({
  selector: 'app-category-form',
  templateUrl: './category-form.component.html',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslocoDirective,
    DsFormRendererComponent,
    DsButtonComponent,
    DsInputComponent,
    CustomFieldCardComponent,
  ],
})
export class CategoryFormComponent {
  private readonly t = inject(HesTranslateService);

  @Input({ required: true }) form!: FormGroup;
  @Input() isEdit = false;
  @Input() selectedCustomFields: CustomField[] = [];
  @Input() hasExistingCustomFields = false;

  @Output() onNavigate = new EventEmitter<ManageCategoryView>();
  @Output() onRemoveCustomField = new EventEmitter<CustomField>();

  protected readonly faPlus = faPlus;
  protected readonly faMagnifyingGlass = faMagnifyingGlass;

  protected get formConfig(): FormControlConfig[] {
    return [
      {
        type: 'input',
        formControlName: 'enTitle',
        label: this.t.t('support.category.title.en'),
        required: true,
        maxLength: 30,
        showCharacterCount: true,
        row: 'title',
      },
      {
        type: 'input',
        formControlName: 'arTitle',
        label: this.t.t('support.category.title.ar'),
        required: true,
        maxLength: 30,
        showCharacterCount: true,
        row: 'title',
      },
      {
        type: 'input',
        formControlName: 'enDescription',
        label: this.t.t('support.category.description.en'),
        maxLength: 60,
        showCharacterCount: true,
        localizedPair: 'arDescription',
      },
      {
        type: 'input',
        formControlName: 'arDescription',
        label: this.t.t('support.category.description.ar'),
        maxLength: 60,
        showCharacterCount: true,
        localizedPair: 'enDescription',
      },
      {
        type: 'icon-chooser',
        formControlName: 'categoryIcon',
        label: this.t.t('support.icon.select.label'),
        required: true,
      },
      {
        type: 'checkbox',
        formControlName: 'allowPrivateRequest',
        size: 'sm',
        selectValues: [
          {
            value: 'allowPrivateRequest',
            displayedValue: this.t.t('support.request.private.allow'),
            icon: { name: faShieldCheck, placement: 'end' },
            helperText: this.t.t('support.request.private.helper'),
          },
        ],
      },
      {
        type: 'checkbox',
        formControlName: 'visibility',
        label: this.t.t('global.visibility.title'),
        required: true,
        size: 'sm',
        selectValues: [
          {
            value: 'isForTicket',
            displayedValue: this.t.t(
              'support_ticket.show_in_support_tickets.title',
            ),
          },
          {
            value: 'isForArticle',
            displayedValue: this.t.t(
              'support_ticket.show_in_help_center.title',
            ),
          },
        ],
      },
      {
        type: 'checkbox',
        formControlName: 'visibleForGuardiansStudents',
        size: 'sm',
        selectValues: [
          {
            value: 'visibleForGuardiansStudents',
            displayedValue: this.t.t('support.visibility.guardians_students'),
          },
        ],
      },
    ];
  }

  protected goToSearchFields(): void {
    this.onNavigate.emit('search-fields');
  }

  protected goToAddField(): void {
    this.onNavigate.emit('add-field');
  }

  protected removeCustomField(field: CustomField): void {
    this.onRemoveCustomField.emit(field);
  }
}
