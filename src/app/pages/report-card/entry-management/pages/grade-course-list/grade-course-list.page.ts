import {
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ITableCol } from '@ui-kit/hes-table/model';
import { map, skip } from 'rxjs';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import {
  IReportCardCourseTableItem,
  ReportCardCourseDTO,
} from '@pages/report-card/entry-management/data-access/report-card-course.dto';
import { isWithinInterval, parseISO } from 'date-fns';
import { IAction } from '@ui-kit/hes-action-sheet/model';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { FaIconComponentsProps } from '@shared/types';
import { faCalendar } from '@fortawesome/pro-regular-svg-icons';
import { ReportCardService } from '@pages/report-card/entry-management/data-access/report-card.service';
import {
  InlineFilterConfig,
  ListViewContainerComponent,
} from '@ui-kit/hes-responsive-list-view/list-view-container/list-view-container.component';
import { TuiDay } from '@taiga-ui/cdk';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { Router } from '@angular/router';
import { formatToHesDate } from '@utils/date';
import { isRtl } from '@utils/platform';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { ReportCardCourse } from '../../data-access/report-card-course.interface';

@Component({
  selector: 'app-grade-course-list',
  templateUrl: './grade-course-list.page.html',
  styleUrls: ['./grade-course-list.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    FormsModule,
    TranslocoDirective,
    ListViewContainerComponent,
  ],
})
export class GradeCourseListPage implements OnInit {
  private readonly translocoService = inject(TranslocoService);
  private readonly academicYearService = inject(AcademicYearsScopeService);
  private readonly reportCardService = inject(ReportCardService);
  private readonly rbacService = inject(RoleBaseAccessControlService);
  private readonly router = inject(Router);
  private readonly isRtl = isRtl();
  private readonly destroyRef$ = inject(DestroyRef);

  private readonly isSuperAdmin = this.rbacService.isSuperAdmin();
  date = new Date().toISOString() ?? '';
  dateIcon: FaIconComponentsProps = {
    icon: faCalendar,
    size: 'lg',
  };

  protected readonly inlineFilterConfig: InlineFilterConfig = {
    type: 'date',
    initalValueDate: new Date(),
    clear: false,
    readonly: true,
    datePickerConfig: {
      max: TuiDay.currentLocal(),
    },
  };
  protected readonly noDataConfig = {
    title: this.translocoService.translate('grade_management.no_records.txt'),
  };

  isLoading = signal(false);
  rows = signal<IReportCardCourseTableItem[]>([]);

  readonly actions = computed<IAction<IReportCardCourseTableItem>[]>(() => {
    return [
      {
        button: {
          label: this.translocoService.translate(
            'grades_management.mark_grades.btn',
          ),
          color: 'primary',
          isDisabled: (data) => this.isSuperAdmin || !data.isActionAllowed,
        },
        mobileViewConfig: {
          isPrimaryBtn: true,
          buttonInfo: { color: 'primary' },
          disabled: (data) => !data.isActionAllowed,
        },
        text: this.translocoService.translate(
          'grades_management.mark_grades.btn',
        ),
        onClick: (data) => {
          this.router.navigate([
            `/grade-management/mark-report-card/${data.reportCardId}/${data.levelId}/${data.classId}/${data.subjectId}`,
          ]);
        },
        hasPermission: () => {
          return this.rbacService.hasPermission(
            RESOURCE_PERMISSION.GRADE_MANAGEMENT.TEACHER_MARKS.CREATE_MARK,
          );
        },
      },
    ];
  });

  protected readonly columns: ITableCol<IReportCardCourseTableItem>[] = [
    {
      field: 'subject',
      headerName: this.translocoService.translate('global.course.title'),
      sortable: false,
      filter: false,
    },
    {
      field: 'title',
      headerName: this.translocoService.translate(
        'grade_management.report_card_title.title',
      ),
      sortable: false,
      filter: false,
    },
    {
      field: 'level',
      headerName: this.translocoService.translate('global.level.title'),
      sortable: false,
      filter: false,
    },
    {
      field: 'classInfo',
      headerName: this.translocoService.translate('global.class.title'),
      sortable: false,
      filter: false,
      type: 'text',
    },
    {
      field: 'entryPeriod',
      headerName: this.translocoService.translate(
        'grade_management.entry_period.label',
      ),
      sortable: false,
      filter: false,
    },
    {
      field: 'lastEntry',
      headerName: this.translocoService.translate('global.last_entry.title'),
      sortable: false,
      filter: false,
    },
    {
      field: 'actions',
      headerName: this.translocoService.translate(
        'course_management.action.placeholder',
      ),
      sortable: false,
      filter: false,
      type: 'action',
      actions: this.actions(),
      forceActionSheet: false,
      lockPosition: true,
      minWidth: 175,
    },
  ];

  constructor() {}

  private readonly selectedSemesterScope$ = toObservable(
    this.academicYearService.selectedSemester,
  ).pipe(takeUntilDestroyed(), skip(1));

  listViewRef = viewChild(ListViewContainerComponent);

  ngOnInit() {
    this.selectedSemesterScope$
      .pipe(takeUntilDestroyed(this.destroyRef$))
      .subscribe(() => {
        this.listViewRef()?.triggerFetch();
      });
  }

  getCourses = (params: any) => {
    const param = {
      semesterId: this.academicYearService.selectedSemester()?.id!,
    };

    return this.reportCardService.getCourseList(param).pipe(
      map((resp) => {
        return {
          data: this.mapToTableData(resp),
          message: '',
        };
      }),
    );
  };

  mapToTableData(list: ReportCardCourse[]): IReportCardCourseTableItem[] {
    return list.map((item) => {
      // use date-fns to check if the date is in range
      const startDate = parseISO(item.reportCard.startDate);
      const endDate = parseISO(item.reportCard.endDate);
      const isDateInRange = isWithinInterval(new Date(), {
        start: startDate,
        end: endDate,
      });
      const date =
        item.lastEntry?.[0]?.updatedAt ||
        item.lastEntry?.[0]?.createdAt ||
        null;
      return {
        subject: item.subject.displayName,
        subjectId: item.subject.id,
        level: item.level.displayName,
        levelId: item.level.id,
        classInfo: item.class.displayName,
        title: item.reportCard.title,
        lastEntry: date ? formatToHesDate(date) : null,
        entryPeriod:
          formatToHesDate(item.reportCard.startDate, this.isRtl) +
          ' - ' +
          formatToHesDate(item.reportCard.endDate, this.isRtl),
        classId: item.class.id,
        reportCardId: item.reportCard.id,
        reportCardTitle: item.reportCard.title,
        isActionAllowed: isDateInRange,
      };
    });
  }
}
