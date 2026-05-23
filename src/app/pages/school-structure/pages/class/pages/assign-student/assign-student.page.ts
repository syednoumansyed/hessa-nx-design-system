import {
  Component,
  Input,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';
import { ActivatedRoute, Router } from '@angular/router';
import {
  TranslocoDirective,
  TranslocoModule,
  TranslocoService,
} from '@jsverse/transloco';
import { ToastrService } from 'ngx-toastr';
import { ITableCol } from '@ui-kit/hes-table/model';
import { StudentColDefinition } from '../../student-col-def.service';
import { IStudentListItem, IStudentQueryParams } from '@shared/interfaces';
import { LevelsService } from '@pages/school-structure/pages/level/data-access/levels.service';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { ISchool } from '@shared/interfaces/school.interface';
import { SchoolStructureListingService } from '@core/school-structure-listing.service';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { DEFAULT_PARAM as globalDefaultParam } from '@shared/constants/default-page-param.constant';
import { StudentsService } from '@pages/user-management/students/students.service';
import { mapStudentsToStudentListItems } from '@shared/services/students-listing.service';
import {
  ListViewContainerComponent,
  ListViewNoDataConfig,
} from '@ui-kit/hes-responsive-list-view/list-view-container/list-view-container.component';
import { IListViewPrimaryAction } from '@ui-kit/hes-responsive-list-view/list-view.interface';
import { UserStatus } from '@shared/enums';
import { map } from 'rxjs';

const DEFAULT_PARAM = {
  ...globalDefaultParam,
  onlyUnassignedStudents: true,
};
@Component({
  selector: 'app-assign-student',
  templateUrl: './assign-student.page.html',
  styleUrls: ['./assign-student.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    TranslocoModule,
    TranslocoDirective,
    ListViewContainerComponent,
  ],
  providers: [
    StudentColDefinition,
    SchoolStructureListingService,
    { provide: 'useDefaultScopeSelection', useValue: false },
  ],
})
export class AssignStudentPage implements OnInit {
  @Input() schoolId: number;
  @Input() levelId: number;
  @Input() classId: number;
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly translocoService = inject(TranslocoService);
  private rbacService = inject(RoleBaseAccessControlService);
  private readonly toastAlert = inject(ToastrService);
  private readonly levelApiService = inject(LevelsService);
  private readonly schoolStructureListingService = inject(
    SchoolStructureListingService,
  );
  private readonly academicYearsScopeService = inject(
    AcademicYearsScopeService,
  );
  private readonly studentColDefService = inject(StudentColDefinition);
  private readonly schoolService = inject(SchoolStructureListingService);
  private readonly studentApiService = inject(StudentsService);
  columns: ITableCol<IStudentListItem>[] = [];
  readonly assignRemoveStudentFromClassPermissionId =
    RESOURCE_PERMISSION.class.assignRemoveStudentFromClass;

  selectedRows = signal<IStudentListItem[]>([]);
  readonly noDataConfig: ListViewNoDataConfig = {
    mainImagePath: 'assets/illustrations/no_data.svg',
    title: this.translocoService.translate(
      'school_structure.no_students.title',
    ),
    ...(this.rbacService.hasPermission(
      RESOURCE_PERMISSION.class.assignRemoveStudentFromClass,
    ) && {
      primaryButton: {
        label: this.translocoService.translate(
          'user_management.add_student.title',
        ),
        onAction: () => {
          this.router.navigate(['/user-management/students/add']);
        },
      },
    }),
  };

  readonly primaryActions = computed<IListViewPrimaryAction[]>(() => {
    const selectedCount = this.selectedRows().length;
    const assignAction: IListViewPrimaryAction = {
      text: `${this.translocoService.translate(
        'school_structure.assign_selected.btn',
      )}${selectedCount ? ` (${selectedCount})` : ''}`,
      onClick: () => this.onAssignedStudent(),
      isDisabled: selectedCount === 0,
      isVisible: () =>
        this.rbacService.hasPermission(
          this.assignRemoveStudentFromClassPermissionId,
        ),
    };

    return [assignAction];
  });

  readonly fetchStudentList = (params: Record<string, any>) => {
    const { aId, ...restParams } = params;
    const queryParams = {
      ...this.buildDefaultQueryParams(),
      ...restParams,
      ...(aId && { academicYearId: aId }),
    } as IStudentQueryParams & { onlyUnassignedStudents: boolean };

    return this.studentApiService.fetchStudents(queryParams).pipe(
      map((resp) => ({
        data: mapStudentsToStudentListItems(resp.data),
        paginate: resp.paginate,
      })),
    );
  };

  ngOnInit() {
    this.initListingSchoolScopeFiltersWithCurrentClass();
    this.schoolStructureListingService.updateSelectedSchool(+this.schoolId);
    this.columns = this.studentColDefService.columns({
      academicYearList: this.academicYearsScopeService.AcademicYearsListing(),
      isStudentClassStatusFilter: false,
    });
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

  selectedRowsChange = (selectedRows: IStudentListItem[]) => {
    this.selectedRows.set(selectedRows);
  };

  private buildDefaultQueryParams(): Record<string, any> {
    const academicYearId =
      this.academicYearsScopeService.selectedAcademicYear()?.id;
    const campusId = this.schoolStructureListingService.selectedCampus()?.id;
    const companyId = this.schoolService.selectedCompany()?.id;

    return {
      ...DEFAULT_PARAM,
      ...(this.schoolId && { schoolId: this.schoolId.toString() }),
      ...(this.levelId && { levelId: this.levelId.toString() }),
      ...(campusId && { campusId: campusId.toString() }),
      ...(companyId && { companyId: companyId.toString() }),
      userStatuses: [UserStatus.ACTIVE, UserStatus.PAUSED].join(','),
      onlyUnassignedStudents: true,
    };
  }

  onAssignedStudent() {
    const academicYearId =
      this.academicYearsScopeService.selectedAcademicYear()?.id;
    if (academicYearId) {
      this.levelApiService
        .assginStudentToClass(
          +this.classId,
          this.selectedRows().map((s) => s.id),
          academicYearId,
        )
        .subscribe({
          next: () => {
            this.toastAlert.success(
              '',
              this.translocoService.translate(
                'global.assign_student_successfully.txt',
              ),
            );
            this.onRedirectToClass();
          },
          error: ({ error }) => {
            this.toastAlert.error(
              '',
              error.message ??
                this.translocoService.translate('global.wrong_msg.title'),
            );
          },
        });
    }
  }

  onRedirectToClass() {
    this.router.navigate(['..'], {
      relativeTo: this.route,
    });
  }
}
