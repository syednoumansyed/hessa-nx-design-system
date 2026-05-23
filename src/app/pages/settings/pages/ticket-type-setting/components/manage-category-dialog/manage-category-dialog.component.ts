import {
  Component,
  computed,
  inject,
  Input,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TicketTypeService } from '@shared/services/ticket-type.service';
import {
  CreateSupportTypePayload,
  NewCustomFieldPayload,
} from '@shared/dto-transformation';
import { AccessLevel } from '@shared/enums';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { FeedbackService } from '@shared/services/feedback.service';
import { CustomFieldService } from '../../data-access/custom-field.service';
import { ObjId } from '@shared/interfaces/common.interface';
import {
  CustomField,
  ManageCategoryView,
} from './manage-category-dialog.types';
import { CategoryFormComponent } from './views/category-form/category-form.component';
import { SearchCustomFieldsComponent } from './views/search-custom-fields/search-custom-fields.component';
import { AddCustomFieldComponent } from './views/add-custom-field/add-custom-field.component';
import { DsModalContentComponent } from '@ds/modal/modal-wrapper.component';
import {
  DsModalHeaderConfig,
  DsModalFooterConfig,
} from '@ds/modal/modal.component';

@Component({
  selector: 'app-manage-category-dialog',
  templateUrl: './manage-category-dialog.component.html',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CategoryFormComponent,
    SearchCustomFieldsComponent,
    AddCustomFieldComponent,
  ],
})
export class ManageCategoryDialogComponent
  implements OnInit, DsModalContentComponent
{
  // #region Inputs
  @Input() categoryId?: ObjId;
  // #endregion

  // #region Modal Control (injected by modal wrapper)
  closeModal!: (data?: unknown, role?: string) => void;
  // #endregion

  // #region Injectables
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly ticketTypeService = inject(TicketTypeService);
  private readonly customFieldService = inject(CustomFieldService);
  private readonly hesToaster = inject(HesToasterService);
  private readonly t = inject(HesTranslateService);
  private readonly feedbackService = inject(FeedbackService);
  // #endregion

  // #region State
  protected currentView = signal<ManageCategoryView>('category');
  protected isLoading = signal(false);
  protected apiCustomFields = signal<CustomField[]>([]);
  protected draftCustomFields = signal<CustomField[]>([]);
  protected selectedCustomFields = signal<CustomField[]>([]);
  protected categoryDisplayName = signal<string>('');
  protected isEdit = computed(() => !!this.categoryId);

  // Combined list: drafts first, then API fields
  protected allCustomFields = computed(() => [
    ...this.draftCustomFields(),
    ...this.apiCustomFields(),
  ]);

  protected hasExistingCustomFields = computed(
    () => this.allCustomFields().length > 0,
  );
  // #endregion

  // #region Button State Signals (watched by modal wrapper)
  readonly primaryButtonDisabled = signal(true);
  readonly primaryButtonLoading = signal(false);
  // #endregion

  // #region Dynamic Header/Footer Config (watched by modal wrapper)
  readonly headerConfig = computed<DsModalHeaderConfig | undefined>(() => {
    const view = this.currentView();

    switch (view) {
      case 'category':
        return {
          title: this.isEdit()
            ? this.t.t('support_tickets.edit_category.title')
            : this.t.t('support_tickets.add_category.btn'),
          showCloseButton: true,
        };
      case 'search-fields':
        return {
          title: this.t.t('support.custom_field.add.title'),
          showBackButton: true,
          showCloseButton: true,
        };
      case 'add-field':
        return {
          title: this.t.t('support.custom_field.add.title'),
          showBackButton: true,
          showCloseButton: true,
        };
      default:
        return undefined;
    }
  });

  readonly footerConfig = computed<DsModalFooterConfig | undefined>(() => {
    const view = this.currentView();

    switch (view) {
      case 'category':
        return {
          primaryButton: { text: this.t.t('global.save.btn') },
          secondaryButton: { text: this.t.t('global.cancel.btn') },
          buttonSize: 'lg',
        };
      case 'search-fields':
        // No footer for search view
        return undefined;
      case 'add-field':
        return {
          primaryButton: { text: this.t.t('global.save.btn') },
          secondaryButton: { text: this.t.t('global.cancel.btn') },
          buttonSize: 'lg',
        };
      default:
        return undefined;
    }
  });
  // #endregion

  // #region Form
  protected form = this.fb.group({
    enTitle: this.fb.control('', [
      Validators.required,
      Validators.maxLength(30),
    ]),
    arTitle: this.fb.control('', [
      Validators.required,
      Validators.maxLength(30),
    ]),
    enDescription: this.fb.control('', Validators.maxLength(60)),
    arDescription: this.fb.control('', Validators.maxLength(60)),
    categoryIcon: this.fb.control('', Validators.required),
    visibility: this.fb.control<string[]>(['isForTicket'], Validators.required),
    visibleForGuardiansStudents: this.fb.control(false),
    allowPrivateRequest: this.fb.control(false),
  });

  // Add custom field form (for add-field view)
  protected addFieldForm = this.fb.group({
    enLabel: this.fb.control('', [
      Validators.required,
      Validators.maxLength(30),
    ]),
    arLabel: this.fb.control('', [
      Validators.required,
      Validators.maxLength(30),
    ]),
    enDescription: this.fb.control('', Validators.maxLength(60)),
    arDescription: this.fb.control('', Validators.maxLength(60)),
    isRequired: this.fb.control(false),
  });
  // #endregion

  // #region Computed
  protected selectedFieldIds(): string[] {
    return this.selectedCustomFields().map((f) => f.id as string);
  }
  // #endregion

  // #region Lifecycle
  ngOnInit(): void {
    if (this.isEdit()) {
      this.loadDataForEdit();
    } else {
      this.loadCustomFields();
    }

    // Set initial button state and subscribe to form status changes
    this.updatePrimaryButtonState();
    this.form.statusChanges.subscribe(() => {
      this.updatePrimaryButtonState();
    });
    this.addFieldForm.statusChanges.subscribe(() => {
      this.updatePrimaryButtonState();
    });
  }
  // #endregion

  // #region Button State Management
  private updatePrimaryButtonState(): void {
    const view = this.currentView();
    switch (view) {
      case 'category':
        this.primaryButtonDisabled.set(this.form.invalid);
        break;
      case 'add-field':
        this.primaryButtonDisabled.set(this.addFieldForm.invalid);
        break;
      default:
        this.primaryButtonDisabled.set(false);
    }
  }
  // #endregion

  // #region Modal Event Handlers (called by modal wrapper)
  onPrimaryClick(): void {
    const view = this.currentView();
    switch (view) {
      case 'category':
        this.onSave();
        break;
      case 'add-field':
        this.saveCustomField();
        break;
    }
  }

  onSecondaryClick(): void {
    const view = this.currentView();
    switch (view) {
      case 'category':
        this.closeModal(undefined, 'cancel');
        break;
      case 'add-field':
        this.goBackFromAddField();
        break;
    }
  }

  onBackClick(): void {
    const view = this.currentView();
    switch (view) {
      case 'search-fields':
        this.goBack();
        break;
      case 'add-field':
        this.goBackFromAddField();
        break;
    }
  }

  onCloseClick(): void {
    const view = this.currentView();
    switch (view) {
      case 'category':
        // On main view, close the dialog
        this.closeModal(undefined, 'close');
        break;
      case 'search-fields':
        // On nested views, navigate back instead of closing
        this.goBack();
        break;
      case 'add-field':
        this.goBackFromAddField();
        break;
    }
  }
  // #endregion

  // #region Data Loading
  private loadCustomFields(): void {
    this.customFieldService.fetchCustomFields().subscribe({
      next: (fields) => {
        this.apiCustomFields.set(fields);
      },
    });
  }

  private loadDataForEdit(): void {
    this.isLoading.set(true);

    // Fetch category data first, as it's essential
    this.ticketTypeService.fetchCategory(this.categoryId!).subscribe({
      next: (category) => {
        // Set category display name
        this.categoryDisplayName.set(category.displayName);

        // Build visibility array
        const visibility: string[] = [];
        if (category.isForTicket) visibility.push('isForTicket');
        if (category.isForArticle) visibility.push('isForArticle');

        // Populate form with category data
        this.form.patchValue({
          enTitle: category.enName,
          arTitle: category.arName,
          enDescription: category.enDescription ?? '',
          arDescription: category.arDescription ?? '',
          categoryIcon: category.icon,
          visibility,
          visibleForGuardiansStudents:
            category.accessLevel === AccessLevel.PUBLIC,
          allowPrivateRequest: category.allowPrivateRequest,
        });

        // Fetch custom fields to populate selectedCustomFields and apiCustomFields
        this.customFieldService.fetchCustomFields().subscribe({
          next: (customFields) => {
            this.apiCustomFields.set(customFields);

            // Map category's custom fields and enrich with linkedCategories from API data
            const linkedCustomFields: CustomField[] = (
              category.customFields ?? []
            ).map((cf) => {
              // Find the full custom field data from API to get linkedCategories
              const apiField = customFields.find((f) => f.id === cf.id);
              return {
                id: cf.id,
                labelDisplayName: cf.labelDisplayName,
                descriptionDisplayName: cf.descriptionDisplayName,
                isRequired: cf.isRequired,
                linkedCategories: apiField?.linkedCategories ?? [],
                isDraft: false,
                enLabel: cf.enLabel,
                arLabel: cf.arLabel,
                enDescription: cf.enDescription ?? undefined,
                arDescription: cf.arDescription ?? undefined,
              };
            });
            this.selectedCustomFields.set(linkedCustomFields);
          },
          error: () => {
            // If custom fields fetch fails, just set empty arrays
            // Don't show error toast for missing custom fields in fresh system
            this.apiCustomFields.set([]);
            this.selectedCustomFields.set([]);
          },
          complete: () => {
            this.isLoading.set(false);
          },
        });
      },
      error: (err) => {
        this.hesToaster.showBackendError(err);
        this.isLoading.set(false);
      },
    });
  }
  // #endregion

  // #region Navigation
  protected navigateTo(view: ManageCategoryView): void {
    this.currentView.set(view);
    this.updatePrimaryButtonState();
  }

  protected goBack(): void {
    // From add-field or search-fields, go back to category form
    this.currentView.set('category');
    this.updatePrimaryButtonState();
  }

  protected goBackFromAddField(): void {
    // From add-field, go back to category
    this.currentView.set('category');
    this.updatePrimaryButtonState();
  }
  // #endregion

  // #region Custom Field Actions
  protected selectCustomField(field: CustomField): void {
    const current = this.selectedCustomFields();
    if (!current.find((f) => f.id === field.id)) {
      this.selectedCustomFields.set([...current, field]);
    }
  }

  protected deselectCustomField(field: CustomField): void {
    const current = this.selectedCustomFields();
    this.selectedCustomFields.set(current.filter((f) => f.id !== field.id));
  }

  protected removeCustomField(field: CustomField): void {
    const isLinkedField = this.isEdit() && !field.isDraft;

    if (isLinkedField) {
      // Already linked field in edit mode - show detailed confirmation
      this.feedbackService.openFeedbackModal(
        {
          type: 'error',
          modalTitle: this.t.t(
            'support_tickets.remove_custom_field_from_category.title',
            {
              fieldName: field.labelDisplayName,
              categoryName: this.categoryDisplayName(),
            },
          ),
          modalMessage: this.t.t(
            'support_tickets.remove_custom_field_from_category.message',
          ),
          primaryBtnStr: this.t.t('global.remove.btn'),
          secondaryBtnStr: this.t.t('global.cancel.btn'),
        },
        () => {
          this.deselectCustomField(field);
        },
      );
    } else {
      // Draft field or add mode - show simple confirmation
      this.feedbackService.openFeedbackModal(
        {
          type: 'error',
          modalTitle: this.t.t('support_tickets.remove_custom_field.title', {
            fieldName: field.labelDisplayName,
          }),
          primaryBtnStr: this.t.t('global.remove.btn'),
          secondaryBtnStr: this.t.t('global.cancel.btn'),
        },
        () => {
          this.deselectCustomField(field);
        },
      );
    }
  }

  protected onCustomFieldCreated(field: CustomField): void {
    // Add draft field to draft list
    if (field.isDraft) {
      this.draftCustomFields.update((fields) => [...fields, field]);
    } else {
      this.apiCustomFields.update((fields) => [...fields, field]);
    }

    // Auto-select the newly created field
    this.selectCustomField(field);

    // Go back to category view (not search-fields, as per original code's goBackFromAddField)
    this.currentView.set('category');
    this.updatePrimaryButtonState();
  }

  private saveCustomField(): void {
    if (this.addFieldForm.invalid) {
      this.addFieldForm.markAllAsTouched();
      return;
    }

    const isArabic = this.t.getActiveLang() === 'ar';

    // Create a draft custom field locally (no API call)
    const draftField: CustomField = {
      id: `draft-${crypto.randomUUID()}`,
      enLabel: this.addFieldForm.controls.enLabel.value,
      arLabel: this.addFieldForm.controls.arLabel.value,
      enDescription: this.addFieldForm.controls.enDescription.value,
      arDescription: this.addFieldForm.controls.arDescription.value,
      labelDisplayName: isArabic
        ? this.addFieldForm.controls.arLabel.value
        : this.addFieldForm.controls.enLabel.value,
      descriptionDisplayName: isArabic
        ? this.addFieldForm.controls.arDescription.value
        : this.addFieldForm.controls.enDescription.value,
      isRequired: this.addFieldForm.controls.isRequired.value,
      linkedCategories: [],
      isDraft: true,
    };

    this.onCustomFieldCreated(draftField);

    // Reset the add field form for next use
    this.addFieldForm.reset();
  }
  // #endregion

  // #region Save Actions
  protected onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isEdit() ? this.editCategory() : this.addCategory();
  }

  private addCategory(): void {
    this.primaryButtonLoading.set(true);
    this.ticketTypeService.addCategory(this.buildPayload()).subscribe({
      next: () => {
        this.hesToaster.success(
          this.t.t('support_tickets.category_added_successfully.txt'),
        );
        this.closeModal(undefined, 'confirm');
      },
      error: (err) => {
        this.hesToaster.showBackendError(err);
        this.primaryButtonLoading.set(false);
      },
    });
  }

  private editCategory(): void {
    this.primaryButtonLoading.set(true);
    this.ticketTypeService
      .editCategory(this.categoryId!, this.buildPayload())
      .subscribe({
        next: () => {
          this.hesToaster.success(
            this.t.t('support_tickets.category_updated_successfully.txt'),
          );
          this.closeModal(undefined, 'confirm');
        },
        error: (err) => {
          this.hesToaster.showBackendError(err);
          this.primaryButtonLoading.set(false);
        },
      });
  }

  private buildPayload(): CreateSupportTypePayload {
    const visibility = this.form.value.visibility ?? [];
    const selectedFields = this.selectedCustomFields();

    // Separate draft fields (new) from existing API fields
    const existingFields = selectedFields.filter((f) => !f.isDraft);
    const draftFields = selectedFields.filter((f) => f.isDraft);

    // Map draft fields to NewCustomFieldPayload
    const newCustomFields: NewCustomFieldPayload[] = draftFields.map((f) => ({
      arLabel: f.arLabel ?? '',
      enLabel: f.enLabel ?? '',
      arDescription: f.arDescription ?? null,
      enDescription: f.enDescription ?? null,
      required: f.isRequired,
    }));

    // Map existing fields to IDs (numbers)
    const customFieldIds: number[] = existingFields
      .map((f) => f.id)
      .filter((id): id is number => typeof id === 'number');

    return {
      enName: this.form.value.enTitle ?? '',
      arName: this.form.value.arTitle ?? '',
      enDescription: this.form.value.enDescription || null,
      arDescription: this.form.value.arDescription || null,
      icon: this.form.value.categoryIcon ?? '',
      isForTicket: visibility.includes('isForTicket'),
      isForArticle: visibility.includes('isForArticle'),
      accessLevel: this.form.value.visibleForGuardiansStudents
        ? AccessLevel.PUBLIC
        : AccessLevel.INTERNAL,
      allowPrivateRequest: this.form.value.allowPrivateRequest ?? false,
      // In edit mode, send empty array to unlink all fields; in add mode, omit the key
      customFieldIds:
        customFieldIds.length > 0
          ? customFieldIds
          : this.isEdit()
            ? []
            : undefined,
      newCustomFields: newCustomFields.length > 0 ? newCustomFields : undefined,
    };
  }
  // #endregion
}
