import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { HesDatePipe } from '@shared/pipes/hessa-date.pipe';
import { EnumLangPipe } from '@shared/pipes/enum-lang.pipe';

export interface ProfileSectionDetailItem {
  label: string;
  value: string;
  type?: 'date' | 'enum' | 'phoneNumber';
  actionLabel?: string;
  onAction?: () => void;
}

@Component({
  selector: 'app-profile-section-details',
  templateUrl: './profile-section-details.component.html',
  standalone: true,
  imports: [CommonModule, HesDatePipe, EnumLangPipe],
})
export class ProfileSectionDetailsComponent {
  @Input() items: ProfileSectionDetailItem[] = [];

  isIsoDate(value: string): boolean {
    const isoDateRegex =
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

    if (!isoDateRegex.test(value)) {
      return false;
    }

    const date = new Date(value);
    return !isNaN(date.getTime());
  }
}
