import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  DsFormRendererComponent,
  FormControlConfig,
} from '@shared/components/ds-form-control-generator/ds-form-renderer/ds-form-renderer.component';
import { DsModalContentComponent } from '@ds/modal/modal-wrapper.component';
import { LearningOutcomesService } from '../../data-access/learning-outcomes.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import {
  AddUnitPayload,
  LearningOutcomeUnit,
} from '../../data-access/learning-outcomes.interface';
import { HesTranslateService } from '@shared/services/hes-translate.service';

export interface ManageUnitModalInput {
  subjectId: number;
  levelId: number;
  subjectName: string;
  /** If provided, modal opens in edit mode */
  unit?: LearningOutcomeUnit;
  /** Original names for edit mode (from API response with both languages) */
  unitEnName?: string;
  unitArName?: string;
}

@Component({
  selector: 'app-manage-unit-modal',
  templateUrl: './manage-unit-modal.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DsFormRendererComponent],
})
export class ManageUnitModalComponent
  implements OnInit, DsModalContentComponent
{
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly learningOutcomesService = inject(LearningOutcomesService);
  private readonly hesToaster = inject(HesToasterService);
  private readonly hesTranslateService = inject(HesTranslateService);

  // Inputs from modal
  @Input() subjectId!: number;
  @Input() levelId!: number;
  @Input() subjectName = '';
  @Input() unit?: LearningOutcomeUnit;
  @Input() unitEnName?: string;
  @Input() unitArName?: string;

  // Modal control (injected by modal wrapper)
  closeModal!: (data?: unknown, role?: string) => void;

  // Button state signals (watched by modal wrapper)
  readonly primaryButtonDisabled = signal(true);
  readonly primaryButtonLoading = signal(false);

  // Mode
  get isEditMode(): boolean {
    return !!this.unit;
  }

  // Form
  form = this.fb.group({
    enName: this.fb.control('', Validators.required),
    arName: this.fb.control('', Validators.required),
  });

  // Form config for renderer
  protected get formConfig(): FormControlConfig[] {
    return [
      {
        type: 'input',
        formControlName: 'enName',
        label: this.hesTranslateService.t(
          'learning_outcome.unit_name_en.label',
        ),
        placeholder: this.hesTranslateService.t(
          'learning_outcome.unit_name_en.placeholder',
        ),
        required: true,
      },
      {
        type: 'input',
        formControlName: 'arName',
        label: this.hesTranslateService.t(
          'learning_outcome.unit_name_ar.label',
        ),
        placeholder: this.hesTranslateService.t(
          'learning_outcome.unit_name_en.placeholder',
        ),
        required: true,
      },
    ];
  }

  ngOnInit() {
    // Pre-fill form if in edit mode
    if (this.isEditMode) {
      this.form.patchValue({
        enName: this.unitEnName ?? '',
        arName: this.unitArName ?? '',
      });
    }

    // Set initial button state and subscribe to form status changes
    this.primaryButtonDisabled.set(this.form.invalid);
    this.form.statusChanges.subscribe(() => {
      this.primaryButtonDisabled.set(this.form.invalid);
    });
  }

  // Called by modal wrapper on primary button click
  onPrimaryClick() {
    if (this.form.invalid) return;

    this.primaryButtonLoading.set(true);

    if (this.isEditMode) {
      this.updateUnit();
    } else {
      this.createUnit();
    }
  }

  private createUnit() {
    const payload: AddUnitPayload = {
      enName: this.form.value.enName!,
      arName: this.form.value.arName!,
      subjectId: this.subjectId,
      levelId: this.levelId,
    };

    this.learningOutcomesService.createUnit(payload).subscribe({
      next: (unit) => {
        this.hesToaster.success(
          this.hesTranslateService.t('learning_outcome.unit_added.msg'),
        );
        this.closeModal({ unit, action: 'create' }, 'confirm');
      },
      error: (err) => {
        this.hesToaster.showBackendError(err);
        this.primaryButtonLoading.set(false);
      },
    });
  }

  private updateUnit() {
    const payload: AddUnitPayload = {
      enName: this.form.value.enName!,
      arName: this.form.value.arName!,
      subjectId: this.subjectId,
      levelId: this.levelId,
    };

    this.learningOutcomesService.updateUnit(this.unit!.id, payload).subscribe({
      next: (unit) => {
        this.hesToaster.success(
          this.hesTranslateService.t('learning_outcome.unit_updated.msg'),
        );
        this.closeModal({ unit, action: 'update' }, 'confirm');
      },
      error: (err) => {
        this.hesToaster.showBackendError(err);
        this.primaryButtonLoading.set(false);
      },
    });
  }

  // Called by modal wrapper on secondary button click
  onSecondaryClick() {
    this.closeModal(undefined, 'cancel');
  }
}
