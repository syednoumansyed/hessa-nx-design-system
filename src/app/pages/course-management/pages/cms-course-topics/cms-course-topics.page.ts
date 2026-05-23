import {
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  OnInit,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import {
  CommonModule,
  NgClass,
  NgStyle,
  NgTemplateOutlet,
} from '@angular/common';
import {
  IonContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  InfiniteScrollCustomEvent,
} from '@ionic/angular/standalone';
import { NoDataCardComponent } from '@shared/components/no-data-card/no-data-card.component';
import { CMSCourseContentService } from '../../data-access/cms/cms-course-content.service';
import {
  provideTranslocoLoadingTpl,
  TranslocoDirective,
  TranslocoService,
} from '@jsverse/transloco';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { TopicFormComponent } from '../../components/topic-form/topic-form.component';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { faPlus } from '@fortawesome/pro-regular-svg-icons';
import { TemplateProjectionService } from '@shared/services/template-projection.service';
import { RbacDirective } from '@shared/role-bace-acces-controller/rbac.directive';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest, skip } from 'rxjs';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { AuthService } from '@auth/auth.service';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { BreadcrumbService } from '@ui-kit/hes-breadcrumbs/breadcrumb.service';
import { CourseListService } from '@pages/course-management/data-access/courses-list.service';
import { PageTitleService } from '@layout/page-title.service';
import { LayoutService } from '@layout/layout.service';

import { CardListSkeletonComponent } from '@shared/components/card-list-skeleton/card-list-skeleton.component';
import {
  HesScope,
  NoSelectedScopeCardComponent,
} from '@shared/components/no-selected-scope-card/no-selected-scope-card.component';
import { HesToasterService } from '@shared/services/hes-toaster.service';

@Component({
  selector: 'app-cms-course-topics',
  templateUrl: './cms-course-topics.page.html',
  standalone: true,
  imports: [
    IonInfiniteScrollContent,
    IonInfiniteScroll,
    HesButtonModule,
    IonContent,
    NoDataCardComponent,
    TranslocoDirective,
    TopicFormComponent,
    RouterModule,
    RbacDirective,
    CardListSkeletonComponent,
    NoSelectedScopeCardComponent,
    NgStyle,
    NgClass,
    NgTemplateOutlet,
  ],
  providers: [provideTranslocoLoadingTpl(`<p>loading...</p>`)],
})
export class CMSCourseTopicsPage implements OnInit, OnDestroy {
  readonly projectedTemplate = viewChild('projectedTemplate', {
    read: TemplateRef,
  });
  readonly requiredScopes: Array<HesScope> = [
    'school',
    'academicYear',
    'semester',
  ];

  private readonly projectionService = inject(TemplateProjectionService);
  private readonly cmsCourseContentService = inject(CMSCourseContentService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly academicYearScope = inject(AcademicYearsScopeService);
  private readonly schoolScopeService = inject(SchoolStructureScopeService);
  private readonly courseListService = inject(CourseListService);
  private readonly pageTitleService = inject(PageTitleService);
  private readonly transloco = inject(TranslocoService);
  private readonly toastr = inject(HesToasterService);
  private readonly layoutService = inject(LayoutService);
  private hasInitiallyLoaded = false;

  user = inject(AuthService).user;
  faPlus = faPlus;
  readonly isMobile = this.layoutService.isMobileOrTablet;

  createTopicPermissionId = RESOURCE_PERMISSION.COURSE_CONTENT.CREATE.TOPIC;

  selectedAcademicYearId = computed(() => {
    return this.academicYearScope.selectedAcademicYear()?.id ?? null;
  });

  semesterId = () => {
    return this.academicYearScope.selectedSemester()?.id;
  };

  courseTopics = this.cmsCourseContentService.courseTopics;
  pagination = this.cmsCourseContentService.courseTopicsPagination;
  selectedSchoolId = this.schoolScopeService.selectedSchoolId;

  noDataCardConfig = computed(() => {
    return {
      mainImagePath: 'assets/illustrations/no_data.svg',
      title: this.transloco.translate(
        'content_management.no_topics_added.title',
      ),
      description: this.transloco.translate(
        'content_management.adding_topic.txt',
      ),
      primaryButton: {
        label: this.transloco.translate('content_management.add_topic.btn'),
        onAction: () => {
          this.router.navigate(['add'], { relativeTo: this.route });
        },
      },
    };
  });

  isLoading = signal(false);

  subjectTitle = this.courseListService
    .mappedCoursesList()
    .find((c) => c.courseId === +this.route.snapshot.params['courseId'])?.title;

  constructor(private breadcrumbService: BreadcrumbService) {
    // Keep add-topic action synchronized with viewport mode (portrait/landscape)
    // and data readiness, so iPad rotation does not lose the button.
    effect(() => {
      const templateRef = this.projectedTemplate();
      const hasTopics = this.courseTopics().length > 0;
      const isCompact = this.isMobile();

      if (!templateRef || isCompact || !hasTopics) {
        this.projectionService.clearTemplate();
        return;
      }

      this.projectionService.renderTemplate(templateRef);
    });

    combineLatest([
      toObservable(this.schoolScopeService.selectedSchoolId),
      toObservable(this.academicYearScope.selectedAcademicYear),
      toObservable(this.academicYearScope.selectedSemester),
    ])
      .pipe(takeUntilDestroyed(), skip(1))
      .subscribe(([_schoolId, _academicYear, _semester]) => {
        this.refetchTopics();
      });
  }

  ngOnInit() {
    this.breadcrumbService.set('@subjectName', this.subjectTitle ?? '');
    this.pageTitleService.setAliasValue(this.subjectTitle ?? '');
  }
  ionViewWillEnter() {
    this.breadcrumbService.set('@subjectName', this.subjectTitle ?? '');
    this.pageTitleService.setAliasValue(this.subjectTitle ?? '');
    if (this.hasInitiallyLoaded) {
      this.refetchTopics();
    }
  }

  ionViewDidEnter() {
    this.hasInitiallyLoaded = true;
  }
  ionViewDidLeave() {
    this.projectionService.clearTemplate();
  }

  ngOnDestroy() {
    // Also clear template here in case ionViewDidLeave doesn't trigger
    // (e.g., when navigating via Angular router instead of Ionic NavController)
    this.projectionService.clearTemplate();
  }

  refetchTopics() {
    this.isLoading.set(true);
    this.cmsCourseContentService
      .getCourseTopics({
        courseId: this.route.snapshot.params['courseId'],
        academicYearId: this.selectedAcademicYearId()!,
        semesterId: this.semesterId() ? +this.semesterId()! : undefined,
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

  navigateToAddTopicPage() {
    this.router.navigate(['add'], { relativeTo: this.route });
  }

  onIonInfinite(ev: InfiniteScrollCustomEvent) {
    this.cmsCourseContentService
      .getCourseTopics(
        {
          courseId: this.route.snapshot.params['courseId'],
          academicYearId: this.selectedAcademicYearId()!,
          semesterId: this.semesterId() ? +this.semesterId()! : undefined,
          pageNumber: this.pagination()?.pageNumber! + 1,
        },
        true,
        ev,
      )
      .subscribe();
  }

  onTopicExpanded(isExpanded: boolean, topicId: number, index: number) {
    if (isExpanded && topicId) {
      if (this.isMobile()) {
        this.router.navigate([topicId], {
          relativeTo: this.route,
        });
      } else {
        this.cmsCourseContentService.getCourseTopicById(topicId).subscribe({
          next: (res) => {
            this.cmsCourseContentService.updateTopicByIndex(index, res.data);
          },
          error: (_res) => {
            this.toastr.showGlobalWrongMessage();
          },
        });
      }
    }
  }

  onTopicRemoved() {
    this.refetchTopics();
  }
}
