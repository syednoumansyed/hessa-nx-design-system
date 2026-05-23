import { Injectable, computed, inject, signal } from '@angular/core';
import { faEye, faPen, faTrashCan } from '@fortawesome/pro-light-svg-icons';
import { TranslocoService } from '@jsverse/transloco';
import { IAction } from '@ui-kit/hes-action-sheet/model';
import { ITableCol } from '@ui-kit/hes-table/model';

import { faPlus } from '@fortawesome/pro-regular-svg-icons';
import { ISelectValue } from '@shared/components/form-control-generator/form-control-generator.component';
import { CourseStatusCellComponent } from '../components/course-status-cell/course-status-cell.component';
import {
  ICourseData,
  ICourseResponse,
  IGenericIdName,
} from '@shared/interfaces/course.interface';
import { LectureTableCellComponent } from '../components/lecture-table-cell/lecture-table-cell.component';
import { LectureModalService } from '../utils/lecture-modal.service';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { activeInactiveDropdownOptions } from '@shared/utils/active-inactive-dropdown-select.util';
import { CourseManagementModalService } from '../utils/course-management-modal.service';
import { SchoolService } from '@pages/school-structure/pages/school/school.service';
import { CourseManagementService } from './course-management.service';
import { CourseManagement } from './course-management.interface';

export interface CoursesTableCol {
  id?: number;
  subjectId?: string;
  classId?: string;
  personnelId?: string;
  lectureId?: number;
  academicYearId?: string;
  companyId?: string;
  campusId?: string;
  schoolId?: string;
  levelId?: string;
  status?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CourseTableColDefService {
  private readonly schoolService = inject(SchoolService);
  private readonly courseService = inject(CourseManagementService);
  private readonly translocoService = inject(TranslocoService);
  private readonly lectureModalService = inject(LectureModalService);
  private readonly rbacService = inject(RoleBaseAccessControlService);
  private readonly academicYearsScopeService = inject(
    AcademicYearsScopeService,
  );

  private readonly courseManagementModalService = inject(
    CourseManagementModalService,
  );

  private readonly personnelsList = signal<ISelectValue[]>([]);

  private readonly lecturesList = signal<ISelectValue[]>([
    { value: 0, displayedValue: 'Sunday' },
    { value: 1, displayedValue: 'Monday' },
    { value: 2, displayedValue: 'Tuesday' },
    { value: 3, displayedValue: 'Wednesday' },
    { value: 4, displayedValue: 'Thursday' },
    { value: 5, displayedValue: 'Friday' },
    { value: 6, displayedValue: 'Saturday' },
  ]);

  updateTeacherList(schoolId?: number) {
    if (schoolId) {
      this.schoolService
        .getAllSchoolTeachers(schoolId)
        .subscribe((teachers) => {
          this.personnelsList.set(teachers);
        });
    } else {
      this.personnelsList.set([]);
    }
  }

  AcademicYearsListing = computed(() =>
    this.academicYearsScopeService
      .academicYears()
      .map((item) => ({ value: item.id, displayedValue: item.name })),
  );

  readonly actions = computed<IAction[]>(() => {
    return [
      {
        iconProps: { icon: faEye },
        hasPermission: () => {
          return this.rbacService.hasPermission(
            RESOURCE_PERMISSION.course.courseDetailView,
          );
        },
        text: this.translocoService.translate('global.view.btn'),
        onClick: (data) => {
          this.courseManagementModalService.onAddViewEditCourse(data.id, true);
        },
      },
      {
        iconProps: { icon: faPen },
        text: this.translocoService.translate('global.edit.btn'),
        onClick: (data) => {
          this.courseManagementModalService.onAddViewEditCourse(data.id);
        },
        hasPermission: () => {
          return this.rbacService.hasPermission(
            RESOURCE_PERMISSION.course.courseUpdate,
          );
        },
      },
      {
        iconProps: { icon: faPlus },
        text: this.translateCourse('course_management.add_lecture.btn'),
        onClick: (data) => {
          this.lectureModalService.openLectureForm(data.course);
        },
        hasPermission: () => {
          return this.rbacService.hasPermission(
            RESOURCE_PERMISSION.lecture.lectureCreate,
          );
        },
      },
      {
        iconProps: { icon: faTrashCan },
        text: this.translocoService.translate('global.delete.btn'),
        onClick: (data) => {
          this.courseManagementModalService.deleteCourse(
            data.id,
            data.hasContents,
          );
        },
        hasPermission: () => {
          return this.rbacService.hasSomePermission([
            RESOURCE_PERMISSION.course.courseDelete,
            RESOURCE_PERMISSION.course.courseDeleteWithContents,
          ]);
        },
      },
    ];
  });

  columns = computed<ITableCol<CoursesTableCol>[]>(() => [
    {
      field: 'subjectId',
      headerName: this.translateCourse('resource.course'),
      sortable: true,
      filter: true,
      filterType: 'select',
      filterPlaceholder: this.translateCourse('resource.course'),
      filterSelectOptions: this.courseService.teacherAndSubjectList(),
    },
    {
      field: 'personnelId',
      headerName: this.translateCourse('course_management.teacher.title'),
      sortable: true,
      filter: true,
      filterType: 'select',
      filterPlaceholder: this.translateCourse(
        'course_management.teacher.title',
      ),
      filterSelectOptionsSignal: this.personnelsList,
    },
    {
      field: 'lectureId',
      headerName: this.translateCourse('resource.lecture'),
      sortable: true,
      filter: true,
      filterType: 'select',
      filterPlaceholder: this.translateCourse('resource.lecture'),
      filterSelectOptions: this.lecturesList(),
      cellRenderer: LectureTableCellComponent,
    },
    {
      field: 'academicYearId',
      headerName: this.translocoService.translate('global.academic_year.title'),
      sortable: true,
      filter: true,
      filterType: 'select',
      filterPlaceholder: this.translocoService.translate(
        'global.academic_year.title',
      ),
    },
    {
      field: 'companyId',
      headerName: this.translateCourse('global.company.title'),
      sortable: true,
      filter: true,
      filterType: 'select',
      filterPlaceholder: this.translateCourse('global.company.title'),
      SchoolStructureListingType: 'company',
    },
    {
      field: 'creditHour',
      headerName: this.translateCourse('grade_management.credit_hour.txt'),
      sortable: true,
      filter: true,
      filterType: 'select',
      filterPlaceholder: this.translateCourse(
        'grade_management.credit_hour.txt',
      ),
    },
    {
      field: 'campusId',
      headerName: this.translateCourse('global.campus.title'),
      sortable: true,
      filter: true,
      filterType: 'select',
      filterPlaceholder: this.translateCourse('global.campus.title'),
      SchoolStructureListingType: 'campus',
    },
    {
      field: 'schoolId',
      headerName: this.translocoService.translate('global.school.title'),
      sortable: true,
      filter: true,
      filterType: 'select',
      filterPlaceholder: this.translocoService.translate('global.school.title'),
      SchoolStructureListingType: 'school',
    },
    {
      field: 'levelId',
      headerName: this.translocoService.translate('global.level.title'),
      sortable: true,
      filter: true,
      filterType: 'select',
      filterPlaceholder: this.translocoService.translate('global.level.title'),
      SchoolStructureListingType: 'level',
    },
    {
      field: 'classId',
      headerName: this.translocoService.translate('global.class.title'),
      sortable: true,
      filter: true,
      filterType: 'select',
      filterPlaceholder: this.translocoService.translate('global.class.title'),
      SchoolStructureListingType: 'class',
    },
    {
      field: 'status',
      headerName: this.translocoService.translate('global.status.title'),
      sortable: true,
      filter: true,
      filterType: 'select',
      filterPlaceholder: this.translocoService.translate('global.status.title'),
      filterSelectOptions: activeInactiveDropdownOptions(this.translocoService),
      cellRenderer: CourseStatusCellComponent,
      cellRendererParams: (data: CoursesTableCol) => {
        return data;
      },
    },
    {
      field: 'actions',
      headerName: this.translocoService.translate('global.actions.title'),
      sortable: false,
      filter: false,
      type: 'action',
      actions: this.actions(),
    },
  ]);

  mapTableData(data: CourseManagement[]) {
    return data.map((item: CourseManagement) => {
      return {
        id: item.id,
        subjectId: item.subject.displayName,
        subjectName: item.subject.displayName,
        classId: item.class.displayName,
        personnelId: item.personnel.displayName,
        lectureId: item?.lectures?.length,
        academicYearId: item.academicYear.name,
        companyId: item.company.displayName,
        campusId: item.campus.displayName,
        schoolId: item.school.displayName,
        levelId: item.level.displayName,
        status: item.status,
        lectures: item.lectures,
        creditHour: item.creditHour,
        course: item,
        hasContents: item.hasContents,
      };
    });
  }

  private translateCourse(key: string, params: object = {}): string {
    return this.translocoService.translate(key, params);
  }
}
