import { Component, Input, inject, signal } from '@angular/core';
import { HesAuthDirective } from '@auth/hes-auth.directive';
import { IonLabel } from '@ionic/angular/standalone';
import { TranslocoDirective } from '@jsverse/transloco';
import { UserChangeNumberComponent } from '@pages/user-management/components/user-change-number/user-change-number.component';
import { RbacDirective } from '@shared/role-bace-acces-controller/rbac.directive';
import { DsButtonComponent } from '@ds/button/button.component';
import { UserType } from '@shared/enums';
import { UserChangePasswordComponent } from '@shared/components/user-change-password/user-change-password.component';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { AuthService } from '@auth/auth.service';

@Component({
  selector: 'app-profile-login-methods',
  templateUrl: './profile-login-methods.component.html',
  standalone: true,
  imports: [
    IonLabel,
    DsButtonComponent,
    TranslocoDirective,
    HesAuthDirective,
    UserChangeNumberComponent,
    RbacDirective,
    UserChangePasswordComponent,
  ],
})
export class ProfileLoginMethodsComponent {
  authService = inject(AuthService);
  rbacService = inject(RoleBaseAccessControlService);
  resetPasswordText = this.rbacService.isSuperAdmin()
    ? 'global.reset_password.btn'
    : 'global.update_password.btn';

  showPhoneNumberForm = signal(false);
  showPasswordForm = signal(false);

  @Input() studentId?: string | null;
  @Input() userType: UserType;
  @Input() phoneNumber: string;
  @Input() nationalId: string;
  @Input() deactivateRoles: Array<string>;
  @Input() onDeactivate: () => void;
  @Input() showDeactivateBtn: boolean = false;
  @Input() onPause: () => void;
  @Input() showPauseBtn: boolean = false;
  @Input() onUpdateSuccess: () => void;
  @Input() deactivatePermissionId: number;
  @Input() updatePhoneNumberPermissionId: number;
  @Input() updatePasswordPermissionId: number;
  @Input() ownProfile: boolean = false;
  isAccountSetup = this.authService.user()?.isPasswordSetup;
  onChangePhoneNumber() {
    this.showPhoneNumberForm.set(true);
  }

  onDismissChangeNumber = () => {
    this.showPhoneNumberForm.set(false);
  };

  onChangePassword() {
    this.showPasswordForm.set(true);
  }

  onUpdatePasswordSuccess = () => {
    this.showPasswordForm.set(false);
    this.onUpdateSuccess();
  };

  onDismissChangePassword = () => {
    this.showPasswordForm.set(false);
  };
  protected readonly UserType = UserType;

  isStudent(): boolean {
    if (this.studentId) {
      return (
        this.authService.user()?.userTypeId === +this.studentId &&
        this.authService.user()?.type === UserType.STUDENT
      );
    } else {
      return false;
    }
  }
}
