import {
  Component,
  Input,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ToastrService } from 'ngx-toastr';
import {
  ProfileHeaderComponent,
  profileMetadata,
} from '@shared/components/profile-header/profile-header.component';
import { IAction } from '@ui-kit/hes-action-sheet/model';
import { ITableCol } from '@ui-kit/hes-table/model';
import { faEye } from '@fortawesome/pro-light-svg-icons';
import { faUserXmark } from '@fortawesome/pro-regular-svg-icons';
import { FeedbackService } from '@shared/services/feedback.service';
import { LevelsService } from '../level/data-access/levels.service';
import { IStudentListItem, IStudentQueryParams } from '@shared/interfaces';
import { StudentColDefinition } from './student-col-def.service';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { SchoolStructureListingService } from '@core/school-structure-listing.service';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { CardListItemSkeletonComponent } from '../../../../shared/components/card-list-item-skeleton/card-list-item-skeleton.component';
import { ISchool } from '@shared/interfaces/school.interface';
import { StudentsService } from '@pages/user-management/students/students.service';
import { mapStudentsToStudentListItems } from '@shared/services/students-listing.service';
import { Class } from '@shared/dto-transformation';
import {
  ListViewContainerComponent,
  ListViewNoDataConfig,
} from '@ui-kit/hes-responsive-list-view/list-view-container/list-view-container.component';
import { IListViewPrimaryAction } from '@ui-kit/hes-responsive-list-view/list-view.interface';
import { UserStatus } from '@shared/enums';
import { map } from 'rxjs';

@Component({
  selector: 'app-class',
  templateUrl: './class.page.html',
  standalone: true,
  imports: [
    ProfileHeaderComponent,
    TranslocoDirective,
    ListViewContainerComponent,
    CardListItemSkeletonComponent,
  ],
  providers: [
    StudentColDefinition,
    SchoolStructureListingService,
    { provide: 'useDefaultScopeSelection', useValue: false },
  ],
})
export class ClassPage implements OnInit {
  @Input() schoolId: number;
  @Input() levelId: number;
  @Input() classId: number;
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly transloco = inject(TranslocoService);
  private readonly levelApiService = inject(LevelsService);
  private readonly toastAlert = inject(ToastrService);
  private readonly feedbackService = inject(FeedbackService);
  private readonly studentColDefService = inject(StudentColDefinition);
  private readonly academicYearsScopeService = inject(
    AcademicYearsScopeService,
  );
  private readonly schoolStructureListingService = inject(
    SchoolStructureListingService,
  );
  private readonly studentService = inject(StudentsService);
  private readonly rbacService = inject(RoleBaseAccessControlService);
  private readonly viewContainerListRef = viewChild<ListViewContainerComponent>(
    ListViewContainerComponent,
  );

  readonly classDetails = signal<Class | undefined>(undefined);
  readonly studentsCount = signal<number>(0);
  readonly isClassInfoLoading = signal<boolean>(false);

  readonly classHeaderMetaData = computed<profileMetadata[]>(() => {
    const numberOfStudents = this.studentsCount();
    return [
      {
        hesIcon: {
          src: 'assets/icons/level.svg',
          class: 'text-base',
        },
        title: `${numberOfStudents} ${this.transloco.translate('global.students.title')}`,
      },
    ];
  });

  readonly actions: IAction<IStudentListItem>[] = [
    {
      iconProps: { icon: faEye },
      text: this.transloco.translate('global.view.btn'),
      onClick: (data) => {
        this.router.navigate([`user-management/students/${data.id}`]);
      },
      hasPermission: () =>
        this.rbacService.hasPermission(
          RESOURCE_PERMISSION.student.viewStudentProfile,
        ),
    },
    {
      iconProps: { icon: faUserXmark },
      text: this.transloco.translate('global.remove.btn'),
      onClick: (data) => this.unAssignStudentConfirmation(data),
      hasPermission: () =>
        this.rbacService.hasPermission(
          this.assignRemoveStudentFromClassPermissionId,
        ),
    },
  ];

  columns: ITableCol<IStudentListItem>[] = [];

  readonly assignRemoveStudentFromClassPermissionId =
    RESOURCE_PERMISSION.class.assignRemoveStudentFromClass;

  readonly noDataConfig: ListViewNoDataConfig = {
    mainImagePath: 'assets/illustrations/no_data.svg',
    title: this.transloco.translate('school_structure.no_students.title'),
    description: this.transloco.translate(
      'school_structure.no_students_msg.text',
    ),
    ...(this.rbacService.hasPermission(
      this.assignRemoveStudentFromClassPermissionId,
    ) && {
      primaryButton: {
        label: this.transloco.translate('school_structure.assign_student.btn'),
        onAction: () => this.redirectToAssign(),
      },
    }),
  };

  readonly primaryActions = computed<IListViewPrimaryAction[]>(() => [
    {
      text: this.transloco.translate('school_structure.assign_student.btn'),
      onClick: () => this.redirectToAssign(),
      isVisible: () =>
        this.rbacService.hasPermission(
          this.assignRemoveStudentFromClassPermissionId,
        ),
    },
  ]);

  fetchStudentList = (params: Record<string, any>) => {
    const academicYearId =
      this.academicYearsScopeService.selectedAcademicYear()?.id;

    const defaultParams: Partial<IStudentQueryParams> = {
      ...(this.schoolId && { schoolId: this.schoolId.toString() }),
      ...(this.levelId && { levelId: this.levelId.toString() }),
      ...(this.classId && { classId: this.classId }),
      ...(academicYearId && { academicYearId }),
      userStatuses: [UserStatus.ACTIVE, UserStatus.PAUSED].join(','),
      studentClassStatus: 'ACTIVE',
    };
    const { aId, ...restParams } = params;
    const listViewParams = {
      ...restParams,
      ...(aId && { academicYearId: aId }),
    };
    const queryParams = {
      ...defaultParams,
      ...listViewParams,
    } as IStudentQueryParams;

    if (queryParams.studentClassStatus === undefined) {
      queryParams.studentClassStatus = 'ACTIVE';
    }

    return this.studentService.fetchStudents(queryParams).pipe(
      map((resp) => {
        this.studentsCount.set(resp.paginate?.totalItems ?? resp.data.length);
        return {
          data: mapStudentsToStudentListItems(resp.data),
          paginate: resp.paginate,
        };
      }),
    );
  };

  ngOnInit(): void {
    this.initListingSchoolScopeFiltersWithCurrentClass();
    this.fetchClassDetail();

    this.columns = this.studentColDefService.columns(
      {
        studentClassStatus: 'ACTIVE',
        academicYearList: this.academicYearsScopeService.AcademicYearsListing(),
        academicYearId:
          this.academicYearsScopeService.selectedAcademicYear()?.id,
        isStudentClassStatusFilter: true,
      },
      this.actions,
    );
  }

  /**
   * Initializes the listing school scope filters with the current class.
   * Retrieves the school information from the route snapshot data and updates the selected company, campus, school, level, and class using the school structure listing service.
   */
  private initListingSchoolScopeFiltersWithCurrentClass() {
    const school: ISchool = this.route.snapshot.data['school'];
    this.schoolStructureListingService.updateSelectedCompany(
      school.campus.companyId,
    );
    this.schoolStructureListingService.updateSelectedCampus(school.campusId);
    this.schoolStructureListingService.updateSelectedSchool(+this.schoolId);
    this.schoolStructureListingService.updateSelectedLevel(+this.levelId);
    this.schoolStructureListingService.updateSelectedClass(+this.classId);
  }

  async unAssignStudentConfirmation(data: IStudentListItem) {
    await this.feedbackService.openFeedbackModal(
      {
        type: 'error',
        modalTitle: '',
        modalMessage: this.transloco.translate(
          'school_structure.student_remove_msg.text',
        ),
        primaryBtnStr: this.transloco.translate('global.delete.btn'),
        secondaryBtnStr: this.transloco.translate('global.cancel.btn'),
      },
      () => this.onUnassignStudent(data),
    );
  }

  onUnassignStudent(data: IStudentListItem) {
    const classId = data.studentClass?.id;
    const academicYearId = data.academicYearId;
    if (!classId || !academicYearId) {
      return;
    }

    this.levelApiService
      .unAssignStudentFromClass(classId, [data.id], academicYearId)
      .subscribe({
        next: (res) => {
          this.toastAlert.success(
            '',
            res.message ??
              this.transloco.translate(
                'global.remove_student_successfully.txt',
              ),
          );
          this.viewContainerListRef()?.triggerFetch();
        },
        error: (err) => {
          this.toastAlert.error(
            '',
            err.error.message ??
              this.transloco.translate('global.wrong_msg.title'),
          );
        },
      });
  }

  private fetchClassDetail() {
    this.isClassInfoLoading.set(true);
    this.levelApiService.getClassDetail(+this.classId).subscribe({
      next: (resp) => {
        this.classDetails.set(resp);
        this.isClassInfoLoading.set(false);
      },
      error: () => {
        this.classDetails.set(undefined);
        this.isClassInfoLoading.set(false);
      },
    });
  }

  redirectToAssign() {
    this.router.navigate(['./assign'], {
      relativeTo: this.route,
    });
  }

  onRowClicked(event: IStudentListItem) {
    this.router.navigateByUrl(`user-management/students/${event.id}`);
  }
}
