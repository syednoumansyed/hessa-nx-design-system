import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';
import { faUser, faGear } from '@fortawesome/pro-regular-svg-icons';
import { faCircleInfo } from '@fortawesome/pro-solid-svg-icons';
import { DsButtonComponent } from 'src/app/design-system/button/button.component';
import { DsIconComponent } from '@ds/icon/icon.component';
import { DsTooltipDirective } from '@ds/tooltip/ds-tooltip.directive';
import { UsagePopupExampleComponent } from '../../popup-demo/popup-demo.component';
import { ModalDemoComponent } from '../../modal-demo/modal-demo.component';
import { SidebarDemoComponent } from '../../sidebar-demo/sidebar-demo.component';
import { DsResponsiveMenuComponent } from '@ds/popup/responsive-menu/responsive-menu.component';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { FeedbackService } from '@shared/services/feedback.service';
import { DsFeedbackType } from '@ds/common.types';
import { PopupItem } from '@ds/popup/types/popup.interface';
import { DemoPageWrapperComponent } from '../../components/demo-page-wrapper.component';
import { NotificationService } from '@ds/in-app-notification/notification.service';

@Component({
  selector: 'app-feedback-demo',
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    DsButtonComponent,
    DsIconComponent,
    DsTooltipDirective,
    UsagePopupExampleComponent,
    ModalDemoComponent,
    SidebarDemoComponent,
    DsResponsiveMenuComponent,
    DemoPageWrapperComponent,
  ],
  templateUrl: './feedback-demo.page.html',
})
export class FeedbackDemoPage {
  private toast = inject(HesToasterService);
  private feedbackModalService = inject(FeedbackService);
  private inAppNotificationService = inject(NotificationService);

  circleInfoIcon = faCircleInfo;

  iconContainerMenuItems: PopupItem[] = [
    {
      id: 'profile',
      title: 'global.profile.title',
      icon: faUser,
      state: 'default',
      action: () => this.toast.success('Selected: Profile', 'Responsive Menu'),
    },
    {
      id: 'settings',
      title: 'global.settings.title',
      icon: faGear,
      state: 'default',
      action: () => this.toast.success('Selected: Settings', 'Responsive Menu'),
    },
    {
      id: 'support',
      title: 'enum.HELP_AND_SUPPORT',
      icon: faGear,
      state: 'default',
      action: () => this.toast.success('Selected: Support', 'Responsive Menu'),
    },
    {
      id: 'change-language',
      title: 'global.select_language.dropdown',
      icon: 'change-language',
      state: 'default',
      children: [
        {
          id: 'arabic',
          title: 'العربية',
          selected: true,
          selectable: true,
          action: () =>
            this.toast.success('Selected: العربية', 'Responsive Menu'),
        },
        {
          id: 'english',
          title: 'English',
          selectable: true,
          action: () =>
            this.toast.success('Selected: English', 'Responsive Menu'),
        },
      ],
    },
    {
      id: 'logout',
      title: 'global.logout.btn',
      icon: 'logout',
      state: 'danger',
      action: () => this.toast.success('Selected: Logout', 'Responsive Menu'),
    },
  ];

  openFeedback(variant: DsFeedbackType) {
    this.feedbackModalService.openFeedbackModal(
      {
        type: variant,
        modalTitle:
          variant === 'success'
            ? 'Operation Successful'
            : variant === 'error'
              ? 'Operation Failed'
              : 'Warning',
        modalMessage:
          variant === 'success'
            ? 'The operation was completed successfully.'
            : variant === 'error'
              ? 'There was an error completing the operation.'
              : 'Please be cautious.',
        primaryBtnStr: 'Save',
        secondaryBtnStr: 'Cancel',
      },
      () => {
        this.toast.success('Feedback confirmed', 'Feedback');
      },
      () => {
        this.toast.info('Feedback cancelled', 'Feedback');
      },
    );
  }

  showSuccessInAppNotification(): void {
    this.inAppNotificationService.show({
      title: 'Demo: Success Notification',
      message: 'Assignment has been published to all students.',
      icon: 'announcement',
      duration: 5000,
    });
  }

  showInfoInAppNotification(): void {
    this.inAppNotificationService.show({
      title: 'Demo: Information Notification',
      message: 'This is an informational in-app notification example.',
      icon: 'feed',
      duration: 5000,
    });
  }

  showWarningInAppNotification(): void {
    this.inAppNotificationService.show({
      title: 'Demo: Warning Notification',
      message: 'Attendance sync is delayed. Please retry in a few minutes.',
      icon: 'support',
      duration: 7000,
    });
  }

  showStickyInAppNotification(): void {
    this.inAppNotificationService.show({
      title: 'Demo: Sticky Notification',
      message:
        'This is a long sticky notification message intended to demonstrate wrapping, layout, and readability across multiple lines. It stays visible until you dismiss it manually.',
      icon: 'chat',
      duration: 0,
    });
  }

  clearInAppNotifications(): void {
    this.inAppNotificationService.clear();
  }
}
