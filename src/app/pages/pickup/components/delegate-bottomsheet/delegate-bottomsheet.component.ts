import {
  Component,
  Input,
  inject,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoDirective } from '@jsverse/transloco';
import { ModalController } from '@ionic/angular/standalone';
import { DsButtonComponent } from '@ds/button/button.component';
import { DsIconComponent } from '@ds/icon/icon.component';
import { DelegateStudentCardComponent } from '@pages/pickup/components/delegate-student-card/delegate-student-card.component';
import { DelegateScanService } from '@pages/pickup/data-access/delegate-scan.service';
import { DelegateInfo } from '@pages/pickup/data-access/delegate-scan.interface';
import { ImageSliderService } from '@ui-kit/hes-image-slider/image-slider.service';
import { SocketService } from '@shared/services/socket.service';
import { SOCKET_EVENTS } from '@pages/pickup/constants/pickup.constant';
import { DelegatePickupEmitPayload } from '@shared/dto-transformation/pick-up/pickup.interface';
import { PickupRequestStatus } from '@shared/enums';
import { faCheck, faCircleXmark } from '@fortawesome/pro-solid-svg-icons';
import { faExpand } from '@fortawesome/pro-regular-svg-icons';

@Component({
  selector: 'app-delegate-bottomsheet',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    DsButtonComponent,
    DsIconComponent,
    DelegateStudentCardComponent,
  ],
  templateUrl: './delegate-bottomsheet.component.html',
})
export class DelegateBottomsheetComponent implements OnInit {
  @Input() delegateInfo!: DelegateInfo;

  private readonly modalCtrl = inject(ModalController);
  private readonly delegateScanService = inject(DelegateScanService);
  private readonly imageSlider = inject(ImageSliderService);
  private readonly socketService = inject(SocketService);

  // Font Awesome icons
  readonly faCheck = faCheck;
  readonly faCircleXmark = faCircleXmark;
  readonly maximise = faExpand;

  readonly isSubmitting = signal(false);
  readonly selectedStudentIds = signal<Set<number>>(new Set());

  readonly selectedCount = computed(() => {
    return this.selectedStudentIds().size;
  });

  readonly canSubmit = computed(() => {
    return (
      this.selectedCount() > 0 &&
      !this.isSubmitting() &&
      this.delegateInfo?.isRequestAllowed
    );
  });

  readonly allowedStudents = computed(() => {
    return (
      this.delegateInfo?.students.filter((s) => s.status === 'allowed') ?? []
    );
  });

  ngOnInit(): void {
    // Initialize selected students based on delegateInfo
    const initiallySelected = this.delegateInfo.students
      .filter((s) => s.isSelected && s.status === 'allowed')
      .map((s) => s.id);
    this.selectedStudentIds.set(new Set(initiallySelected));
  }

  close(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  scanAgain(): void {
    this.modalCtrl.dismiss('scan_again', 'scan_again');
  }

  onStudentSelectionChange(studentId: number, isSelected: boolean): void {
    this.delegateScanService.updateStudentSelection(studentId, isSelected);
    // Update local reference
    const student = this.delegateInfo.students.find((s) => s.id === studentId);
    if (student) {
      student.isSelected = isSelected;
    }

    // Update signal to trigger reactivity
    this.selectedStudentIds.update((ids) => {
      const newIds = new Set(ids);
      if (isSelected) {
        newIds.add(studentId);
      } else {
        newIds.delete(studentId);
      }
      return newIds;
    });
  }

  async submitRequest(): Promise<void> {
    if (!this.canSubmit()) return;

    this.isSubmitting.set(true);

    const selectedStudentIds = Array.from(this.selectedStudentIds());

    const pickupDelegatorId = Number(this.delegateInfo.id);

    // Emit socket event for each selected student
    for (const studentId of selectedStudentIds) {
      const payload: DelegatePickupEmitPayload = {
        studentId,
        pickupDelegatorId,
        status: PickupRequestStatus.REQUESTED,
      };
      this.socketService.emit(SOCKET_EVENTS.PICKUP_REQUEST_PERSONNEL, payload);
    }

    this.modalCtrl.dismiss('scan_again', 'scan_again');
    this.isSubmitting.set(false);
  }

  expandImage(): void {
    if (this.delegateInfo?.imageUrl) {
      this.imageSlider.show([this.delegateInfo.imageUrl]);
    }
  }
}
