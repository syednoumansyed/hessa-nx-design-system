import {
  Component,
  computed,
  inject,
  input,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { NgStyle } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';
import { NoDataCardComponent } from '@shared/components/no-data-card/no-data-card.component';
import { CMSCourseContentService } from '../../data-access/cms/cms-course-content.service';
import {
  provideTranslocoLoadingTpl,
  TranslocoService,
} from '@jsverse/transloco';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { TopicFormComponent } from '../../components/topic-form/topic-form.component';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { faPlus } from '@fortawesome/pro-regular-svg-icons';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest } from 'rxjs';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { AuthService } from '@auth/auth.service';
import { isMobile } from '@shared/utils/platform';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';

import { CardListSkeletonComponent } from '@shared/components/card-list-skeleton/card-list-skeleton.component';
import {
  HesScope,
  NoSelectedScopeCardComponent,
} from '@shared/components/no-selected-scope-card/no-selected-scope-card.component';
import { CourseTopicDTO } from '@pages/course-management/data-access/course-content.dto';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { UserEventService } from '@shared/services/user-event.service';

@Component({
  selector: 'app-cms-course-topic',
  templateUrl: './cms-course-topic.page.html',
  standalone: true,
  imports: [
    HesButtonModule,
    IonContent,
    NoDataCardComponent,
    TopicFormComponent,
    RouterModule,
    CardListSkeletonComponent,
    NoSelectedScopeCardComponent,
    NgStyle,
  ],
  providers: [provideTranslocoLoadingTpl(`<p>loading...</p>`)],
})
export class CMSCourseTopicsPage {
  topicId = input.required<number>();
  readonly projectedTemplate = viewChild('projectedTemplate', {
    read: TemplateRef,
  });
  readonly requiredScopes: Array<HesScope> = ['school', 'academicYear'];

  private readonly cmsCourseContentService = inject(CMSCourseContentService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly academicYearScope = inject(AcademicYearsScopeService);
  private readonly schoolScopeService = inject(SchoolStructureScopeService);
  private readonly transloco = inject(TranslocoService);
  private readonly toastr = inject(HesToasterService);
  private readonly userEventService = inject(UserEventService);

  user = inject(AuthService).user;
  faPlus = faPlus;
  isMobile = isMobile();

  createTopicPermissionId = RESOURCE_PERMISSION.COURSE_CONTENT.CREATE.TOPIC;

  selectedAcademicYearId = computed(() => {
    return this.academicYearScope.selectedAcademicYear()?.id ?? null;
  });
  selectedSchoolId = this.schoolScopeService.selectedSchoolId;

  topicDetails = signal<CourseTopicDTO | null>(null);

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

  constructor() {
    combineLatest([
      toObservable(this.schoolScopeService.selectedSchoolId),
      toObservable(this.academicYearScope.selectedAcademicYear),
      toObservable(this.academicYearScope.selectedSemester),
    ])
      .pipe(takeUntilDestroyed())
      .subscribe(([_schoolId, _academicYear, _semester]) => {
        this.getTopicDetails();
      });
  }

  ionViewWillEnter() {
    this.getTopicDetails();
  }

  getTopicDetails() {
    if (this.topicId()) {
      this.cmsCourseContentService
        .getCourseTopicById(this.topicId())
        .subscribe({
          next: (res) => {
            this.topicDetails.set(res.data);
          },
          error: (_err) => {
            this.toastr.showGlobalWrongMessage();
          },
        });
    }
  }

  onTopicRemoved() {
    this.userEventService.markCourseAsUpdated();
  }
}
