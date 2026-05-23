import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { CourseCardComponent } from '@pages/content-management/lms/course-list/components/course-card/course-card.component';
import { DsTabsComponent } from '@ds/tabs/tabs.component';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { CourseTodoCardComponent } from '@pages/content-management/lms/course-list/components/course-todo-card/course-todo-card.component';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { StudentSelectionScopeService } from '@core/student-selection-scope.service';
import {
  CoursesTab,
  Language,
  TopicTodoFilter,
  TopicWorkItemType,
} from '@shared/enums';
import { CourseListService } from '@pages/content-management/lms/course-list/data-access/course-list.service';
import {
  HesScope,
  NoSelectedScopeCardComponent,
} from '@shared/components/no-selected-scope-card/no-selected-scope-card.component';
import { combineLatest } from 'rxjs';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { StudentCourseTodoDTO } from './data-access/course-list.dto';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { NoDataCardComponent } from '@shared/components/no-data-card/no-data-card.component';
import { formatDueDate } from './utils/due-date-formatter';
import { CourseTodoFiltersComponent } from './components/course-todo-filters/course-todo-filters.component';
import { AuthService } from '@auth/auth.service';
import { isMobile } from '@shared/utils/platform';
import { LayoutService } from '@layout/layout.service';
import { Router, ActivatedRoute } from '@angular/router';
import {
  StudentCourse,
  StudentCourseTodo,
} from './data-access/course-list.interface';

@Component({
  selector: 'app-course-list-page',
  templateUrl: './course-list.page.html',
  standalone: true,
  imports: [
    CommonModule,
    CourseCardComponent,
    DsTabsComponent,
    IonContent,
    CourseTodoCardComponent,
    NoSelectedScopeCardComponent,
    NoDataCardComponent,
    TranslocoDirective,
    IonSpinner,
    CourseTodoFiltersComponent,
  ],
})
export class CourseListPage implements OnInit {
  private readonly academicYearScope = inject(AcademicYearsScopeService);
  private readonly hesTranslateService = inject(HesTranslateService);
  private readonly schoolScopeService = inject(SchoolStructureScopeService);
  private readonly courseListService = inject(CourseListService);
  private readonly studentScope = inject(StudentSelectionScopeService);
  private readonly translocoService = inject(TranslocoService);
  private readonly authService = inject(AuthService);
  private readonly layoutService = inject(LayoutService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  isMobile = isMobile();
  readonly hasChildSidebar = this.layoutService.isChildSelectionRequired;
  coursesTab = CoursesTab;
  private currentLang: string = '';
  readonly requiredScopes: Array<HesScope> = ['school', 'academicYear'];

  courseNoDataConfig = {
    mainImagePath: 'assets/illustrations/no-data-course.svg',
    title: this.hesTranslateService.t('content_management.course_empty.title'),
    description: this.hesTranslateService.t(
      'content_management.course_empty.txt',
    ),
  };

  todoNoDataConfig = {
    mainImagePath: 'assets/illustrations/no-data-course-todo.svg',
    title: this.hesTranslateService.t('content_management.todo_empty.title'),
    description: this.hesTranslateService.t(
      'content_management.todo_empty.txt',
    ),
  };

  noDataConfig = computed(() => {
    return this.activeTabId() === CoursesTab.COURSES
      ? this.courseNoDataConfig
      : this.todoNoDataConfig;
  });

  selectedSchoolId = computed(() => {
    return this.schoolScopeService.selectedSchoolId();
  });

  selectedAcademicYearId = computed(() => {
    return this.academicYearScope.selectedAcademicYear()?.id;
  });

  selectedSemsterId = computed(() => {
    return this.academicYearScope.selectedSemester()?.id;
  });

  selectedStudentId = computed(() => {
    return this.studentScope.selectedStudent()?.id ?? null;
  });

  activeTabId = signal<CoursesTab>(CoursesTab.COURSES);
  displayContent = signal<boolean>(false);
  courseList = signal<StudentCourse[]>([]);
  todoList = signal<any[]>([]);
  isLoading = signal<boolean>(true);
  tabsData = signal<Array<{ id: CoursesTab; label: string; badge?: number }>>([
    {
      id: CoursesTab.COURSES,
      label: this.hesTranslateService.t('global.courses.title'),
    },
    {
      id: CoursesTab.TODO,
      label: this.hesTranslateService.t('content_management.todo'),
      badge: 0, // This will be updated dynamically
    },
  ]);
  todoFilter = signal<TopicTodoFilter | undefined>(undefined);

  constructor() {
    combineLatest([
      toObservable(this.schoolScopeService.selectedSchoolId),
      toObservable(this.academicYearScope.selectedAcademicYear),
      toObservable(this.academicYearScope.selectedSemester),
      toObservable(this.studentScope.selectedStudent),
      toObservable(this.activeTabId),
    ])
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.getStudentCoursesList();
        this.getStudentTodoWorkList();
      });
  }

  ionViewWillEnter() {
    this.getStudentCoursesList();
    this.getStudentTodoWorkList();
  }

  ngOnInit() {
    this.currentLang = this.translocoService.getActiveLang();
  }

  onTabChanged(id: string) {
    this.activeTabId.set(id as CoursesTab);
    this.todoFilter.set(undefined);
  }

  handleDisplayContent(v: boolean) {
    this.displayContent.set(v);
  }

  getSubjectImage(attachments: StudentCourse['attachments']) {
    if (attachments && attachments.length === 1) {
      return attachments[0].url;
    }
    if (attachments && attachments.length > 1) {
      const attachment = attachments.find(
        (att) => att.language === this.currentLang,
      );
      return attachment?.url || 'assets/icons/subject-default.svg';
    }
    return 'assets/icons/subject-default.svg';
  }

  onFilterSelected(filterId: TopicTodoFilter | undefined) {
    this.todoFilter.set(filterId);
    this.getStudentTodoWorkList();
  }

  mapCourseListData(data: StudentCourse[]) {
    return data.map((course) => ({
      id: course.id,
      subject: course.subject,
      attachments: course.attachments,
      imageUrl: this.getSubjectImage(course.attachments),
      weeksCount: course.weeksCount,
      currentWeekNumber: course.currentWeekNumber,
      missedCount: course.missedCount,
      todoCount: course.todoCount,
      courseProgressPercentage: course.courseProgressPercentage,
      courseProgressStatus: course.courseProgressStatus,
    }));
  }

  mapCourseListTodoData(data: StudentCourseTodo[]) {
    return data.map((course) => {
      const dueDate = new Date(course.dueDate);
      const dueDateInfo = formatDueDate(
        dueDate,
        this.hesTranslateService,
        this.currentLang as Language,
      );
      return {
        id: course.id,
        type: course.type,
        title: course.title,
        dueDate: dueDate.toISOString(),
        imageUrl: this.getSubjectImage(course.attachments),
        attachments: course.attachments,
        topic: course.topic,
        subject: course.subject,
        courseId: course.courseId,
        workItemType: course.workItemType,
        dueString: dueDateInfo.label,
        dueColor: dueDateInfo.color,
        isMissed: dueDateInfo.isMissed,
      };
    });
  }

  private getStudentCoursesList() {
    let studentId;
    if (this.authService.user()?.type === 'STUDENT') {
      studentId = this.authService.user()?.userTypeId;
    } else {
      studentId = this.selectedStudentId();
    }
    this.isLoading.set(true);
    const params = {
      academicYearId: this.selectedAcademicYearId(),
      schoolId: this.selectedSchoolId() ?? undefined,
      semesterId: this.selectedSemsterId(),
      studentId: studentId ?? undefined,
    };

    this.courseListService.getStudentCoursesList(params).subscribe({
      next: (response) => {
        this.courseList.set(this.mapCourseListData(response));
        this.isLoading.set(false);
      },
      error: () => {
        this.courseList.set([]);
        this.isLoading.set(false);
      },
    });
  }

  private updateTodoTabBadge(todoCount: number) {
    this.tabsData.update((tabs) => {
      const todoTab = tabs.find((tab) => tab.id === CoursesTab.TODO);
      if (todoTab) {
        todoTab.badge = todoCount;
      }
      return tabs;
    });
  }

  private getStudentTodoWorkList() {
    let studentId;
    if (this.authService.user()?.type === 'STUDENT') {
      studentId = this.authService.user()?.userTypeId;
    } else {
      studentId = this.selectedStudentId();
    }
    this.isLoading.set(true);
    const params = {
      academicYearId: this.selectedAcademicYearId(),
      schoolId: this.selectedSchoolId() ?? undefined,
      semesterId: this.selectedSemsterId(),
      studentId: studentId ?? undefined,
      ...(this.todoFilter() !== undefined && { filterBy: this.todoFilter() }),
    };

    this.courseListService.getStudentTodoWorkList(params).subscribe({
      next: (todos) => {
        this.todoList.set(this.mapCourseListTodoData(todos));
        const todoCount = todos.length;
        if (this.todoFilter() === undefined) {
          this.updateTodoTabBadge(todoCount);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.todoList.set([]);
        if (this.todoFilter() === undefined) {
          this.updateTodoTabBadge(0);
        }
        this.isLoading.set(false);
      },
    });
  }

  onCourseClick(course: StudentCourse) {
    this.router.navigate(['../course', course.id], { relativeTo: this.route });
  }

  onTodoClick(todo: StudentCourseTodoDTO) {
    // Determine the route based on the todo type
    let routePath: string[];
    const { courseId, id } = todo;
    switch (todo.workItemType) {
      case TopicWorkItemType.ASSIGNMENT:
        routePath = [`../course/${courseId}/assignment/${id}`];
        break;
      case TopicWorkItemType.EXAM:
        routePath = [`../course/${courseId}/exam/${id}`];
        break;
      default:
        // Fallback to course detail if type is unknown
        routePath = [`../course/${courseId}`];
        break;
    }

    this.router.navigate(routePath, { relativeTo: this.route });
  }
}
