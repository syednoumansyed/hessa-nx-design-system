import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TuiLoaderModule } from '@taiga-ui/core';
import { NotificationService } from '../data-access/notification.service';
import { NotificationSetting } from '../data-access/notification.interface';
import { HesLogService } from '@shared/services/hes-log.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { DsSwitchComponent } from '@ds/switch/switch.component';
import { AnimatedIconComponent } from '@ds-layout/components/animated-icon/animated-icon.component';
import { FeedbackService } from '@shared/services/feedback.service';
import { AuthService } from '@auth/auth.service';
import { NotificationSettingsResource } from '../data-access/notification.dto';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { TranslocoDirective } from '@jsverse/transloco';
import { DsTimePickerControlComponent } from '@ds/time-picker/time-picker-control/time-picker-control.component';
import {
  normalizeTimeFormat,
  to12HourFormat,
  to24HourFormat,
} from '@shared/utils/time-format.util';
import { HesTimePipe } from '@shared/pipes/hes-time.pipe';
import { DsButtonComponent } from '@ds/button/button.component';

interface NotificationSettingViewModel extends NotificationSetting {
  isSaving: boolean;
}

@Component({
  standalone: true,
  templateUrl: './notification-settings.page.html',
  imports: [
    CommonModule,
    TranslocoDirective,
    FormsModule,
    IonContent,
    TuiLoaderModule,
    DsSwitchComponent,
    AnimatedIconComponent,
    DsTimePickerControlComponent,
    HesTimePipe,
    DsButtonComponent,
  ],
})
export class NotificationSettingsPage implements OnInit {
  private readonly notificationService = inject(NotificationService);
  private readonly logService = inject(HesLogService);
  private readonly toaster = inject(HesToasterService);
  private readonly translateService = inject(HesTranslateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly feedbackService = inject(FeedbackService);
  private readonly authService = inject(AuthService);

  readonly isLoading = signal(false);
  readonly settings = signal<NotificationSettingViewModel[]>([]);
  protected readonly switchOnColor = 'var(--surface-brand-strong)';

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    if (this.isLoading()) return;

    this.isLoading.set(true);
    this.notificationService
      .getSettings()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const next = (response ?? []).map<NotificationSettingViewModel>(
            (item) => ({
              ...item,
              isSaving: false,
            }),
          );
          this.settings.set(next);
          this.isLoading.set(false);
        },
        error: (error) => {
          this.logService.error(
            'NotificationSettingsComponent.loadSettings',
            error,
          );
          this.settings.set([]);
          this.isLoading.set(false);
          this.toaster.showBackendError(error);
        },
      });
  }

  onToggle(setting: NotificationSettingViewModel, enabled: boolean): void {
    if (setting.isSaving) return;

    // Check if we need to show warning when turning OFF
    if (!enabled && this.shouldShowWarning(setting.resourceName)) {
      // Revert the change immediately since ngModel has already updated it
      setTimeout(() => {
        this.settings.update((current) =>
          current.map((item) =>
            item.resourceId === setting.resourceId
              ? { ...item, enabled: true }
              : item,
          ),
        );
      });
      // Then show the modal
      this.showWarningModal(setting);
      return;
    }

    // Proceed with toggle
    this.performToggle(setting, enabled);
  }

  private shouldShowWarning(resourceName: string): boolean {
    const isGuardian = this.authService.isUserGuardian();
    const isStudent = this.authService.isUserStudent();

    // Show warning for attendance if user is guardian
    if (
      resourceName === NotificationSettingsResource.ATTENDANCE &&
      isGuardian
    ) {
      return true;
    }

    // Show warning for course_contents if user is student
    if (
      resourceName === NotificationSettingsResource.COURSE_CONTENTS &&
      isStudent
    ) {
      return true;
    }

    return false;
  }

  private showWarningModal(setting: NotificationSettingViewModel): void {
    const message = this.getWarningMessage(setting.resourceName);

    this.feedbackService.openFeedbackModal(
      {
        type: 'warning',
        modalTitle: message,
        modalMessage: '',
        primaryBtnStr: this.translateService.translate(
          'notifications.settings.turn_off.btn',
        ),
        secondaryBtnStr: this.translateService.globalTObj.cancel,
      },
      () => {
        // Confirmed - proceed with turning off
        this.performToggle(setting, false);
      },
      () => {
        // Cancelled - ensure it stays enabled
        this.updateSettingState(setting.resourceId, {
          enabled: true,
        });
      },
    );
  }

  private getWarningMessage(resourceName: string): string {
    if (resourceName === NotificationSettingsResource.ATTENDANCE) {
      return this.translateService.translate(
        'notifications.settings.attendance_warning.txt',
      );
    }

    if (resourceName === NotificationSettingsResource.COURSE_CONTENTS) {
      return this.translateService.translate(
        'notifications.settings.course_contents_warning.txt',
      );
    }

    return '';
  }

  private performToggle(
    setting: NotificationSettingViewModel,
    enabled: boolean,
  ): void {
    const previous = setting.enabled;
    this.updateSettingState(setting.resourceId, {
      enabled,
      isSaving: true,
    });

    this.notificationService
      .updateSetting({
        resourceId: setting.resourceId,
        enabled,
        snoozeStartTime: enabled
          ? normalizeTimeFormat(setting.snoozeStartTime)
          : null,
        snoozeEndTime: enabled
          ? normalizeTimeFormat(setting.snoozeEndTime)
          : null,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.updateSettingState(setting.resourceId, {
            enabled,
            snoozeStartTime: enabled ? setting.snoozeStartTime : null,
            snoozeEndTime: enabled ? setting.snoozeEndTime : null,
            isSaving: false,
          });
        },
        error: (error) => {
          this.logService.error(
            'NotificationSettingsComponent.updateSetting',
            error,
          );
          this.updateSettingState(setting.resourceId, {
            enabled: previous,
            isSaving: false,
          });
          this.toaster.showBackendError(error);
        },
      });
  }

  trackByResourceId(_: number, item: NotificationSettingViewModel): number {
    return item.resourceId;
  }

  private updateSettingState(
    resourceId: number,
    changes: Partial<NotificationSettingViewModel>,
  ): void {
    this.settings.update((current) =>
      current.map((item) =>
        item.resourceId === resourceId ? { ...item, ...changes } : item,
      ),
    );
  }

  /**
   * Check if the setting is for the Chat resource (pause feature is Chat-only).
   */
  isChatSetting(setting: NotificationSettingViewModel): boolean {
    return setting.resourceName === NotificationSettingsResource.CHAT;
  }

  /**
   * Get the start time in 12-hour format for the time picker.
   * Backend stores in 24-hour format, picker uses 12-hour format.
   */
  getSnoozeStartTime12h(setting: NotificationSettingViewModel): string | null {
    return to12HourFormat(setting.snoozeStartTime);
  }

  /**
   * Get the end time in 12-hour format for the time picker.
   */
  getSnoozeEndTime12h(setting: NotificationSettingViewModel): string | null {
    return to12HourFormat(setting.snoozeEndTime);
  }

  /**
   * Handle start time change from the time picker.
   * Calls API only when both start and end times are set.
   */
  onSnoozeStartTimeChange(
    setting: NotificationSettingViewModel,
    time12h: string | null,
  ): void {
    const time24h = to24HourFormat(time12h);
    // Update local state first
    this.updateSettingState(setting.resourceId, { snoozeStartTime: time24h });

    // Get the current setting with updated values
    const currentSetting = this.settings().find(
      (s) => s.resourceId === setting.resourceId,
    );

    // Only call API if both start and end times are now set
    if (time24h && currentSetting?.snoozeEndTime) {
      this.saveSnoozeTimes(
        currentSetting,
        time24h,
        currentSetting.snoozeEndTime,
      );
    }
  }

  /**
   * Handle end time change from the time picker.
   * Calls API only when both start and end times are set.
   */
  onSnoozeEndTimeChange(
    setting: NotificationSettingViewModel,
    time12h: string | null,
  ): void {
    const time24h = to24HourFormat(time12h);
    // Update local state first
    this.updateSettingState(setting.resourceId, { snoozeEndTime: time24h });

    // Get the current setting with updated values
    const currentSetting = this.settings().find(
      (s) => s.resourceId === setting.resourceId,
    );

    // Only call API if both start and end times are now set
    if (currentSetting?.snoozeStartTime && time24h) {
      this.saveSnoozeTimes(
        currentSetting,
        currentSetting.snoozeStartTime,
        time24h,
      );
    }
  }

  /**
   * Resume notifications by clearing both start and end times.
   */
  onResumeNotifications(setting: NotificationSettingViewModel): void {
    this.saveSnoozeTimes(setting, null, null);
  }

  /**
   * Check if pause times are configured for the setting.
   */
  hasSnoozeTimes(setting: NotificationSettingViewModel): boolean {
    return !!setting.snoozeStartTime && !!setting.snoozeEndTime;
  }

  /**
   * Save snooze times to the backend.
   */
  private saveSnoozeTimes(
    setting: NotificationSettingViewModel,
    snoozeStartTime: string | null,
    snoozeEndTime: string | null,
  ): void {
    if (setting.isSaving) return;

    const previousSnoozeStartTime = setting.snoozeStartTime;
    const previousSnoozeEndTime = setting.snoozeEndTime;

    // Normalize times to HH:MM format (strip seconds if present from database)
    const normalizedSnoozeStartTime = normalizeTimeFormat(snoozeStartTime);
    const normalizedSnoozeEndTime = normalizeTimeFormat(snoozeEndTime);

    this.updateSettingState(setting.resourceId, {
      snoozeStartTime: normalizedSnoozeStartTime,
      snoozeEndTime: normalizedSnoozeEndTime,
      isSaving: true,
    });

    this.notificationService
      .updateSetting({
        resourceId: setting.resourceId,
        enabled: setting.enabled,
        snoozeStartTime: normalizedSnoozeStartTime,
        snoozeEndTime: normalizedSnoozeEndTime,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.updateSettingState(setting.resourceId, {
            snoozeStartTime: normalizedSnoozeStartTime,
            snoozeEndTime: normalizedSnoozeEndTime,
            isSaving: false,
          });
        },
        error: (error) => {
          this.logService.error(
            'NotificationSettingsComponent.updateSnoozeTimes',
            error,
          );
          this.updateSettingState(setting.resourceId, {
            snoozeStartTime: previousSnoozeStartTime,
            snoozeEndTime: previousSnoozeEndTime,
            isSaving: false,
          });
          this.toaster.showBackendError(error);
        },
      });
  }
}
