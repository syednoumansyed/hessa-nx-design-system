import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { DsButtonComponent } from '@ds/button/button.component';
import { DsIconComponent } from '@ds/icon/icon.component';
import { DsResponsiveMenuComponent } from '@ds/popup/responsive-menu/responsive-menu.component';
import { PopupItem } from '@ds/popup/types/popup.interface';
import { faEllipsisV, faExpand } from '@fortawesome/pro-solid-svg-icons';
import { faPen, faTrash } from '@fortawesome/pro-regular-svg-icons';
import { ImageSliderService } from '@ui-kit/hes-image-slider/image-slider.service';
import {
  Delegate,
  DelegateStatus,
} from '@pages/pickup/data-access/delegate.interface';
import { HesDatePipe } from '@shared/pipes/hessa-date.pipe';

@Component({
  selector: 'app-delegate-card',
  standalone: true,
  templateUrl: './delegate-card.component.html',
  imports: [
    CommonModule,
    TranslocoDirective,
    DsButtonComponent,
    DsIconComponent,
    DsResponsiveMenuComponent,
    HesDatePipe,
  ],
  styles: [
    `
      .expand-btn-bg {
        background-color: color-mix(
          in srgb,
          var(--colors-neutral-cool-black) 60%,
          transparent
        );
      }
    `,
  ],
})
export class DelegateCardComponent {
  private readonly imageSlider = inject(ImageSliderService);

  @Input({ required: true }) delegate!: Delegate;

  @Output() onShowQr = new EventEmitter<number>();
  @Output() onToggleStatus = new EventEmitter<{
    id: number;
    status: DelegateStatus;
  }>();
  @Output() onEdit = new EventEmitter<number>();
  @Output() onDelete = new EventEmitter<number>();

  readonly DelegateStatus = DelegateStatus;
  readonly expand = faExpand;
  readonly overflow = faEllipsisV;

  readonly menuItems: PopupItem[] = [
    {
      id: 'edit',
      title: 'global.edit.btn',
      icon: faPen,
    },
    {
      id: 'delete',
      title: 'global.delete.btn',
      icon: faTrash,
      state: 'danger',
    },
  ];

  readonly studentChipColors = [
    'bg-pastels-indigo-250',
    'bg-pastels-emerald-250',
    'bg-pastels-magenta-250',
    'bg-pastels-cyan-250',
    'bg-pastels-yellow-250',
  ];

  get isActive(): boolean {
    return this.delegate.status === DelegateStatus.ACTIVE;
  }

  get isExpired(): boolean {
    if (!this.delegate.expiryDate) return true;
    const expiryDate = new Date(this.delegate.expiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return expiryDate < today;
  }

  get statusBadgeClasses(): string {
    return this.isActive ? 'bg-pastels-green-200' : 'bg-pastels-errorRed-200';
  }

  get statusTextClasses(): string {
    return this.isActive ? 'status-success' : 'status-error';
  }

  getStudentChipColor(index: number): string {
    return this.studentChipColors[index % this.studentChipColors.length];
  }

  handleShowQr(): void {
    this.onShowQr.emit(this.delegate.id);
  }

  handleToggleStatus(): void {
    const newStatus = this.isActive
      ? DelegateStatus.INACTIVE
      : DelegateStatus.ACTIVE;
    this.onToggleStatus.emit({ id: this.delegate.id, status: newStatus });
  }

  handleEdit(): void {
    this.onEdit.emit(this.delegate.id);
  }

  handleMenuItemSelected(item: PopupItem): void {
    if (item.id === 'edit') {
      this.onEdit.emit(this.delegate.id);
    } else if (item.id === 'delete') {
      this.onDelete.emit(this.delegate.id);
    }
  }

  handleExpandImage(): void {
    if (this.delegate.url) {
      this.imageSlider.show([this.delegate.url]);
    }
  }
}
