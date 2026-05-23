import { Component, inject, Input, OnInit } from '@angular/core';
import { AuthService } from '../auth.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCircleExclamation } from '@fortawesome/pro-regular-svg-icons';
import { TranslocoDirective } from '@jsverse/transloco';
import { USER_STATUS } from '@auth/model';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HesTranslateService } from '../../shared/services/hes-translate.service';

@Component({
  selector: 'app-account-blocked-alert',
  templateUrl: './account-blocked-alert.component.html',
  standalone: true,
  imports: [FontAwesomeModule, TranslocoDirective],
})
export class AccountBlockedAlertComponent implements OnInit {
  // #region Inputs and Outputs
  @Input() blockedStatus: USER_STATUS;
  // #endregion

  // #region Injectables
  private readonly authService = inject(AuthService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly hesTranslateService = inject(HesTranslateService);
  // #endregion

  // #region Public Properties
  readonly faCircleExclamation = faCircleExclamation;
  sanitizedMessage: SafeHtml;
  countdown: number = 10;
  // #endregion

  // #region Public Methods
  ngOnInit() {
    this.updateSanitizedMessage();
    const interval = setInterval(() => {
      this.countdown--;
      this.updateSanitizedMessage();
      if (this.countdown === 0) {
        clearInterval(interval);
        this.authService.logout(true);
      }
    }, 1000);
  }
  // #endregion

  // #region Private Methods
  private updateSanitizedMessage() {
    const message = this.hesTranslateService.t(
      'deactivation_paused_user.redirecting_msg.txt',
      { seconds: this.countdown },
    );
    this.sanitizedMessage = this.sanitizer.bypassSecurityTrustHtml(message);
  }
  // #endregion
}
