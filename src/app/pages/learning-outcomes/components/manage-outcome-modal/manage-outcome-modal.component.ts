import {
  Component,
  DestroyRef,
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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  DsFormRendererComponent,
  FormControlConfig,
} from '@shared/components/ds-form-control-generator/ds-form-renderer/ds-form-renderer.component';
import { DsModalContentComponent } from '@ds/modal/modal-wrapper.component';
import { LearningOutcomesService } from '../../data-access/learning-outcomes.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import {
  AddOutcomePayload,
  LearningOutcomeDetail,
  LearningOutcomeLesson,
  OutcomeDomain,
} from '../../data-access/learning-outcomes.interface';
import { EducationalPathEnum } from '@shared/enums';
import { DsSelectValue } from '@shared/components/ds-form-control-generator/ds-form-control-generator.model';

import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { forkJoin } from 'rxjs';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import {
  faBuilding,
  faGlobe,
  faGraduationCap,
} from '@fortawesome/pro-regular-svg-icons';

@Component({
  selector: 'app-manage-outcome-modal',
  templateUrl: './manage-outcome-modal.component.html',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DsFormRendererComponent,
    TranslocoDirective,
  ],
})
export class ManageOutcomeModalComponent
  implements OnInit, DsModalContentComponent
{
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly learningOutcomesService = inject(LearningOutcomesService);
  private readonly hesToaster = inject(HesToasterService);
  private readonly transloco = inject(TranslocoService);
  private readonly hesTranslateService = inject(HesTranslateService);

  // Inputs from modal
  @Input() lessonId!: number;
  @Input() levelId!: number;
  @Input() subjectId!: number;
  @Input() outcomeId?: number; // For edit mode - fetch outcome detail by ID

  // Modal control (injected by modal wrapper)
  closeModal!: (data?: unknown, role?: string) => void;

  // Button state signals (watched by modal wrapper)
  readonly primaryButtonDisabled = signal(true);
  readonly primaryButtonLoading = signal(false);

  // Loading state for async data
  readonly isLoading = signal(true);

  // Dynamic required state for statement fields (used as Signal in form config)
  readonly isEnStatementRequired = signal(false);
  readonly isArStatementRequired = signal(false);

  // Outcome detail (fetched in edit mode)
  private outcomeDetail: LearningOutcomeDetail | null = null;

  // Mode
  get isEditMode(): boolean {
    return !!this.outcomeId;
  }

  // Educational path icons mapping
  private readonly educationalPathIcons = {
    [EducationalPathEnum.NATIONAL]: faBuilding,
    [EducationalPathEnum.INTERNATIONAL]: faGlobe,
    [EducationalPathEnum.ACADEMY]: faGraduationCap,
  };

  // Educational path options from enum
  readonly educationalPathOptions: DsSelectValue[] = Object.values(
    EducationalPathEnum,
  ).map((path) => ({
    value: path,
    displayedValue: this.transloco.translate(`enum.${path}`),
    icon: {
      name: this.educationalPathIcons[path],
      placement: 'start' as const,
    },
  }));

  // Domain options - will be populated from API
  domainOptions: DsSelectValue[] = [];

  // Lesson options - will be populated from API
  lessonOptions: DsSelectValue[] = [];

  // Form - statement validators are set dynamically based on educationalPaths
  form = this.fb.group({
    educationalPaths: this.fb.control<string[]>([], Validators.required),
    domainIds: this.fb.control<number[]>([], Validators.required),
    lessonIds: this.fb.control<number[]>([], Validators.required),
    enStatement: this.fb.control(''),
    arStatement: this.fb.control(''),
  });

  // Form config for renderer - signal for reactivity
  protected readonly formConfig = signal<FormControlConfig[]>(
    this.buildFormConfig(),
  );

  ngOnInit() {
    // Set initial button state and subscribe to form status changes
    this.primaryButtonDisabled.set(this.form.invalid);
    this.form.statusChanges.subscribe(() => {
      this.primaryButtonDisabled.set(this.form.invalid);
    });

    // Subscribe to educational paths changes to update statement validators
    this.form.controls.educationalPaths.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((paths) => {
        this.updateStatementValidators(paths);
      });

    // Pre-select the current lesson if provided (only in add mode)
    if (!this.isEditMode && this.lessonId) {
      this.form.patchValue({ lessonIds: [this.lessonId] });
    }

    // Load async data (domains, lessons, and outcome detail if editing)
    this.loadAsyncData();
  }

  /**
   * Update statement field validators based on educational paths selection
   * - National only → Arabic required, English optional
   * - International only → English required, Arabic optional
   * - Academy only → English required, Arabic optional
   * - International or Academy selected → English required
   * - National selected → Arabic required
   */
  private updateStatementValidators(paths: string[]) {
    const hasNational = paths.includes(EducationalPathEnum.NATIONAL);
    const hasInternational = paths.includes(EducationalPathEnum.INTERNATIONAL);
    const hasAcademy = paths.includes(EducationalPathEnum.ACADEMY);

    const enControl = this.form.controls.enStatement;
    const arControl = this.form.controls.arStatement;

    // Determine required state
    // English is required if International OR Academy is selected
    const isEnRequired = hasInternational || hasAcademy;
    const isArRequired = hasNational;

    // Update signals - UI will update reactively via resolvedRequired() in form generator
    this.isEnStatementRequired.set(isEnRequired);
    this.isArStatementRequired.set(isArRequired);

    // Update validators
    if (isEnRequired) {
      enControl.setValidators(Validators.required);
    } else {
      enControl.clearValidators();
    }

    if (isArRequired) {
      arControl.setValidators(Validators.required);
    } else {
      arControl.clearValidators();
    }

    // Revalidate controls
    enControl.updateValueAndValidity();
    arControl.updateValueAndValidity();
  }

  private loadAsyncData() {
    const domainsLoaded = this.learningOutcomesService.domains().length > 0;

    // Build fetches - always fetch lessons fresh to get latest data
    const fetches: Record<string, any> = {};

    if (!domainsLoaded) {
      fetches['domains'] = this.learningOutcomesService.fetchDomains();
    }

    // Always fetch lessons fresh when modal opens
    if (this.levelId && this.subjectId) {
      fetches['lessons'] = this.learningOutcomesService.fetchLessons({
        levelId: this.levelId,
        subjectId: this.subjectId,
      });
    }

    // Fetch outcome detail in edit mode
    if (this.isEditMode && this.outcomeId) {
      fetches['outcomeDetail'] = this.learningOutcomesService.fetchOutcomeById(
        this.outcomeId,
      );
    }

    if (Object.keys(fetches).length === 0) {
      // Nothing to fetch (shouldn't happen normally)
      if (domainsLoaded) {
        this.buildDomainOptions(this.learningOutcomesService.domains());
      }
      this.rebuildFormConfig();
      this.isLoading.set(false);
      return;
    }

    forkJoin(fetches).subscribe({
      next: (results) => {
        if (results['domains']) {
          this.buildDomainOptions(results['domains'] as OutcomeDomain[]);
        } else if (domainsLoaded) {
          this.buildDomainOptions(this.learningOutcomesService.domains());
        }

        if (results['lessons']) {
          this.buildLessonOptions(
            results['lessons'] as LearningOutcomeLesson[],
          );
        }

        // Populate form with outcome detail in edit mode
        if (results['outcomeDetail']) {
          this.outcomeDetail = results[
            'outcomeDetail'
          ] as LearningOutcomeDetail;
          this.populateFormForEdit();
        }

        this.rebuildFormConfig();
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  private populateFormForEdit() {
    if (!this.outcomeDetail) return;

    this.form.patchValue({
      educationalPaths: this.outcomeDetail.educationalPaths,
      domainIds: this.outcomeDetail.domains.map((d) => d.id),
      lessonIds: this.outcomeDetail.lessonIds,
      enStatement: this.outcomeDetail.enStatement,
      arStatement: this.outcomeDetail.arStatement,
    });

    // Update validators based on educational paths (after patching values)
    // This will be triggered by the valueChanges subscription, but we call it
    // explicitly to ensure validators are set before form validation runs
    this.updateStatementValidators(this.outcomeDetail.educationalPaths);
  }

  private buildLessonOptions(lessons: LearningOutcomeLesson[]) {
    this.lessonOptions = lessons.map((lesson) => ({
      value: lesson.id,
      displayedValue: lesson.displayName,
    }));
  }

  private buildDomainOptions(domains: OutcomeDomain[]) {
    this.domainOptions = domains.map((domain) => ({
      value: domain.id,
      displayedValue: domain.displayName,
    }));
  }

  private buildFormConfig(): FormControlConfig[] {
    return [
      {
        type: 'chip-selector',
        formControlName: 'educationalPaths',
        label: this.hesTranslateService.t(
          'learning_outcome.educational_path.label',
        ),
        isMultiple: true,
        required: true,
        selectValues: this.educationalPathOptions,
        displayType: 'card',
      },
      {
        type: 'chip-selector',
        formControlName: 'domainIds',
        label: this.hesTranslateService.t('learning_outcome.domain.label'),
        isMultiple: true,
        required: true,
        selectValues: this.domainOptions,
        displayType: 'card',
      },
      {
        type: 'picker-select',
        formControlName: 'lessonIds',
        label: this.hesTranslateService.t(
          'learning_outcome.select_lessons.label',
        ),
        placeholder: this.hesTranslateService.t(
          'learning_outcome.select_lessons.placeholder',
        ),
        itemLabel: this.hesTranslateService.t('learning_outcome.lessons.label'),
        selectButtonText: this.hesTranslateService.t(
          'learning_outcome.select.btn',
        ),
        isMultiple: true,
        required: true,
        selectValues: this.lessonOptions,
      },
      {
        type: 'textarea',
        formControlName: 'enStatement',
        label: this.hesTranslateService.t(
          'learning_outcome.statement_en.label',
        ),
        placeholder: this.hesTranslateService.t(
          'learning_outcome.statement_en.placeholder',
        ),
        required: this.isEnStatementRequired, // Pass signal directly
        maxLength: 1000,
        showCharacterCount: true,
      },
      {
        type: 'textarea',
        formControlName: 'arStatement',
        label: this.hesTranslateService.t(
          'learning_outcome.statement_ar.label',
        ),
        placeholder: this.hesTranslateService.t(
          'learning_outcome.statement_en.placeholder',
        ),
        required: this.isArStatementRequired, // Pass signal directly
        maxLength: 1000,
        showCharacterCount: true,
      },
    ];
  }

  private rebuildFormConfig() {
    this.formConfig.set(this.buildFormConfig());
  }

  // Called by modal wrapper on primary button click
  onPrimaryClick() {
    if (this.form.invalid) return;

    this.primaryButtonLoading.set(true);

    if (this.isEditMode) {
      this.updateOutcome();
    } else {
      this.createOutcome();
    }
  }

  private createOutcome() {
    const payload: AddOutcomePayload = {
      educationalPaths: this.form.value.educationalPaths!,
      domainIds: this.form.value.domainIds!,
      lessonIds: this.form.value.lessonIds!,
    };

    // Only include statement fields if they have values
    if (this.form.value.enStatement) {
      payload.enStatement = this.form.value.enStatement;
    }
    if (this.form.value.arStatement) {
      payload.arStatement = this.form.value.arStatement;
    }

    this.learningOutcomesService.createOutcome(payload).subscribe({
      next: (outcome) => {
        this.hesToaster.success(
          this.hesTranslateService.t('learning_outcome.outcome_added.msg'),
        );
        this.closeModal({ outcome, action: 'create' }, 'confirm');
      },
      error: (err) => {
        this.hesToaster.showBackendError(err);
        this.primaryButtonLoading.set(false);
      },
    });
  }

  private updateOutcome() {
    if (!this.outcomeId) return;

    const payload: AddOutcomePayload = {
      educationalPaths: this.form.value.educationalPaths!,
      domainIds: this.form.value.domainIds!,
      lessonIds: this.form.value.lessonIds!,
    };

    // Only include statement fields if they have values
    if (this.form.value.enStatement) {
      payload.enStatement = this.form.value.enStatement;
    }
    if (this.form.value.arStatement) {
      payload.arStatement = this.form.value.arStatement;
    }

    this.learningOutcomesService
      .updateOutcome(this.outcomeId, payload)
      .subscribe({
        next: (outcome) => {
          this.hesToaster.success(
            this.hesTranslateService.t('learning_outcome.outcome_updated.msg'),
          );
          this.closeModal({ outcome, action: 'update' }, 'confirm');
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
