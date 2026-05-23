import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonImg,
  IonIcon,
  IonSkeletonText,
} from '@ionic/angular/standalone';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { combineLatest, skip } from 'rxjs';
import { StudentSelectionScopeService } from '@core/student-selection-scope.service';
import { AuthService } from '@auth/auth.service';
import { UserType } from '@shared/enums';
import { NoDataCardComponent } from '../../../../shared/components/no-data-card/no-data-card.component';
import { TranslocoDirective } from '@jsverse/transloco';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CourseListService } from '@pages/course-management/data-access/courses-list.service';
import { LayoutService } from '@layout/layout.service';
import { CardListSkeletonComponent } from '../../../../shared/components/card-list-skeleton/card-list-skeleton.component';
import {
  HesScope,
  NoSelectedScopeCardComponent,
} from '@shared/components/no-selected-scope-card/no-selected-scope-card.component';
import { CoursesSubjectsQueryParam } from '@pages/course-management/data-access/courses-list.dto';
import {
  CourseListFilterComponent,
  CourseListFilterParams,
} from './course-list-filter/course-list-filter.component';
import { CourseListLmsFilterComponent } from './course-list-lms-filter/course-list-lms-filter.component';
export interface ICourseSubject {
  id: number;
  courseId: number;
  title: string;
  info: Array<{
    src: string;
    label: string;
  }>;
  image?: string;
  metadata: Array<{
    bgClass?: string;
    iconSrc: string;
    iconClass: string;
    title?: string;
    i18n?: string;
    count: number;
    viewed?: number;
    statusLabel?: string;
  }>;
}

@Component({
  selector: 'app-courses-list',
  templateUrl: './courses-list.page.html',
  styleUrl: './courses-list.page.scss',
  standalone: true,
  imports: [
    IonSkeletonText,
    IonIcon,
    IonImg,
    IonContent,
    CommonModule,
    FormsModule,
    NoDataCardComponent,
    TranslocoDirective,
    RouterModule,
    CardListSkeletonComponent,
    NoSelectedScopeCardComponent,
    CourseListFilterComponent,
    CourseListLmsFilterComponent,
  ],
})
export class CoursesListPage implements OnInit {
  private readonly courseListService = inject(CourseListService);
  private readonly schoolScopeService = inject(SchoolStructureScopeService);
  private readonly academicYearScopeService = inject(AcademicYearsScopeService);
  private readonly studentSelectionScopeService = inject(
    StudentSelectionScopeService,
  );
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly layout = inject(LayoutService);

  private isFirstLoad = true;

  user = inject(AuthService).user;

  mappedCoursesList = this.courseListService.mappedCoursesList;
  mappedCoursesListLMS = this.courseListService.mappedCoursesListLMS;

  noDataCardConfig = this.courseListService.noDataCardConfig;

  selectedSchoolId = this.schoolScopeService.selectedSchoolId;
  selectedAcademicYear = this.academicYearScopeService.selectedAcademicYear;
  selectedSemester = this.academicYearScopeService.selectedSemester;

  isCMS = signal(!!this.route.snapshot.data['isCMS']);
  readonly requiredScopes = computed<Array<HesScope>>(() => {
    const isCMS = this.isCMS();

    return [
      'school',
      'academicYear',
      ...(!isCMS ? ['semester'] : []),
      ...(this.user()?.type === UserType.GUARDIAN ? ['student'] : []),
    ] as HesScope[];
  });

  isLoading = signal(false);

  constructor() {
    if (this.user()?.type !== UserType.GUARDIAN) {
      combineLatest([
        toObservable(this.schoolScopeService.selectedSchoolId),
        toObservable(this.academicYearScopeService.selectedAcademicYear),
        toObservable(this.academicYearScopeService.selectedSemester),
      ])
        .pipe(takeUntilDestroyed(), skip(1))
        .subscribe(([_schoolId, _academicYear, _semester]) => {
          this.isLoading.set(true);
          this.courseListService.populateCourses({}, this.isCMS())?.subscribe({
            next: () => {
              this.isLoading.set(false);
            },
            error: () => {
              this.isLoading.set(false);
            },
          });
        });
    } else {
      combineLatest([
        toObservable(this.academicYearScopeService.selectedAcademicYear),
        toObservable(this.academicYearScopeService.selectedSemester),
        toObservable(this.studentSelectionScopeService.selectedStudent),
      ])
        .pipe(takeUntilDestroyed(), skip(1))
        .subscribe(([_academicYear, _semester, currStudent]) => {
          this.isLoading.set(true);
          if (currStudent && !this.isCMS()) {
            if (currStudent?.school?.class?.displayName) {
              this.layout.updateClassName(
                currStudent?.school.class.displayName,
              );
            }
            if (currStudent?.school?.level?.displayName) {
              this.layout.updateLevelName(
                currStudent?.school.level.displayName,
              );
            }
          }
          this.courseListService.populateCourses({}, this.isCMS())?.subscribe({
            next: () => {
              this.isLoading.set(false);
            },
            error: () => {
              this.isLoading.set(false);
            },
          });
        });
    }
  }

  navigateToCourseContent(course: ICourseSubject): void {
    this.router.navigate([course.courseId, 'topics'], {
      relativeTo: this.route,
    });
  }

  ngOnInit() {}

  ionViewWillEnter() {
    const currStudent = this.studentSelectionScopeService.selectedStudent();
    if (currStudent && !this.isCMS()) {
      if (currStudent?.school?.class?.displayName) {
        this.layout.updateClassName(currStudent?.school.class.displayName);
      }
      if (currStudent?.school?.level?.displayName) {
        this.layout.updateLevelName(currStudent?.school.level.displayName);
      }
    }
    // Only call populateCourses if it's not the first time
    if (!this.isFirstLoad) {
      this.courseListService.populateCourses({}, this.isCMS())?.subscribe();
    } else {
      // Mark first load as complete
      this.isFirstLoad = false;
    }
  }

  onFiltersChange(filters: CourseListFilterParams) {
    const params: Partial<CoursesSubjectsQueryParam> = {
      academicYearId: this.courseListService.selectedAcademicYearId(),
      schoolId: this.courseListService.selectedSchoolId()!,
      semesterId: this.courseListService.selectedSemsterId(),
      ...(filters.personnelId ? { personnelId: filters.personnelId } : {}),
      ...filters,
    };
    this.courseListService.populateCourses(params, this.isCMS())?.subscribe();
  }
}
