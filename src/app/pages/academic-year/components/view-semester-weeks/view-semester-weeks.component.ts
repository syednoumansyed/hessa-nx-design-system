import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  inject,
  Inject,
  OnInit,
  signal,
} from '@angular/core';
import { DsIconComponent } from '@ds/icon/icon.component';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { provideIcons } from '@ng-icons/core';
import { saxCloseCircleBold } from '@ng-icons/iconsax/bold';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';
import { TuiDialogContext } from '@taiga-ui/core';
import { isMobile } from '@shared/utils/platform';
import { AcademicYearApiService } from '@pages/academic-year/data-access/academic-year-api.service';
import { SemesterDTO } from '@pages/academic-year/data-access/academic-year.dto';
import { HesDatePipe } from '@shared/pipes/hessa-date.pipe';
import {
  faCalendarCheck,
  faCommentMinus,
  faPen,
} from '@fortawesome/pro-regular-svg-icons';
import { AcademicYearUtils } from '@pages/academic-year/utils/academic-year.utils';
import { faIslandTreePalm, faTrashCan } from '@fortawesome/pro-solid-svg-icons';
import { AcademicYearStateService } from '@pages/academic-year/data-access/academic-year-state.service';
import { Router } from '@angular/router';
import { AcademicYearModalService } from '@pages/academic-year/utils/academic-year-modal.service';
import { FeedbackService } from '@shared/services/feedback.service';
import { format, setDay } from 'date-fns';
import { enUS, arSA } from 'date-fns/locale';
import { RbacDirective } from '@shared/role-bace-acces-controller/rbac.directive';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';

export interface mappedSemesterDTO {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  academicYearId: number;
}

export type mappedWeekDTO = {
  id: number;
  weekNumber: number;
  startDate: string;
  endDate: string;
  weekDays: string[];
  isCurrentWeek: boolean;
  weekOff: boolean;
};

@Component({
  selector: 'app-view-semester-weeks',
  templateUrl: './view-semester-weeks.component.html',
  standalone: true,
  imports: [
    CommonModule,
    TranslocoDirective,
    DsIconComponent,
    HesDatePipe,
    RbacDirective,
  ],
  viewProviders: [
    provideIcons({
      saxCloseCircleBold,
    }),
  ],
})
export class ViewSemesterWeeksComponent implements OnInit {
  private readonly hesTranslateService = inject(HesTranslateService);
  private readonly academicYearApiService = inject(AcademicYearApiService);
  private readonly academicYearStateService = inject(AcademicYearStateService);
  private readonly academicYearModalService = inject(AcademicYearModalService);
  private readonly router = inject(Router);
  private readonly feedbackService = inject(FeedbackService);
  private readonly translocoService = inject(TranslocoService);
  readonly academicYearUtils = AcademicYearUtils;

  semesterId = signal<number | null>(null);
  semesterData = signal<mappedSemesterDTO | null>(null);
  weeksListData = signal<mappedWeekDTO[]>([]);
  isDeleteAllowed = computed(() => {
    const semesterId = this.semesterId();
    if (semesterId === null) {
      return false;
    }
    const semesterList = this.academicYearStateService.semesterListData();
    if (semesterList.length === 0) {
      return false;
    }
    const lastSemester = semesterList[semesterList.length - 1];
    return lastSemester.id.toString() === semesterId.toString();
  });
  isViewOnly = computed(() => {
    return this.context?.data?.isViewOnly ?? false;
  });

  editSemesterPermission = RESOURCE_PERMISSION.semester.semesterUpdate;
  deleteSemesterPermission = RESOURCE_PERMISSION.semester.semesterDelete;

  isMobile = isMobile();
  faPen = faPen;
  faTrash = faTrashCan;
  faCalendar = faCalendarCheck;
  faComment = faCommentMinus;
  faTree = faIslandTreePalm;
  currentLang: string = '';

  constructor(
    @Inject(POLYMORPHEUS_CONTEXT)
    private readonly context: TuiDialogContext<any, any>,
  ) {}

  ngOnInit() {
    this.semesterId.set(this.context.data?.semesterId ?? null);
    this.fetchSemesterById();
    this.currentLang = this.translocoService.getActiveLang();
  }

  onClose() {
    this.context.completeWith(false);
  }

  mapSemesterData(semester: SemesterDTO) {
    this.semesterData.set({
      id: semester.id,
      name: semester.semesterNumber?.toString() ?? '',
      startDate: semester.startDate,
      endDate: semester.endDate,
      academicYearId: semester.academicYearId,
    });
    this.weeksListData.set(
      semester.weeks?.map((week) => ({
        id: week.id,
        weekNumber: week.weekNumber,
        startDate: week.startDate,
        endDate: week.endDate,
        weekDays: this.getWeekdays(week.weekDays),
        isCurrentWeek: week.isCurrentWeek,
        weekOff: week.weekOff,
      })) || [],
    );
  }

  fetchSemesterById() {
    const semesterId = this.semesterId();
    if (semesterId === null) {
      return;
    }
    return this.academicYearApiService.fetchSemesterById(semesterId).subscribe({
      next: (semester) => {
        this.mapSemesterData(semester);
      },
    });
  }

  onDeleteSemester() {
    const semesterId = this.semesterId();
    if (semesterId === null) {
      return;
    }

    this.feedbackService.openFeedbackModal(
      {
        type: 'error',
        modalTitle: this.hesTranslateService.t(
          'academic_enrolment.semester_delete_msg.text',
        ),
        primaryBtnStr: this.hesTranslateService.t('global.delete.btn'),
        secondaryBtnStr: this.hesTranslateService.t('global.cancel.btn'),
      },
      () => {
        this.academicYearStateService.deleteSemester(
          semesterId.toString(),
          this.context,
        );
      },
    );
  }

  onEditSemester() {
    if (this.isMobile) {
      this.router.navigate([
        'academic-year',
        this.semesterData()?.academicYearId,
        'edit-semester',
        this.semesterId(),
      ]);
    } else {
      const academicYearId = this.semesterData()?.academicYearId;
      if (academicYearId) {
        this.academicYearModalService.openManageSemesterDialog(
          Number(academicYearId),
          this.semesterId() ?? undefined,
        );
      }
    }
    if (this.context) {
      this.context.completeWith(false);
    }
  }

  private getWeekdays(daysOfWeeks: number[]): string[] {
    const locale = this.currentLang === 'ar' ? arSA : enUS;

    return daysOfWeeks.map((n) =>
      format(setDay(new Date(), n), 'EEEE', { locale }),
    );
  }
}
