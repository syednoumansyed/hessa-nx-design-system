import {
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  InfiniteScrollCustomEvent,
} from '@ionic/angular/standalone';
import { NoDataCardComponent } from '../../../../shared/components/no-data-card/no-data-card.component';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TopicFormComponent } from '../../components/topic-form/topic-form.component';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { faPlus } from '@fortawesome/pro-regular-svg-icons';
import { LMSCourseContentService } from '@pages/course-management/data-access/lms/lms-course-content.service';
import { StudentSelectionScopeService } from '@core/student-selection-scope.service';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserType } from '@shared/enums';
import { combineLatest, skip } from 'rxjs';
import { AuthService } from '@auth/auth.service';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { PageTitleService } from '@layout/page-title.service';
import { CourseListService } from '@pages/course-management/data-access/courses-list.service';
import { LayoutService } from '@layout/layout.service';
import { CardListSkeletonComponent } from '../../../../shared/components/card-list-skeleton/card-list-skeleton.component';
import {
  HesScope,
  NoSelectedScopeCardComponent,
} from '../../../../shared/components/no-selected-scope-card/no-selected-scope-card.component';
import { HesSubscription } from '@utils/hes-subscription.util';
import { UserEventService } from '@shared/services/user-event.service';

@Component({
  selector: 'app-lms-course-topics',
  templateUrl: './lms-course-topics.page.html',
  standalone: true,
  imports: [
    IonInfiniteScrollContent,
    IonInfiniteScroll,
    HesButtonModule,
    IonContent,
    CommonModule,
    NoDataCardComponent,
    TranslocoDirective,
    TopicFormComponent,
    RouterModule,
    CardListSkeletonComponent,
    NoSelectedScopeCardComponent,
  ],
})
export class LMSCourseTopicsPage implements OnInit, OnDestroy {
  readonly requiredScopes: Array<HesScope> = [
    'school',
    'academicYear',
    'semester',
  ];

  private readonly lmsCourseContentService = inject(LMSCourseContentService);
  private readonly route = inject(ActivatedRoute);
  private readonly academicYearScope = inject(AcademicYearsScopeService);
  private readonly studentScope = inject(StudentSelectionScopeService);
  private readonly schoolScopeService = inject(SchoolStructureScopeService);
  private readonly courseListService = inject(CourseListService);
  private readonly pageTitleService = inject(PageTitleService);
  private readonly layout = inject(LayoutService);
  private readonly transloco = inject(TranslocoService);
  private readonly userEventService = inject(UserEventService);
  private readonly subscription = new HesSubscription();

  user = inject(AuthService).user;

  faPlus = faPlus;

  selectedAcademicYearId = computed(() => {
    return this.academicYearScope.selectedAcademicYear()?.id ?? null;
  });

  selectedSemesterId = computed(() => {
    return this.academicYearScope.selectedSemester()?.id ?? null;
  });

  selectedStudentId = computed(() => {
    return this.studentScope.selectedStudent()?.id ?? null;
  });

  selectedSchoolId = this.schoolScopeService.selectedSchoolId;

  courseTopics = this.lmsCourseContentService.courseTopics;
  pagination = this.lmsCourseContentService.courseTopicsPagination;

  noDataCardConfig = computed(() => {
    return {
      mainImagePath: 'assets/illustrations/no_data.svg',
      title: this.transloco?.translate(
        'content_management.no_topics_added.title',
      ),
    };
  });

  isLoading = signal(false);

  subject = this.courseListService
    .coursesList()
    .find((c) => c.course.id === +this.route.snapshot.params['courseId']);
  subjectTitle = this.subject?.subject.displayName;

  constructor() {
    if (this.user()?.type !== UserType.GUARDIAN) {
      combineLatest([
        toObservable(this.schoolScopeService.selectedSchoolId),
        toObservable(this.academicYearScope.selectedAcademicYear),
        toObservable(this.academicYearScope.selectedSemester),
      ])
        .pipe(takeUntilDestroyed(), skip(1))
        .subscribe(([_schoolId, _academicYear, _semester]) => {
          this.refetchTopics();
        });
    } else {
      toObservable(this.studentScope.selectedStudent)
        .pipe(takeUntilDestroyed(), skip(1))
        .subscribe((_student) => {
          this.refetchTopics();
        });
    }
  }

  ngOnInit() {
    this.pageTitleService.setAliasValue(this.subjectTitle ?? '');
    this.subscription.add = this.userEventService.courseUpdated$.subscribe(
      () => {
        this.refetchTopics();
      },
    );
  }
  ionViewWillEnter() {
    this.pageTitleService.setAliasValue(this.subjectTitle ?? '');
    const currStudent = this.studentScope.selectedStudent();
    if (currStudent) {
      if (currStudent?.school?.class?.displayName) {
        this.layout.updateClassName(currStudent?.school?.class?.displayName);
      }
      if (currStudent?.school?.level?.displayName) {
        this.layout.updateLevelName(currStudent?.school?.level?.displayName);
      }
    }
  }
  ionViewDidEnter() {}
  ionViewDidLeave() {}

  updateTopic(_event: boolean) {
    this.refetchTopics();
  }

  refetchTopics() {
    this.isLoading.set(true);
    this.lmsCourseContentService
      .getCourseTopics({
        courseId: this.route.snapshot.params['courseId'],
        academicYearId: this.selectedAcademicYearId()!,
        semesterId: +this.selectedSemesterId()!,
        studentId: this.selectedStudentId() ?? undefined,
      })
      .subscribe({
        next: () => {
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        },
      });
  }

  onIonInfinite(ev: InfiniteScrollCustomEvent) {
    this.lmsCourseContentService
      .getCourseTopics(
        {
          courseId: this.route.snapshot.params['courseId'],
          academicYearId: this.selectedAcademicYearId()!,
          pageNumber: this.pagination()?.pageNumber! + 1,
          semesterId: +this.selectedSemesterId()!,
          studentId: this.selectedStudentId() ?? undefined,
        },
        true,
        ev,
      )
      .subscribe();
  }

  onTopicExpanded(isExpanded: boolean, topicId: number, index: number) {
    if (isExpanded && topicId) {
      this.lmsCourseContentService
        .getCourseTopicById(topicId.toString(), this.selectedStudentId()!)
        .subscribe({
          next: (res) => {
            this.lmsCourseContentService.updateTopicByIndex(index, res.data);
          },
          error: (_res) => {},
        });
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
