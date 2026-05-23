import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { AuthService } from '@auth/auth.service';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { StudentSelectionScopeService } from '@core/student-selection-scope.service';
import { TranslocoService } from '@jsverse/transloco';
import { UserType } from '@shared/enums';
import { IResponse } from '@shared/interfaces';
import { ApiUrl } from '@shared/utils/api-url.util';
import { catchError, map, Observable, of } from 'rxjs';
import { ICourseSubject } from '../pages/courses-list/courses-list.page';
import {
  CoursesSubjectsQueryParam,
  CourseSubjectListItemDTO,
} from './courses-list.dto';
import { CourseSubjectListItem } from './courses-list.interface';
import { COURSE_LIST_MAP_FROM_DTO } from './courses-list-dto-transform';

@Injectable()
export class CourseListService {
  private readonly schoolScopeService = inject(SchoolStructureScopeService);
  private readonly academicYearScopeService = inject(AcademicYearsScopeService);
  private readonly authService = inject(AuthService);
  private readonly translocoService = inject(TranslocoService);

  selectedSchoolId = computed(() => {
    return this.schoolScopeService.selectedSchoolId();
  });
  selectedAcademicYearId = computed(() => {
    return this.academicYearScopeService.selectedAcademicYear()?.id;
  });
  selectedSemsterId = computed(() => {
    return this.academicYearScopeService.selectedSemester()?.id;
  });

  selectedStudent = inject(StudentSelectionScopeService).selectedStudent;

  user = this.authService.user;

  constructor(private http: HttpClient) {}

  private readonly _coursesList = signal<CourseSubjectListItem[]>([]);
  coursesList = this._coursesList.asReadonly();
  mappedCoursesList = computed<ICourseSubject[]>(() => {
    return this._coursesList().map((course) => {
      return {
        id: course.id,
        courseId: course.course.id,
        title: course.subject.displayName,
        image: this.getSubjectImage(course),
        info: [
          {
            label: course.level.displayName,
            src: 'assets/icons/level.svg',
          },
          {
            label: course.displayClasses,
            src: 'assets/icons/class.svg',
          },
          {
            label: this.getCourseTeachers(course),
            src: 'assets/icons/user.svg',
          },
        ],
        metadata: [
          {
            iconSrc: 'assets/icons/video-square.svg',
            iconClass: 'text-[#12B76A] lg:text-xl text-base',
            i18n: 'content_management.videos.title',
            count: course.videosCount,
          },
          {
            iconSrc: 'assets/icons/attachments.svg',
            iconClass: 'text-[#1570EF] lg:text-xl text-base',
            title: this.translocoService.translate('global.attachments.title'),
            i18n: 'global.attachments.title',
            count: course.attachmentsCount,
          },
          {
            iconSrc: 'assets/icons/task-square.svg',
            iconClass: 'text-[#1570EF] lg:text-xl text-base',
            i18n: 'content_management.assignments.title',
            count: course.assignmentsCount,
          },
          {
            iconSrc: 'assets/icons/exam.svg',
            iconClass: 'text-[#7F56D9] lg:text-xl text-base',
            i18n: 'content_management.exams.title',
            count: course.examsCount,
          },
        ],
      };
    });
  });

  mappedCoursesListLMS = computed<ICourseSubject[]>(() => {
    return this._coursesList().map((course) => {
      return {
        id: course.id,
        courseId: course.course.id,
        title: course.subject.displayName,
        image: this.getSubjectImage(course),
        info: [
          {
            label: this.getCourseTeachers(course),
            src: 'assets/icons/user.svg',
          },
        ],
        metadata: [
          {
            iconSrc: 'assets/icons/video-square.svg',
            bgClass: 'bg-green-100',
            iconClass: 'text-[#12B76A] lg:text-xl text-base',
            i18n: 'content_management.videos.title',
            count: course.videosCount,
            viewed: course.viewedVideoCount,
            statusLabel: 'content_management.videos_watched.txt',
          },
          {
            bgClass: 'bg-blue-100',
            iconSrc: 'assets/icons/attachments.svg',
            iconClass: 'text-[#1570EF] lg:text-xxl text-base',
            title: this.translocoService.translate('global.attachments.title'),
            i18n: 'global.attachments.title',
            count: course.attachmentsCount,
            viewed: course.viewedAttachmentCount,
            statusLabel: 'content_management.downloaded.title',
          },
          {
            bgClass: 'bg-blue-100',
            iconSrc: 'assets/icons/task-square.svg',
            iconClass: 'text-[#1570EF] lg:text-xl text-base',
            i18n: 'content_management.assignments.title',
            count: course.assignmentsCount,
            viewed: course.viewedAssignmentCount,
            statusLabel: 'global.submitted.txt',
          },
          {
            bgClass: 'bg-purple-100',
            iconSrc: 'assets/icons/exam.svg',
            iconClass: 'text-[#7F56D9] lg:text-xl text-base',
            i18n: 'content_management.exams.title',
            count: course.examsCount,
            viewed: course.viewedExamCount,
            statusLabel:
              'course_management.course_cards.exam_completion_status',
          },
        ],
      };
    });
  });

  getSubjectImage(courseSubject: CourseSubjectListItem) {
    if (courseSubject.attachments) {
      const firstWithActiveLang = courseSubject.attachments?.find(
        (attachment) => {
          return attachment.language === this.translocoService.getActiveLang();
        },
      )?.url;
      if (firstWithActiveLang) return firstWithActiveLang;
      return courseSubject.attachments[0]?.url;
    }
    return undefined;
  }

  noDataCardConfig = computed(() => {
    return {
      mainImagePath: 'assets/illustrations/no_data.svg',
      title: 'course_management.no_courses.title',
      description: 'content_management.no_courses_added.txt',
    };
  });

  getTeacherCourses(params?: Partial<CoursesSubjectsQueryParam>) {
    return this.http
      .get<IResponse<CourseSubjectListItemDTO[]>>(
        `${ApiUrl.v1BE}/courses/subjects/teachers`,
        {
          params: {
            ...params,
          },
        },
      )
      .pipe(
        map((resp) => {
          const mapData = COURSE_LIST_MAP_FROM_DTO.courseListItems(resp.data);
          this.updateCoursesList(mapData);
          return mapData;
        }),
      );
  }

  getStudentCourses(
    params: Partial<CoursesSubjectsQueryParam>,
  ): Observable<CourseSubjectListItem[]> {
    return this.http
      .get<IResponse<CourseSubjectListItemDTO[]>>(
        `${ApiUrl.v1BE}/courses/subjects/students`,
        {
          params: {
            ...params,
          },
        },
      )
      .pipe(
        map((resp) => {
          const mapData = COURSE_LIST_MAP_FROM_DTO.courseListItems(resp.data);
          this.updateCoursesList(mapData);
          return mapData;
        }),
      );
  }

  populateCourses(params?: Partial<CoursesSubjectsQueryParam>, isCMS = true) {
    let source: Observable<CourseSubjectListItem[]>;
    if (
      !this.selectedSchoolId() ||
      !this.selectedAcademicYearId() ||
      (!isCMS && !this.selectedSemsterId())
    ) {
      this.updateCoursesList([]);
      return;
    }

    const mergedParams: Partial<CoursesSubjectsQueryParam> = {
      schoolId: this.selectedSchoolId()!,
      academicYearId: this.selectedAcademicYearId(),
      ...(this.selectedSemsterId() && {
        semesterId: this.selectedSemsterId(),
      }),
      ...(this.selectedStudent() && {
        studentId: this.selectedStudent()?.id,
      }),
      ...params,
    };

    if (this.user()?.type === UserType.PERSONNEL) {
      source = this.getTeacherCourses(mergedParams).pipe(
        map((data) => {
          this.updateCoursesList(data);
          return data;
        }),
      );
    } else {
      if (this.user()?.type === UserType.GUARDIAN && !this.selectedStudent()) {
        this.updateCoursesList([]);
        return;
      }
      source = this.getStudentCourses(mergedParams).pipe(
        map((data) => {
          this.updateCoursesList(data);
          return data;
        }),
      );
    }

    return source
      ? source.pipe(
          catchError((error) => {
            console.error('Error fetching courses:', error);
            this.updateCoursesList([]);
            return of(null);
          }),
        )
      : null;
  }

  updateCoursesList(data: CourseSubjectListItem[]) {
    this._coursesList.set(data);
  }

  getCourseTeachers(course: CourseSubjectListItem) {
    if (course.coPersonnel?.displayName) {
      return (
        course.personnel.displayName + ', ' + course.coPersonnel.displayName
      );
    } else {
      return course.personnel.displayName;
    }
  }

  getLMSCourses(): Observable<CourseSubjectListItem[]> {
    const mergedParams: Partial<CoursesSubjectsQueryParam> = {
      schoolId: this.selectedSchoolId()!,
      academicYearId: this.selectedAcademicYearId(),
      ...(this.selectedSemsterId() && {
        semesterId: this.selectedSemsterId(),
      }),
      ...(this.selectedStudent() && {
        studentId: this.selectedStudent()?.id,
      }),
    };
    return this.getStudentCourses(mergedParams).pipe(
      map((mapData) => {
        this.updateCoursesList(mapData);
        return mapData;
      }),
    );
  }
}
