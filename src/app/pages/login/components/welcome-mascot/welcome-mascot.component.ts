import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DsButtonComponent } from '@ds/button/button.component';
import {
  TranslocoDirective,
  TranslocoPipe,
  TranslocoService,
} from '@jsverse/transloco';
import {
  AuthFlowService,
  AuthStep,
} from '@pages/login/services/auth-flow.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  MascotContext,
  MascotSituation,
} from '@pages/login/services/mascot.service';

@Component({
  selector: 'app-welcome-mascot',
  standalone: true,
  imports: [CommonModule, TranslocoDirective, TranslocoPipe],
  templateUrl: './welcome-mascot.component.html',
  styleUrl: './welcome-mascot.component.scss',
})
export class WelcomeMascotComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly authFlowService = inject(AuthFlowService);
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    // Set this as the current step (it's between language and role selection)
    // You might need a WELCOME step in your AuthStep enum, or handle it differently

    // Hide the shell mascot since this screen has its own full mascot
    this.authFlowService.setMascotVisibility(false);

    // Enable continue button immediately
    this.authFlowService.setCanContinue(true);

    // Listen for continue button clicks from shell
    this.authFlowService.continue$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onContinue();
      });
  }

  onContinue(): void {
    // Re-enable shell mascot before navigating
    this.authFlowService.setMascotVisibility(true);

    // Move to role selection step
    this.authFlowService.setCurrentStep(AuthStep.ROLE_SELECTION);

    // Navigate to role selection
    this.router.navigate(['/login/role-selection']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
