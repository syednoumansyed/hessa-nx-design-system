import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  input,
  Output,
  computed,
} from '@angular/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { DsButtonComponent } from '@ds/button/button.component';
import { DsIconComponent } from '@ds/icon/icon.component';
import { AvatarComponent } from '@ds/avatar/avatar.component';
import { HesTimePipe } from '@shared/pipes/hes-time.pipe';
import { HesDatePipe } from '@shared/pipes/hessa-date.pipe';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { ImageSliderService } from '@ui-kit/hes-image-slider/image-slider.service';
import { Clipboard } from '@capacitor/clipboard';
import { faCheck, faPhoneVolume } from '@fortawesome/pro-solid-svg-icons';
import { faClockRotateLeft, faCopy } from '@fortawesome/pro-regular-svg-icons';
import {
  PickupPersonnelType,
  PickupRequestBy,
  PickupRequestStatus,
} from '@shared/enums';
import {
  DenialReason,
  PickupResponse,
} from '@shared/dto-transformation/pick-up/pickup.interface';

@Component({
  selector: 'app-pickup-personnel-card',
  standalone: true,
  templateUrl: './pickup-personnel-card.component.html',
  imports: [
    CommonModule,
    TranslocoDirective,
    DsButtonComponent,
    DsIconComponent,
    AvatarComponent,
    HesTimePipe,
    HesDatePipe,
  ],
})
export class PickupPersonnelCardComponent {
  private readonly toasterService = inject(HesToasterService);
  private readonly translocoService = inject(TranslocoService);
  private readonly imageSlider = inject(ImageSliderService);

  // Inputs
  data = input.required<PickupResponse>();
  personnelType = input<PickupPersonnelType>(PickupPersonnelType.GUARD);
  denialReasons = input<DenialReason[]>([]);
  isHistory = input<boolean>(false);

  // Outputs
  @Output() onAccept = new EventEmitter<PickupResponse>();
  @Output() onDecline = new EventEmitter<PickupResponse>();
  @Output() onLeftSchool = new EventEmitter<PickupResponse>();
  @Output() onTimelineClick = new EventEmitter<number>();

  // Icons
  readonly phoneIcon = faPhoneVolume;
  readonly copyIcon = faCopy;
  readonly checkIcon = faCheck;
  readonly clockRotateLeftIcon = faClockRotateLeft;

  // Enums for template
  readonly PickupRequestStatus = PickupRequestStatus;
  readonly PickupRequestBy = PickupRequestBy;
  readonly PickupPersonnelType = PickupPersonnelType;

  // Default avatar image
  readonly defaultAvatar = 'assets/illustrations/avatar-male-1.png';

  // Computed values for different states
  showWaitingStatus = computed(() => {
    // In history mode, show "Pending" status instead
    if (this.isHistory()) return false;

    const status = this.data().pickupRequest?.status;
    const type = this.personnelType();

    // ADMIN_GUARD never sees waiting status - they can take action at all stages
    if (type === PickupPersonnelType.ADMIN_GUARD) {
      return false;
    }

    // Guard sees "Waiting" for REQUESTED status
    // Admin sees "Waiting" for IN_PROCESS status
    return (
      (status === PickupRequestStatus.REQUESTED &&
        type === PickupPersonnelType.GUARD) ||
      (status === PickupRequestStatus.IN_PROCESS &&
        type === PickupPersonnelType.ADMIN)
    );
  });

  showAcceptDeclineButtons = computed(() => {
    // In history mode, show "Pending" status instead
    if (this.isHistory()) return false;

    const status = this.data().pickupRequest?.status;
    const type = this.personnelType();

    // Admin and ADMIN_GUARD see Accept/Decline buttons for REQUESTED status
    return (
      status === PickupRequestStatus.REQUESTED &&
      (type === PickupPersonnelType.ADMIN ||
        type === PickupPersonnelType.ADMIN_GUARD)
    );
  });

  showLeftSchoolButton = computed(() => {
    // In history mode, show "Pending" status instead
    if (this.isHistory()) return false;

    const status = this.data().pickupRequest?.status;
    const type = this.personnelType();

    // Guard and ADMIN_GUARD see "Left School" button for IN_PROCESS status
    return (
      status === PickupRequestStatus.IN_PROCESS &&
      (type === PickupPersonnelType.GUARD ||
        type === PickupPersonnelType.ADMIN_GUARD)
    );
  });

  showLeftSchoolStatus = computed(() => {
    const status = this.data().pickupRequest?.status;

    // Both Guard and Admin see "Left School" status
    return status === PickupRequestStatus.LEFT_SCHOOL;
  });

  showMarkedPickedStatus = computed(() => {
    const status = this.data().pickupRequest?.status;

    // Both Guard and Admin see "Marked Picked" status
    return status === PickupRequestStatus.PICKED;
  });

  showDenialReason = computed(() => {
    const status = this.data().pickupRequest?.status;

    // Both Guard and Admin see denial reason
    return status === PickupRequestStatus.DENIED;
  });

  showPendingStatus = computed(() => {
    // Only show in history mode for REQUESTED or IN_PROCESS status
    if (!this.isHistory()) return false;

    const status = this.data().pickupRequest?.status;
    return (
      status === PickupRequestStatus.REQUESTED ||
      status === PickupRequestStatus.IN_PROCESS
    );
  });

  denialReasonText = computed(() => {
    const deniedOptionId = this.data().pickupRequest?.deniedOptionId;
    if (!deniedOptionId) return null;
    const reason = this.denialReasons().find((r) => r.id === deniedOptionId);
    return reason?.title ?? null;
  });

  // Methods
  handleAccept(): void {
    this.onAccept.emit(this.data());
  }

  handleDecline(): void {
    this.onDecline.emit(this.data());
  }

  handleLeftSchool(): void {
    this.onLeftSchool.emit(this.data());
  }

  handleTimelineClick(): void {
    const pickupRequestId = this.data().pickupRequest?.id;
    if (pickupRequestId) {
      this.onTimelineClick.emit(pickupRequestId);
    }
  }

  async handleCopyPhoneNumber(): Promise<void> {
    const phoneNumber = this.data().guardian.displayPhoneNumber;

    try {
      await Clipboard.write({
        string: phoneNumber,
      });

      this.toasterService.success(
        this.translocoService.translate('global.phone_number_copied.success'),
      );
    } catch (err) {
      console.log('Failed to copy phone number:', err);
      try {
        await navigator.clipboard.writeText(phoneNumber);
        this.toasterService.success(
          this.translocoService.translate('global.phone_number_copied.success'),
        );
      } catch (fallbackErr) {
        console.log('Failed to copy phone number with fallback:', fallbackErr);
      }
    }
  }

  handleCallPhoneNumber(): void {
    const phoneNumber = this.data().guardian.displayPhoneNumber;
    const telUrl = `tel:${phoneNumber}`;
    window.open(telUrl, '_self');
  }

  handleAvatarClick(): void {
    const imageUrl = this.data().imageUrl;
    if (imageUrl) {
      this.imageSlider.show([imageUrl]);
    }
  }
}
