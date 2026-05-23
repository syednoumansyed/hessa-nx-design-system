import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { DsButtonComponent } from '@ds/button/button.component';
import { DsFormControlGeneratorComponent } from '@shared/components/ds-form-control-generator/ds-form-control-generator.component';
import { DsFormControl } from '@shared/components/ds-form-control-generator/ds-form-control-generator.model';
import {
  IonContent,
  IonFooter,
  NavController,
} from '@ionic/angular/standalone';
import { DelegateAvatarUploadComponent } from '../../components/delegate-avatar-upload/delegate-avatar-upload.component';
import { DelegateService } from '../../data-access/delegate.service';
import {
  CreateDelegatePayload,
  Delegate,
  UpdateDelegatePayload,
} from '../../data-access/delegate.interface';
import { finalize, switchMap } from 'rxjs';
import { TuiDay } from '@taiga-ui/cdk';
import { StudentSelectListComponent } from '../../components/student-select-list/student-select-list.component';
import { GuardianService } from '@pages/user-management/guardians/guardians.service';
import { AuthService } from '@auth/auth.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { HesLogService } from '@shared/services/hes-log.service';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { formatDateToUnix } from '@shared/utils/date';

@Component({
  selector: 'app-add-delegate',
  standalone: true,
  imports: [
    IonContent,
    IonFooter,
    ReactiveFormsModule,
    DsButtonComponent,
    DsFormControlGeneratorComponent,
    DelegateAvatarUploadComponent,
    StudentSelectListComponent,
    TranslocoModule,
  ],
  templateUrl: './add-delegate.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddDelegatePage implements OnInit {
  private readonly delegateService = inject(DelegateService);
  private readonly navController = inject(NavController);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly guardianService = inject(GuardianService);
  private readonly authService = inject(AuthService);
  private readonly toasterService = inject(HesToasterService);
  private readonly logService = inject(HesLogService);
  private readonly translocoService = inject(TranslocoService);

  // State
  selectedImage = signal<File | null>(null);
  isLoading = signal(false);
  isUploadingPhoto = signal(false);
  isEditMode = signal(false);
  delegate = signal<Delegate | null>(null);
  existingImageKey = signal<string | null>(null);
  isLoadingStudents = signal(false);

  // Local students list - fetched with ACTIVE status only
  private localStudents = signal<
    Array<{
      id: number;
      fullName: string;
      image?: string;
      school?: { name?: string };
    }>
  >([]);

  /**
   * Student options for student selector - uses locally fetched active students
   */
  studentsOptions = computed(() => {
    return this.localStudents().map((s) => ({
      id: s.id,
      displayName: s.fullName,
      avatarUrl: s.image,
      schoolName: s.school?.name,
    }));
  });

  // Form - expiryDate is TuiDay from Taiga UI date picker
  form = this.fb.group({
    enFullName: this.fb.control('', Validators.required),
    arFullName: this.fb.control('', Validators.required),
    expiryDate: this.fb.control<TuiDay | null>(null, Validators.required),
    nationalId: this.fb.control('', [
      Validators.required,
      Validators.minLength(8),
      Validators.maxLength(18),
      Validators.pattern(/^\d+$/),
    ]),
    studentIds: this.fb.control<number[]>([], Validators.required),
  });

  // Minimum date for expiry date picker (today)
  readonly minExpiryDate = TuiDay.currentLocal();

  // Form controls configuration
  formControls = computed<DsFormControl[]>(() => {
    return [
      {
        type: 'input',
        formControlName: 'enFullName',
        label: this.translocoService.translate(
          'dismissal.full_name_iqama_en.txt',
        ),
        placeholder: this.translocoService.translate(
          'dismissal.full_name_iqama_en.txt',
        ),
        required: true,
        maxLength: 100,
      },
      {
        type: 'input',
        formControlName: 'arFullName',
        label: this.translocoService.translate(
          'dismissal.full_name_iqama_ar.txt',
        ),
        placeholder: this.translocoService.translate(
          'dismissal.full_name_iqama_ar.txt',
        ),
        required: true,
        maxLength: 100,
      },
      {
        type: 'date',
        formControlName: 'expiryDate',
        label: this.translocoService.translate('global.valid_till.txt'),
        placeholder: this.translocoService.translate(
          'global.select_date.placeholder',
        ),
        required: true,
        datePickerConfig: {
          min: this.minExpiryDate,
        },
      },
      {
        type: 'input',
        formControlName: 'nationalId',
        label: this.translocoService.translate(
          'dismissal.national_id_iqama.txt',
        ),
        placeholder: this.translocoService.translate(
          'global.enter_national_id.placeholder',
        ),
        required: true,
        maxLength: 18,
        inputType: 'number',
      },
    ];
  });

  // Page title based on mode
  pageTitle = computed(() =>
    this.isEditMode()
      ? this.translocoService.translate('dismissal.edit_delegate.txt')
      : this.translocoService.translate('global.add_delegate.txt'),
  );
  submitButtonText = computed(() =>
    this.isEditMode()
      ? this.translocoService.translate('global.save.btn')
      : this.translocoService.translate('global.add'),
  );

  ngOnInit(): void {
    this.loadActiveStudents();
    this.checkEditMode();
  }

  /**
   * Fetch students locally with ACTIVE class status only.
   * This ensures we always get the latest active students for delegate assignment.
   */
  private loadActiveStudents(): void {
    const user = this.authService.user();
    if (user?.type !== 'GUARDIAN' || !user?.userTypeId) {
      return;
    }

    this.isLoadingStudents.set(true);
    this.guardianService
      .getGuardian(user.userTypeId, { studentClassStatus: 'ACTIVE' })
      .pipe(finalize(() => this.isLoadingStudents.set(false)))
      .subscribe({
        next: (guardian) => {
          if (guardian.students?.length) {
            this.localStudents.set(
              guardian.students.map((s) => ({
                id: s.id,
                fullName: s.displayName,
                image: s.imageUrl ?? undefined,
                school: s.school ? { name: s.school.displayName } : undefined,
              })),
            );
          }
        },
        error: (error) => {
          this.logService.error('Failed to load students:', error);
          this.toasterService.error(
            this.translocoService.translate(
              'dismissal.failed_to_load_students.txt',
            ),
          );
        },
      });
  }

  private checkEditMode(): void {
    // Check if we're editing an existing delegate via router state
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state as { delegate?: Delegate };

    if (state?.delegate) {
      const delegate = state.delegate;
      this.delegate.set(delegate);
      this.isEditMode.set(true);
      this.existingImageKey.set(delegate.key);

      // Populate form with existing data
      this.form.patchValue({
        enFullName: delegate.enFullName,
        arFullName: delegate.arFullName,
        expiryDate: delegate.expiryDate
          ? this.parseDateToTuiDay(delegate.expiryDate)
          : null,
        nationalId: delegate.nationalId,
        studentIds: delegate.students.map((s) => s.studentId),
      });
    }
  }

  onImageSelected(file: File): void {
    this.selectedImage.set(file);

    // In edit mode, upload photo immediately
    if (this.isEditMode()) {
      const delegate = this.delegate();
      if (!delegate) return;

      this.isUploadingPhoto.set(true);
      this.delegateService
        .uploadDelegatePhoto(file, delegate.id)
        .pipe(finalize(() => this.isUploadingPhoto.set(false)))
        .subscribe({
          next: (uploadRes) => {
            this.existingImageKey.set(uploadRes.key);
            this.toasterService.success(
              this.translocoService.translate(
                'dismissal.photo_updated_successfully.txt',
              ),
            );
          },
          error: (error) => {
            this.logService.error('Failed to upload photo:', error);
            this.toasterService.error(
              this.translocoService.translate(
                'dismissal.failed_to_upload_photo.txt',
              ),
            );
          },
        });
    }
  }

  goBack(): void {
    this.navController.back();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();
    this.isLoading.set(true);

    if (this.isEditMode()) {
      this.updateDelegate(formValue);
    } else {
      this.createDelegate(formValue);
    }
  }

  private createDelegate(formValue: typeof this.form.value): void {
    const selectedImage = this.selectedImage();

    // Image is required for new delegates
    if (!selectedImage) {
      this.toasterService.error(
        this.translocoService.translate(
          'dismissal.please_upload_delegate_photo.txt',
        ),
      );
      this.isLoading.set(false);
      return;
    }

    // Upload image first, then create delegate
    this.delegateService
      .uploadDelegatePhoto(selectedImage)
      .pipe(
        switchMap((uploadRes) => {
          const payload: CreateDelegatePayload = {
            enFullName: formValue.enFullName!,
            arFullName: formValue.arFullName!,
            nationalId: formValue.nationalId!,
            expiryDate: this.formatTuiDay(formValue.expiryDate!),
            key: uploadRes.key,
            studentIds: formValue.studentIds!,
          };
          return this.delegateService.createDelegate(payload);
        }),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: () => {
          this.toasterService.success(
            this.translocoService.translate(
              'dismissal.delegate_created_successfully.txt',
            ),
          );
          this.navController.back();
        },
        error: (error) => {
          this.logService.error('Failed to create delegate:', error);
          const errorMessage =
            error?.error?.message ||
            error?.message ||
            this.translocoService.translate(
              'dismissal.failed_to_create_delegate.txt',
            );
          this.toasterService.error(errorMessage);
        },
      });
  }

  private updateDelegate(formValue: typeof this.form.value): void {
    const delegate = this.delegate();
    if (!delegate) return;

    const existingKey = this.existingImageKey();

    // Photo is already uploaded immediately when selected
    // Just update the delegate with existing key
    const payload: UpdateDelegatePayload = {
      id: delegate.id,
      enFullName: formValue.enFullName!,
      arFullName: formValue.arFullName!,
      nationalId: formValue.nationalId!,
      expiryDate: this.formatTuiDay(formValue.expiryDate!),
      key: existingKey!,
      studentIds: formValue.studentIds!,
    };

    this.delegateService
      .updateDelegate(payload)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this.toasterService.success(
            this.translocoService.translate(
              'dismissal.delegate_updated_successfully.txt',
            ),
          );
          this.navController.back();
        },
        error: (error) => {
          this.logService.error('Failed to update delegate:', error);
          this.toasterService.error(
            this.translocoService.translate(
              'dismissal.failed_to_update_delegate.txt',
            ),
          );
        },
      });
  }

  onStudentIdsChange(ids: number[]): void {
    this.form.controls.studentIds.setValue(ids);
  }

  /**
   * Format TuiDay to Unix timestamp for API
   */
  private formatTuiDay(tuiDay: TuiDay): number {
    // end of day (23:59:59) in the user's local timezone to ensure validity even if added late at night
    const d = new Date(tuiDay.year, tuiDay.month, tuiDay.day, 23, 59, 59, 999);
    return Math.floor(d.getTime() / 1000);
  }

  /**
   * Parse date string to TuiDay
   */
  private parseDateToTuiDay(dateString: string): TuiDay | null {
    if (!dateString) return null;
    const d = new Date(dateString); // UTC instant, displayed in local tz
    return new TuiDay(d.getFullYear(), d.getMonth(), d.getDate());
  }
}
