import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent,
  IonSpinner,
  ModalController,
  NavController,
} from '@ionic/angular/standalone';
import { TranslocoDirective } from '@jsverse/transloco';
import { DsButtonComponent } from '@ds/button/button.component';
import { DelegateCardComponent } from '@pages/pickup/components/delegate-card/delegate-card.component';
import { DelegateQrSheetComponent } from '@pages/pickup/components/delegate-qr-sheet/delegate-qr-sheet.component';
import { DelegateService } from '@pages/pickup/data-access/delegate.service';
import {
  Delegate,
  DelegateStatus,
} from '@pages/pickup/data-access/delegate.interface';
import { FeedbackService } from '@shared/services/feedback.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { HesLogService } from '@shared/services/hes-log.service';
import { TranslocoService } from '@jsverse/transloco';
import { finalize, catchError, of } from 'rxjs';

@Component({
  selector: 'app-delegate-pickup',
  standalone: true,
  templateUrl: './delegate-pickup.page.html',
  imports: [
    CommonModule,
    IonContent,
    IonSpinner,
    TranslocoDirective,
    DsButtonComponent,
    DelegateCardComponent,
  ],
})
export class DelegatePickupPage implements OnInit {
  private readonly delegateService = inject(DelegateService);
  private readonly router = inject(Router);
  private readonly navController = inject(NavController);
  private readonly modalController = inject(ModalController);
  private readonly feedbackService = inject(FeedbackService);
  private readonly toasterService = inject(HesToasterService);
  private readonly translateService = inject(HesTranslateService);
  private readonly logService = inject(HesLogService);
  private readonly translocoService = inject(TranslocoService);

  delegates = signal<Delegate[]>([]);
  isLoading = signal<boolean>(true);
  isSubmitting = signal<boolean>(false);

  isEmpty = computed(() => !this.isLoading() && this.delegates().length === 0);

  ngOnInit(): void {
    this.loadDelegates();
  }

  ionViewWillEnter(): void {
    // Reload delegates when returning to this page
    this.loadDelegates();
  }

  private loadDelegates(): void {
    this.isLoading.set(true);
    this.delegateService
      .getDelegates(false) // Don't include QR codes - they will be loaded on-demand when user clicks "Show QR"
      .pipe(
        catchError((error) => {
          // Log the error but return empty array to show empty state
          // instead of error message (e.g., when no delegates exist yet)
          this.logService.error('Error loading delegates:', error);
          return of([]);
        }),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (delegates) => {
          this.delegates.set(delegates);
        },
      });
  }

  navigateToAddDelegate(): void {
    this.navController.navigateForward('/pickup/delegate-pickup/add');
  }

  navigateToEditDelegate(pickupDelegatorId: number): void {
    const delegate = this.delegates().find((d) => d.id === pickupDelegatorId);
    if (!delegate) return;

    this.navController.navigateForward(
      `/pickup/delegate-pickup/edit/${pickupDelegatorId}`,
      {
        state: { delegate },
      },
    );
  }

  async openQrCodeSheet(pickupDelegatorId: number): Promise<void> {
    const delegate = this.delegates().find((d) => d.id === pickupDelegatorId);
    if (!delegate) return;

    const modal = await this.modalController.create({
      component: DelegateQrSheetComponent,
      componentProps: { delegate },
      breakpoints: [0.5, 0.8, 0.9, 1],
      initialBreakpoint: 1,
      handle: true,
      showBackdrop: true,
      backdropDismiss: true,
      cssClass: 'modal-sheet',
    });

    await modal.present();
  }

  handleToggleStatus(event: { id: number; status: DelegateStatus }): void {
    this.isSubmitting.set(true);
    this.delegateService
      .toggleDelegateStatus(event.id, event.status)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (updatedDelegate) => {
          // Only update the status from the response to preserve existing data (image, etc.)
          this.delegates.update((delegates) =>
            delegates.map((d) =>
              d.id === event.id ? { ...d, status: updatedDelegate.status } : d,
            ),
          );
          const statusKey =
            event.status === DelegateStatus.ACTIVE
              ? 'dismissal.delegate_activated_successfully.txt'
              : 'dismissal.delegate_deactivated_successfully.txt';
          this.toasterService.success(
            this.translocoService.translate(statusKey),
          );
        },
        error: (error) => {
          this.logService.error('Error toggling delegate status:', error);
          this.toasterService.error(
            this.translocoService.translate(
              'dismissal.failed_to_update_delegate_status.txt',
            ),
          );
        },
      });
  }

  async handleDeleteDelegate(pickupDelegatorId: number): Promise<void> {
    const confirmed = await this.feedbackService.openFeedbackModal(
      {
        type: 'error',
        modalTitle: this.translocoService.translate(
          'dismissal.delete_delegate_confirmation.txt',
        ),
        primaryBtnStr: this.translocoService.translate('global.delete.btn'),
        secondaryBtnStr: this.translocoService.translate('global.cancel.btn'),
      },
      undefined,
      undefined,
      false,
    );

    if (!confirmed) {
      return;
    }

    this.isSubmitting.set(true);
    this.delegateService
      .deleteDelegate(pickupDelegatorId)
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.delegates.update((delegates) =>
            delegates.filter((d) => d.id !== pickupDelegatorId),
          );
          this.toasterService.success(
            this.translocoService.translate(
              'dismissal.delegate_deleted_successfully.txt',
            ),
          );
        },
        error: (error) => {
          this.logService.error('Error deleting delegate:', error);
          const messageRef = error?.error?.messageRef;
          const message = messageRef
            ? this.translocoService.translate(messageRef)
            : this.translocoService.translate(
                'dismissal.delete_delegate_failed.txt',
              );
          this.toasterService.error(message);
        },
      });
  }
}
