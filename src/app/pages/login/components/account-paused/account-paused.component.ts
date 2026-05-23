import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { DsIconComponent } from '@ds/icon/icon.component';
import { provideIcons } from '@ng-icons/core';
import { faSolidCircleXmark } from '@ng-icons/font-awesome/solid';
import { AuthFlowService } from '@pages/login/services/auth-flow.service';

@Component({
  selector: 'app-account-paused',
  templateUrl: './account-paused.component.html',
  styleUrls: ['./account-paused.component.scss'],
  imports: [DsIconComponent, TranslocoPipe],
  viewProviders: [provideIcons({ faSolidCircleXmark })],
})
export class AccountPausedComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly authFlow = inject(AuthFlowService);
  private readonly router = inject(Router);

  reason = 'inactive';
  imageSrc = 'assets/mascot/paused.png';
  title = '';
  description = '';

  constructor() {}

  ngOnInit() {
    // Get reason from route parameters
    this.reason = this.route.snapshot.params['reason'] || 'inactive';
    this.setContentBasedOnReason();
  }

  goBackToLogin() {
    this.authFlow.resetFlow();
    this.router.navigate(['/login/language-selection']);
  }

  private setContentBasedOnReason(): void {
    switch (this.reason.toLowerCase()) {
      case 'paused':
        this.imageSrc = 'assets/mascot/paused.png';
        this.title = 'login.account_paused.title';
        this.description = 'login.account_paused.txt';
        break;
      case 'inactive':
      default:
        this.imageSrc = 'assets/mascot/stopped.png';
        this.title =
          'deactivation_deactivated_user.account_deactivated_title.txt';
        this.description = 'global.no_longer_access_to_platform.txt';
        break;
    }
  }
}
