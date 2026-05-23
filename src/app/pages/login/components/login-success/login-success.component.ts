import { Component, computed, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  AuthFlowService,
  AuthStep,
} from '@pages/login/services/auth-flow.service';
import { DsButtonComponent } from '@ds/button/button.component';
import { LoginDataService } from '@pages/login/services/login-data.service';
import { AuthService } from '@auth/auth.service';
import {
  TranslocoDirective,
  TranslocoPipe,
  TranslocoService,
} from '@jsverse/transloco';
import { AnimatedIconComponent } from '@ds-layout/components/animated-icon/animated-icon.component';

@Component({
  selector: 'app-login-success',
  templateUrl: './login-success.component.html',
  imports: [
    DsButtonComponent,
    TranslocoDirective,
    AnimatedIconComponent,
    TranslocoPipe,
  ],
})
export class LoginSuccessComponent implements OnInit {
  private auth = inject(AuthService);
  private loginData = inject(LoginDataService);
  private router = inject(Router);
  private authFlowService = inject(AuthFlowService);
  private transloco = inject(TranslocoService);

  proceedButtonText = computed(() =>
    this.transloco.translate('login.as_student.button', {
      student_First_name: this.authFlowService.givenName() ?? '',
    }),
  );

  constructor() {}

  ngOnInit(): void {
    this.authFlowService.setMascotVisibility(false);
    this.authFlowService.setCurrentStep(AuthStep.SUCCESS);
  }

  get animatedIconSize(): string {
    return window.innerWidth <= 768 ? '250px' : '350px';
  }

  goToLogin(): void {
    this.authFlowService.resetFlow();
    this.router.navigate(['/login']);
  }

  login() {
    this.auth.setSession(this.loginData.loginRes()!);
    this.auth.redirect();
  }
}
