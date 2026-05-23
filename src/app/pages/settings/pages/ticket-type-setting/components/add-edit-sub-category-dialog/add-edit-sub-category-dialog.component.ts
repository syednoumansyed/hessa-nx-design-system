import { Component, OnInit, inject, Input, signal } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  DsFormRendererComponent,
  FormControlConfig,
} from '@shared/components/ds-form-control-generator/ds-form-renderer/ds-form-renderer.component';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { TicketTypeService } from '@shared/services/ticket-type.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import {
  SubCategoryDetail,
  SubCategoryRequest,
  SupportType,
} from '@shared/dto-transformation';
import { AccessLevel } from '@shared/enums';
import { DsModalContentComponent } from '@ds/modal/modal-wrapper.component';

@Component({
  selector: 'app-add-edit-sub-category-dialog',
  templateUrl: './add-edit-sub-category-dialog.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, DsFormRendererComponent],
})
export class AddEditSubCategoryDialogComponent
  implements OnInit, DsModalContentComponent
{
  // #region Inputs
  @Input() isEdit: boolean = false;
  @Input() category: SupportType;
  @Input() subCategory?: SubCategoryDetail;
  // #endregion

  // #region Modal Control (injected by modal wrapper)
  closeModal: (data?: unknown, role?: string) => void;
  // #endregion

  // #region Button State Signals (watched by modal wrapper)
  readonly primaryButtonDisabled = signal(true);
  readonly primaryButtonLoading = signal(false);
  // #endregion

  // #region Injectables
  private readonly nonNullableFormBuilder = inject(NonNullableFormBuilder);
  private readonly hesTranslateService = inject(HesTranslateService);
  private readonly ticketTypeService = inject(TicketTypeService);
  private readonly hesToaster = inject(HesToasterService);
  // #endregion

  // #region Protected Properties
  protected form = this.nonNullableFormBuilder.group({
    category: this.nonNullableFormBuilder.control('', Validators.required),
    enSubCategoryTitle: this.nonNullableFormBuilder.control(
      '',
      Validators.required,
    ),
    arSubCategoryTitle: this.nonNullableFormBuilder.control(
      '',
      Validators.required,
    ),
    visibleForGuardiansStudents: this.nonNullableFormBuilder.control(false),
    subCategoryIcon: this.nonNullableFormBuilder.control(
      '',
      Validators.required,
    ),
  });

  protected get formConfig(): FormControlConfig[] {
    return [
      {
        type: 'input',
        formControlName: 'category',
        label: this.hesTranslateService.t('support_ticket.category_req.label'),
        readonly: true,
        disabled: true,
      },
      {
        type: 'input',
        formControlName: 'enSubCategoryTitle',
        label: this.hesTranslateService.t(
          'support_tickets.sub_category_en.label',
        ),
        required: true,
        maxLength: 30,
        showCharacterCount: true,
        row: 'title',
      },
      {
        type: 'input',
        formControlName: 'arSubCategoryTitle',
        label: this.hesTranslateService.t(
          'support_tickets.sub_category_ar.label',
        ),
        required: true,
        maxLength: 30,
        showCharacterCount: true,
        row: 'title',
      },
      {
        type: 'checkbox',
        formControlName: 'visibleForGuardiansStudents',
        size: 'sm',
        selectValues: [
          {
            value: 'visibleForGuardiansStudents',
            displayedValue: this.hesTranslateService.t(
              'support.visibility.guardians_students',
            ),
          },
        ],
      },
      {
        type: 'icon-chooser',
        formControlName: 'subCategoryIcon',
        label: this.hesTranslateService.t('support.icon.select.label'),
        required: true,
      },
    ];
  }
  // #endregion

  // #region Lifecycle Hooks
  ngOnInit() {
    const isVisibleForGuardiansStudents = this.isEdit
      ? this.subCategory?.accessLevel === AccessLevel.PUBLIC
      : false;

    this.form.patchValue({
      category: this.category.displayName,
      enSubCategoryTitle: this.isEdit ? this.subCategory?.enName : '',
      arSubCategoryTitle: this.isEdit ? this.subCategory?.arName : '',
      visibleForGuardiansStudents: isVisibleForGuardiansStudents,
      subCategoryIcon: this.isEdit ? (this.subCategory?.icon ?? '') : '',
    });

    // Set initial button state and subscribe to form status changes
    this.primaryButtonDisabled.set(this.form.invalid);
    this.form.statusChanges.subscribe(() => {
      this.primaryButtonDisabled.set(this.form.invalid);
    });
  }
  // #endregion

  // #region Modal Event Handlers (called by modal wrapper)
  onPrimaryClick() {
    if (this.form.invalid) return;
    this.isEdit ? this.editSubCategory() : this.addSubCategory();
  }

  onSecondaryClick() {
    this.closeModal(undefined, 'cancel');
  }
  // #endregion

  // #region Private Methods
  private addSubCategory() {
    this.primaryButtonLoading.set(true);
    this.ticketTypeService
      .addSubCategory(this.createSubCategoryPayload())
      .subscribe({
        next: () => {
          this.hesToaster.success(
            this.hesTranslateService.t(
              'support_tickets.sub_category_added_successfully.txt',
            ),
          );
          this.closeModal(undefined, 'confirm');
        },
        error: (err) => {
          this.hesToaster.showBackendError(err);
          this.primaryButtonLoading.set(false);
        },
      });
  }

  private editSubCategory() {
    this.primaryButtonLoading.set(true);
    this.ticketTypeService
      .editSubCategory(this.subCategory!.id, this.createSubCategoryPayload())
      .subscribe({
        next: () => {
          this.hesToaster.success(
            this.hesTranslateService.t(
              `support_tickets.sub_category_updated_successfully.txt`,
            ),
          );
          this.closeModal(undefined, 'confirm');
        },
        error: (err) => {
          this.hesToaster.showBackendError(err);
          this.primaryButtonLoading.set(false);
        },
      });
  }

  private createSubCategoryPayload(): SubCategoryRequest {
    const {
      visibleForGuardiansStudents,
      enSubCategoryTitle,
      arSubCategoryTitle,
      subCategoryIcon,
    } = this.form.value;

    return {
      enName: enSubCategoryTitle!,
      arName: arSubCategoryTitle!,
      supportTypeId: this.category.id,
      accessLevel: visibleForGuardiansStudents
        ? AccessLevel.PUBLIC
        : AccessLevel.INTERNAL,
      icon: subCategoryIcon!,
    };
  }
  // #endregion
}
