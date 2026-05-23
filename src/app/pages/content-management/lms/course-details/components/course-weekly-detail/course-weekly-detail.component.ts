import {
  Component,
  computed,
  effect,
  inject,
  input,
  model,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { CourseDetailTodoItem } from '../../data-access/course-detail.dto';
import { CourseDetailApiService } from '../../data-access/course-detail-api.service';
import { TranslocoDirective } from '@jsverse/transloco';
import { DsTabsComponent, Tab } from '@ds/tabs/tabs.component';
import { DsChipComponent } from '@ds/chip/chip.component';
import { TodoWeeklyItemsComponent } from '../todo-weekly-items/todo-weekly-items.component';
import { CourseDetailWeeklyItemsComponent } from '../course-detail-weekly-items/course-detail-weekly-items.component';
import {
  CarousalComponent,
  DsCarouselSlide,
} from '@ds/carousal/carousal.component';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { createFormatToDsDate } from '@ds/utils/ds-date';
import { CourseDetailSkeletonComponent } from '../course-detail-skeleton/course-detail-skeleton.component';
import { DsButtonComponent } from '@ds/button/button.component';
import { DsExpandableComponent } from '@ds/expandable/expandable.component';
import { DsObjId } from '@ds/common.types';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  Subject,
  switchMap,
  of,
} from 'rxjs';
import { HesEditorComponent } from '@ui-kit/hes-editor/hes-editor.component';
import { FormsModule } from '@angular/forms';
import { ObjId } from '@shared/interfaces/common.interface';
import { UserEventData } from '../course-work-item/course-work-item.component';
import { WorkItemType } from '../course-work-item/course-work-item.interface';
import {
  CourseDetailForStudent,
  CourseDetailTopicSummary,
} from '../../data-access/course-detail.interface';

export interface CourseWeeklyDetailConfig {
  academicYearId: number;
  semesterId: ObjId;
  schoolId: number;
  studentId: number;
  courseId: number;
}

enum TabsState {
  ALL = 'ALL',
  TODO = 'TODO',
}

export enum CourseDetailContentFilterConfigUI {
  VIDEOS = 'VIDEO',
  ATTACHMENTS = 'ATTACHMENT',
  ASSIGNMENTS = 'ASSIGNMENT',
  EXAMS = 'EXAM',
}

export interface JumpToWeekConfig {
  weekId: string | number;
  filter: CourseDetailContentFilterConfigUI | null;
}

interface FetchWeeklyDetailParams {
  weekId: DsObjId;
  studentId: number;
  timeStamp?: number;
}

interface FilterOutdatedState {
  none?: boolean;
  [CourseDetailContentFilterConfigUI.VIDEOS]?: boolean;
  [CourseDetailContentFilterConfigUI.ATTACHMENTS]?: boolean;
  [CourseDetailContentFilterConfigUI.ASSIGNMENTS]?: boolean;
  [CourseDetailContentFilterConfigUI.EXAMS]?: boolean;
}

@Component({
  selector: 'app-course-weekly-detail',
  templateUrl: './course-weekly-detail.component.html',
  standalone: true,
  imports: [
    TranslocoDirective,
    DsTabsComponent,
    DsChipComponent,
    CarousalComponent,
    CourseDetailSkeletonComponent,
    DsButtonComponent,
    TodoWeeklyItemsComponent,
    CourseDetailWeeklyItemsComponent,
    HesEditorComponent,
    FormsModule,
    DsExpandableComponent,
  ],
})
export class CourseWeeklyDetailComponent implements OnInit {
  readonly courseDetail = input.required<CourseDetailForStudent>();
  readonly jumpToWeekConfig = model<JumpToWeekConfig | null>();
  readonly scopeParams = input.required<CourseWeeklyDetailConfig>();

  readonly reloadOverAllDetail = output<void>();
  private readonly courseDetailApiService = inject(CourseDetailApiService);
  private readonly translationService = inject(HesTranslateService);
  private readonly dateFormat = createFormatToDsDate();
  readonly activeFilter = signal<CourseDetailContentFilterConfigUI | null>(
    null,
  );
  readonly activeTab = signal<TabsState>(TabsState.ALL);
  readonly isAllTabActive = computed(() => this.activeTab() === TabsState.ALL);
  readonly selectedWeekDetail = signal<CourseDetailForStudent | null>(null);
  readonly weekDetailLoading = signal<boolean>(false);
  readonly todosLoading = signal<boolean>(false);
  readonly activeWeekId = signal<number | string | null>(null);
  readonly todoList = signal<CourseDetailTodoItem[]>([]);
  readonly activeSlideIndex = signal<number>(1);
  readonly fetchWeeklyDetail$ = new Subject<FetchWeeklyDetailParams>();

  // Filter outdated tracking system
  private readonly filterOutdatedState = signal<FilterOutdatedState>({});

  weeklyDetailVm = computed(() => {
    const { title, description, pendingAssignmentsCount, pendingExamsCount } =
      this.getTopic() || {};
    const todoCount =
      this.todoList().length ||
      (pendingAssignmentsCount || 0) + (pendingExamsCount || 0);
    return {
      title:
        title ??
        this.translationService.t('week_count', {
          count: this.getActiveWeekNumber(),
        }),
      description,
      todos: this.todoList(),
      todosLoading: this.todosLoading(),
      all: {
        filterConfig: FILTER_CONFIG,
      },
      tabsList: [
        {
          id: TabsState.ALL,
          label: 'global.all.txt',
        },
        {
          id: TabsState.TODO,
          label: 'content_management.todo',
          badge: todoCount,
        },
      ],
    };
  });

  readonly slides = signal<DsCarouselSlide[]>([]);

  showJumpToCurrentWeek = computed(() => {
    const currentWeekId = this.courseDetail()?.currentWeek?.id;
    if (!currentWeekId) return false;
    return Number(this.activeWeekId()) !== Number(currentWeekId);
  });

  constructor() {
    effect(() => {
      const jumpToWeekConfig = this.jumpToWeekConfig();
      if (jumpToWeekConfig) {
        this.activeWeekId.set(jumpToWeekConfig.weekId);
        this.activeFilter.set(jumpToWeekConfig.filter);
        this.resetTabToAll();
        this.setActiveSlideIndexByWeekId(jumpToWeekConfig.weekId);
        this.triggerWeeklyDetailFetch(jumpToWeekConfig.weekId);
      }
    });

    // Effect to watch for scope parameter changes and refetch data
    effect(() => {
      const courseDetail = this.courseDetail();
      // Only refetch if we have valid scope params and course detail
      if (courseDetail) {
        const currentWeekId =
          this.activeWeekId() ||
          courseDetail.currentWeek?.id ||
          courseDetail.weeks[0]?.id;
        if (currentWeekId) {
          this.activeWeekId.set(currentWeekId);
          this.onForceTriggerWeeklyDetailFetch();
        }
      }
    });
  }

  ngOnInit() {
    this.setupWeeklyDetailFetch();
    const detail = this.courseDetail();
    if (detail.currentWeek?.id) {
      this.triggerWeeklyDetailFetch(detail.currentWeek.id);
    } else {
      this.triggerWeeklyDetailFetch(detail.weeks[0]?.id);
    }

    this.slides.set(this.getSlides());
    // TODO: remove 1
    const activeIndex = this.slides().findIndex((slide) => slide.isHighlighted);
    this.activeSlideIndex.set(activeIndex < 0 ? 0 : activeIndex);
  }

  onTabChange(tabId: TabsState) {
    this.activeTab.set(tabId);
    if (tabId === TabsState.TODO) {
      this.fetchTodo();
    }
  }

  onFilterChange(filterValue: CourseDetailContentFilterConfigUI) {
    const currentFilter = this.activeFilter();

    if (currentFilter === filterValue) {
      this.activeFilter.set(null); // Deselect if already selected
      // Check if 'none' filter is dirty
      if (this.isFilterOutdated('none')) {
        this.onForceTriggerWeeklyDetailFetch();
      }
    } else {
      this.activeFilter.set(filterValue); // Select new filter
      // Check if this specific filter is dirty
      if (this.isFilterOutdated(filterValue)) {
        this.onForceTriggerWeeklyDetailFetch();
      }
    }
  }

  onWeekChange(id: DsObjId) {
    this.resetTabToAll();
    this.activeWeekId.set(Number(id));
    this.triggerWeeklyDetailFetch(id);
  }

  jumpToCurrentWeek() {
    const currentWeekId = this.courseDetail().currentWeek.id;
    this.jumpToWeekConfig.set({ weekId: currentWeekId, filter: null });
    this.onWeekChange(currentWeekId);
  }

  onUserEventTrigger(event: UserEventData) {
    if (event.hasIndicatorOnly === true) {
      // Only mark filters as dirty, don't fetch immediately
      this.markSpecificFilterAsOutdated(event.type);
      return;
    }
    if (
      event.type === WorkItemType.VIDEO ||
      event.type === WorkItemType.ATTACHMENT
    ) {
      this.reloadOverAllDetail.emit();
    }
  }

  private onForceTriggerWeeklyDetailFetch() {
    const weekId = this.activeWeekId();
    const studentId = this.scopeParams().studentId;
    const timeStamp = Date.now();
    if (weekId) {
      this.fetchWeeklyDetail$.next({ weekId, studentId, timeStamp });
    }
  }

  private setupWeeklyDetailFetch() {
    this.fetchWeeklyDetail$
      .asObservable()
      .pipe(
        distinctUntilChanged(
          (prev, curr) =>
            prev.weekId === curr.weekId &&
            prev.studentId === curr.studentId &&
            prev.timeStamp === curr.timeStamp,
        ),
        debounceTime(50),
        switchMap(({ weekId, studentId }) => {
          this.showLoading();
          const params = {
            ...this.getParam(),
            weekId,
            studentId,
            includeData: [
              'EXAM',
              'ASSIGNMENT',
              'ATTACHMENT',
              'VIDEO',
              'TOPIC',
            ].toString(),
          };
          return this.courseDetailApiService
            .fetchCourseContents(params)
            .pipe(catchError(() => of([])));
        }),
      )
      .subscribe({
        next: (data) => {
          const [weekDetail] = data;
          this.selectedWeekDetail.set(weekDetail);
          this.hideLoading();

          // Mark ALL filters as up-to-date after successful fetch since we have one API for all data
          this.markAllFiltersAsUpToDate();
        },
        error: (error) => {
          this.hideLoading();
          console.error('Error fetching course contents:', error);
        },
      });
  }

  private hideLoading() {
    this.weekDetailLoading.set(false);
  }

  private showLoading() {
    this.weekDetailLoading.set(true);
  }

  private getActiveWeekNumber() {
    const activeWeekId = this.activeWeekId();
    if (!activeWeekId) return null;
    return (
      this.courseDetail().weeks.find((week) => week.id === activeWeekId)
        ?.weekNumber || 0
    );
  }

  private fetchTodo() {
    const { studentId } = this.getParam();
    const topicId = this.getTopic()?.id;
    const weekId = this.activeWeekId();
    if (!topicId) return;
    const params = {
      topicId,
      studentId,
      ...(weekId && { weekId }),
    };
    this.todosLoading.set(true);
    this.courseDetailApiService.fetchCourseDetailTodo(params).subscribe({
      next: (data) => {
        this.todoList.set(data);
        this.todosLoading.set(false);
      },
      error: (error) => {
        this.todoList.set([]);
        this.todosLoading.set(false);
      },
    });
  }

  private getParam() {
    const scopeParams = this.scopeParams();
    return {
      academicYearId: scopeParams.academicYearId,
      semesterId: scopeParams.semesterId,
      schoolId: scopeParams.schoolId,
      studentId: scopeParams.studentId,
      courseId: scopeParams.courseId,
      weekId: this.activeWeekId() || this.courseDetail().currentWeek.id,
    };
  }

  private getTopic(): CourseDetailTopicSummary | undefined {
    const { topics } = this.selectedWeekDetail() || {};
    return topics?.[0];
  }

  private triggerWeeklyDetailFetch(weekId: DsObjId) {
    const studentId = this.scopeParams().studentId;
    this.fetchWeeklyDetail$.next({ weekId, studentId });
  }

  private getSlides(): DsCarouselSlide[] {
    const { currentWeek, weeks } = this.courseDetail() || {};
    return weeks.map((week) => ({
      id: week.id,
      boldTitle: this.translationService.t('week_count', {
        count: week.weekNumber,
      }),
      regularTitle: `(${this.dateFormat(week.startDate)} - ${this.dateFormat(week.endDate)})`,
      isHighlighted: currentWeek?.id === week.id,
    }));
  }

  private setActiveSlideIndexByWeekId(id: DsObjId) {
    const activeSlide = this.slides().findIndex((slide) => slide.id == id);
    this.activeSlideIndex.set(activeSlide);
  }

  // Filter outdated tracking helper methods
  private isFilterOutdated(
    filter: CourseDetailContentFilterConfigUI | 'none',
  ): boolean {
    const key =
      filter === 'none' ? 'none' : (filter as keyof FilterOutdatedState);
    return this.filterOutdatedState()[key] === true;
  }

  private markAllFiltersAsUpToDate(): void {
    // Reset all filters to clean state
    this.filterOutdatedState.set({});
  }

  private markSpecificFilterAsOutdated(workItemType: WorkItemType): void {
    const currentState = this.filterOutdatedState();
    const updatedState = { ...currentState };

    // Mark 'none' filter as outdated since it shows all items
    updatedState.none = true;

    // Mark specific filter type as outdated based on work item type
    switch (workItemType) {
      case WorkItemType.VIDEO:
        updatedState.VIDEO = true;
        break;
      case WorkItemType.ATTACHMENT:
        updatedState.ATTACHMENT = true;
        break;
      case WorkItemType.ASSIGNMENT:
      case WorkItemType.QUIZ:
        updatedState.ASSIGNMENT = true;
        break;
      case WorkItemType.EXAM:
        updatedState.EXAM = true;
        break;
    }

    this.filterOutdatedState.set(updatedState);
  }

  private resetTabToAll() {
    this.activeTab.set(TabsState.ALL);
    this.todoList.set([]);
  }
}

const FILTER_CONFIG = [
  {
    label: 'content_management.videos.title',
    value: CourseDetailContentFilterConfigUI.VIDEOS,
  },
  {
    label: 'content_management.attachments.title',
    value: CourseDetailContentFilterConfigUI.ATTACHMENTS,
  },
  {
    label: 'content_management.assignments.title',
    value: CourseDetailContentFilterConfigUI.ASSIGNMENTS,
  },
  {
    label: 'content_management.exams.title',
    value: CourseDetailContentFilterConfigUI.EXAMS,
  },
];
