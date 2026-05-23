import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DsButtonComponent } from '@ds/button/button.component';
import { DsIconComponent } from '@ds/icon/icon.component';
import { faCalendar } from '@fortawesome/pro-regular-svg-icons';
import {
  faChevronLeft,
  faChevronRight,
  faEllipsisVertical,
} from '@fortawesome/pro-solid-svg-icons';
import { TranslocoDirective } from '@jsverse/transloco';
import { provideIcons } from '@ng-icons/core';
import { saxAddOutline } from '@ng-icons/iconsax/outline';
import { AcademicYearStateService } from '@pages/academic-year/data-access/academic-year-state.service';
import { AcademicYearUtils } from '@pages/academic-year/utils/academic-year.utils';
import { HesDatePipe } from '@shared/pipes/hessa-date.pipe';
import { RbacDirective } from '@shared/role-bace-acces-controller/rbac.directive';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { isRtl } from '@shared/utils/platform';
import { HesActionSheetComponent } from '@ui-kit/hes-action-sheet/hes-action-sheet.component';
import { IAction } from '@ui-kit/hes-action-sheet/model';
import { isSameDay, parseISO, toDate } from 'date-fns';

type MaybeDate = Date | string | null | undefined;
export interface ListDTO {
  id: string;
  title: string;
  dateFrom: string;
  dateTo?: string;
  isCurrent?: boolean;
}

@Component({
  selector: 'app-item-list-card',
  templateUrl: './item-list-card.component.html',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    DsButtonComponent,
    DsIconComponent,
    HesDatePipe,
    HesActionSheetComponent,
    RbacDirective,
  ],
  viewProviders: [
    provideIcons({
      saxAddOutline,
    }),
  ],
})
export class ItemListCardComponent {
  private readonly academicYearStateService = inject(AcademicYearStateService);
  private readonly route = inject(ActivatedRoute);

  academicYear = this.academicYearStateService.academicYear;

  isViewOnly = input<boolean>(false);
  holidayActions = input<IAction[]>([]);
  semesterList = input<ListDTO[]>();
  type = input<'semester' | 'holiday'>('semester');
  itemClick = output<string>();
  onAddSemesterClick = output<void>();

  asDate(v: MaybeDate): Date | null {
    if (!v) return null;
    return v instanceof Date ? v : parseISO(v);
  }

  readonly hideBtn = computed(() => {
    if (this.type() !== 'semester') return true;

    const semesters = this.semesterList() ?? [];
    if (semesters.length === 0) return false;

    const hasMaxSemesters = semesters.length === 4;

    const last = semesters[semesters.length - 1];
    const lastEnd = this.asDate(last?.dateTo);
    const ayEnd = this.asDate(this.academicYear()?.endDate);

    // Only compare when both ends are valid Dates
    const endsAligned =
      lastEnd !== null && ayEnd !== null && isSameDay(lastEnd, ayEnd);

    return hasMaxSemesters || endsAligned;
  });

  faChevronRight = faChevronRight;
  faChevronLeft = faChevronLeft;
  faCalendar = faCalendar;
  faEllipsisVertical = faEllipsisVertical;
  academicYearUtils = AcademicYearUtils;
  addSemesterPermission = RESOURCE_PERMISSION.semester.semesterCreate;
  isRtl = isRtl();

  onItemClick(id: string) {
    this.itemClick.emit(id);
  }

  onAddSemester() {
    this.onAddSemesterClick.emit();
  }
}
