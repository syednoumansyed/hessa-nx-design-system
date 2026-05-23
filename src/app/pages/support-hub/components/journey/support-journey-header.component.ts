import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';
import { DsIconComponent } from '@ds/icon/icon.component';
import { AvatarComponent } from '@ds/avatar/avatar.component';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faChevronLeft,
  faChevronRight,
  faXmark,
} from '@fortawesome/pro-regular-svg-icons';
import { SupportJourneyStudent } from '@pages/support-hub/data-access/journey/support-journey-student.model';
import { LayoutService } from '@layout/layout.service';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { SupportTicketSchoolInfoComponent } from '../detail/support-ticket-school-info.component';

@Component({
  selector: 'app-support-journey-header',
  standalone: true,
  imports: [
    CommonModule,
    DsIconComponent,
    AvatarComponent,
    SupportTicketSchoolInfoComponent,
  ],
  templateUrl: './support-journey-header.component.html',
})
export class SupportJourneyHeaderComponent {
  private readonly layoutService = inject(LayoutService);
  private readonly hesTranslate = inject(HesTranslateService);

  readonly icon = input.required<IconDefinition>();
  readonly title = input.required<string>();
  readonly subtitle = input<string | null>(null);
  readonly backLabel = input<string>('Back to tickets');
  readonly closeLabel = input<string>('Close');
  readonly showBackButton = input<boolean>(true);
  readonly showCloseButton = input<boolean>(false);
  readonly students = input<readonly SupportJourneyStudent[]>([]);
  readonly studentsLabel = input<string>(this.hesTranslate.t('global.for'));
  readonly emptyLabel = input<string>(
    this.hesTranslate.t('global.select_student.label'),
  );
  readonly allowStudentSelection = input<boolean>(true);
  readonly schoolName = input<string | null>(null);
  readonly schoolCampusName = input<string | null>(null);
  readonly schoolLabel = input<string>(
    this.hesTranslate.t('global.school.label'),
  );
  readonly emptySchoolLabel = input<string>(
    this.hesTranslate.t('global.select_school.btn'),
  );
  readonly allowSchoolSelection = input<boolean>(false);

  readonly back = output<void>();
  readonly close = output<void>();
  readonly studentsRequested = output<void>();
  readonly schoolRequested = output<void>();

  protected readonly backIcon = faChevronLeft;
  protected readonly chevronIcon = faChevronRight;
  protected readonly closeIcon = faXmark;
  protected readonly isTabletOrDesktop = this.layoutService.isTabletOrDesktop;
  protected readonly isSplitView = computed(
    () => this.layoutService.windowClass() !== 'compact',
  );

  protected readonly hasStudents = computed(() => this.students().length > 0);
  protected readonly hasSchoolSelection = computed(() =>
    Boolean(this.schoolName()),
  );

  protected readonly maxVisibleStudents = computed(() =>
    this.isSplitView() ? 2 : 1,
  );

  protected readonly visibleStudents = computed(() => {
    const max = this.maxVisibleStudents();
    return this.students().slice(0, max);
  });

  protected readonly remainingCount = computed(() => {
    const total = this.students().length;
    const visible = this.maxVisibleStudents();
    const remaining = total - visible;
    return remaining > 0 ? remaining : 0;
  });

  protected readonly remainingLabel = computed(() => {
    const count = this.remainingCount();
    return count > 0 ? `+${count}` : '';
  });

  protected onBackClick(): void {
    this.back.emit();
  }

  protected onCloseClick(): void {
    this.close.emit();
  }

  protected onSelectStudents(): void {
    this.studentsRequested.emit();
  }

  protected onSelectSchool(): void {
    this.schoolRequested.emit();
  }
}
