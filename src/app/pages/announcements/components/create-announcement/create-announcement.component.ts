import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { RbacDirective } from '@shared/role-bace-acces-controller/rbac.directive';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { ModalController } from '@ionic/angular/standalone';
@Component({
  selector: 'app-create-announcement',
  standalone: true,
  imports: [CommonModule, TranslocoDirective, HesButtonModule, RbacDirective],
  templateUrl: './create-announcement.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateAnnouncementComponent {
  createPostPermissionId =
    RESOURCE_PERMISSION.announcement.announcementCreatePost;
  createSmsPermissionId =
    RESOURCE_PERMISSION.announcement.announcementCreateSms;
  private readonly router = inject(Router);
  private readonly modalControl = inject(ModalController);
  onCreatePost() {
    this.router.navigate(['/announcements/post']);
    this.modalControl.dismiss();
  }

  onCreateSMS() {
    this.router.navigate(['/announcements/sms']);
    this.modalControl.dismiss();
  }
}
