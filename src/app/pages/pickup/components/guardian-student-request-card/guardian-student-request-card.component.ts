import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { faClock } from '@fortawesome/pro-regular-svg-icons';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { HesIconComponent } from '@shared/components/hes-icon/hes-icon.component';
import { PickupRequestStatus } from '@shared/enums';
import { PickupResponse } from '@shared/dto-transformation/pick-up/pickup.interface';
import { HesTimePipe } from '@shared/pipes/hes-time.pipe';
import { FaIconComponentsProps } from '@shared/types';
import { HesCheckboxModule } from '@ui-kit/hes-checkbox/hes-checkbox.module';
import { openPickupTimelineModal } from '@pages/pickup/pickup-timeline-modal';
import { DsModalService } from '@ds/modal/modal.service';
import { DenialReasonComponent } from '../denial-reason/denial-reason.component';
import { faPlusCircle } from '@fortawesome/pro-solid-svg-icons';
import { PickupStatusComponent } from '../pickup-status/pickup-status.component';
import { DsButtonComponent } from 'src/app/design-system/button/button.component';
import { DsIconComponent } from 'src/app/design-system/icon/icon.component';
import { AvatarComponent } from 'src/app/design-system/avatar/avatar.component';

import { SOCKET_EVENTS } from '@pages/pickup/constants/pickup.constant';
import { updatePickupStatus } from '@pages/pickup/utils/pickup-update.util';
import { FilePicker } from '@capawesome/capacitor-file-picker';
import { openUploadPictureModal } from '@pages/pickup/uplaod-picture-modal';
import { ImageSliderService } from '@ui-kit/hes-image-slider/image-slider.service';
import { SocketService } from '@shared/services/socket.service';
import { AttendanceStatus } from '@pages/attendance/data-access/attendance.dto';

@Component({
  selector: 'app-guardian-student-request-card',
  standalone: true,
  templateUrl: './guardian-student-request-card.component.html',
  imports: [
    CommonModule,
    HesIconComponent,
    HesCheckboxModule,
    TranslocoDirective,
    HesTimePipe,
    PickupStatusComponent,
    DsButtonComponent,
    DsIconComponent,
    AvatarComponent,
  ],
})
export class GuardianStudentRequestCardComponent implements OnInit {
  @Input() pickupInfo: PickupResponse;
  @Input() isTodaysDateSelected: boolean = true;
  @Output() onBtnClicked = new EventEmitter<{
    id: number;
    status: PickupRequestStatus;
  }>();
  @Input() isHistory: boolean = false;

  pickupRequestStatus = PickupRequestStatus;
  attendanceStatus = AttendanceStatus;
  currentLang: string = '';
  translocoService = inject(TranslocoService);
  private readonly modalService = inject(DsModalService);
  private readonly imageSlider = inject(ImageSliderService);
  private readonly socketService = inject(SocketService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly faClock: FaIconComponentsProps = {
    icon: faClock,
    size: 'sm',
  };

  readonly faPlus: FaIconComponentsProps = {
    icon: faPlusCircle,
    size: 'xl',
  };

  ngOnInit() {
    this.currentLang = this.translocoService.getActiveLang();
  }

  onTimelineClicked(timelineId: number | null | undefined) {
    if (timelineId == null) return;

    openPickupTimelineModal({
      modalService: this.modalService,
      translocoService: this.translocoService,
      timelineId,
    });
  }

  private openDenialReasonModal(timelineId: number): void {
    this.modalService.open({
      component: DenialReasonComponent,
      componentProps: {
        timelineId,
      },
      headerConfig: {
        title: this.translocoService.translate('dismissal.denial_reason.title'),
        showCloseButton: true,
      },
      size: 'sm',
    });
  }

  handleBtnClicked(status: PickupRequestStatus) {
    if (status === PickupRequestStatus.DENIED) {
      if (!this.pickupInfo.pickupRequest?.id) return;
      this.openDenialReasonModal(this.pickupInfo.pickupRequest.id);
      return;
    }
    const updated = updatePickupStatus(this.pickupInfo, { status });
    if (!updated.pickupRequest?.status) return;
    this.onBtnClicked.emit({
      id: updated.id,
      status: updated.pickupRequest.status,
    });
    // Keep local reference consistent so UI reflects latest
    this.pickupInfo = updated;
  }

  async initiateProfileUpload() {
    if (this.pickupInfo.imageUrl !== null && !this.pickupInfo.isAvatar) {
      this.imageSlider.show([this.pickupInfo.imageUrl]);
      return;
    }
    try {
      const result = await FilePicker.pickImages({
        limit: 1,
        readData: true,
      });

      if (result.files && result.files.length > 0) {
        const file = result.files[0];
        const imageBase64 = await this.convertFileToBase64(file.data as string);
        this.handleUpload(imageBase64);
      }
    } catch (error) {
      console.log('Error picking image', error);
    }
  }

  async handleUpload(imageBase64: string) {
    const profilePicture = await openUploadPictureModal({
      modalService: this.modalService,
      translocoService: this.translocoService,
      profilePicture: imageBase64,
      studentId: this.pickupInfo.id,
      hasExistingImage: !!this.pickupInfo.imageUrl,
    });

    if (profilePicture) {
      this.pickupInfo.imageUrl = profilePicture;
      this.pickupInfo.isAvatar = false;
      this.cdr.detectChanges();
      // Emit minimal payload for profile upload
      this.socketService.emit(SOCKET_EVENTS.PROFILE_UPLOADED_GUARDIAN, {
        studentId: this.pickupInfo.id,
        imageUrl: profilePicture,
        isAvatar: false,
      });
    }
  }

  async convertFileToBase64(fileData: string): Promise<string> {
    return `data:image/jpeg;base64,${fileData}`;
  }
}
