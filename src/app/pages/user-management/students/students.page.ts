import {
  Component,
  OnInit,
  computed,
  signal,
  inject,
  viewChild,
} from '@angular/core';
import { IStudentListItem, IStudentQueryParams } from '@shared/interfaces';
import { StudentsService } from './students.service';
import {
  Gender,
  ResourceStatus,
  dropdownArrayFromEnum,
  UserType,
  enumArrayFromEnum,
  UserStatus,
} from '@shared/enums';
import { ITableCol } from '@ui-kit/hes-table/model';

import { faPlus } from '@fortawesome/pro-solid-svg-icons';
import { IAction } from '@ui-kit/hes-action-sheet/model';
import { faEye, faPen, faBan, faUser } from '@fortawesome/pro-light-svg-icons';
import { ActivatedRoute, Router } from '@angular/router';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { SchoolStructureListingService } from '@core/school-structure-listing.service';

import { NoDataBtnInterface } from '@shared/components/no-data-card/no-data-card.component';
import { AuthService } from '@auth/auth.service';
import { LastActiveDateCellComponent } from '../components/last-active-date-cell/last-active-date-cell.component';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { mapStudentsToStudentListItems } from '@shared/services/students-listing.service';
import { faPauseCircle } from '@fortawesome/pro-regular-svg-icons';
import { ObjId } from '@shared/interfaces/common.interface';
import { AccountBlockingService } from './account-blocking.service';
import { HesDatePipe } from '@shared/pipes/hessa-date.pipe';
import { LayoutService } from '@layout/layout.service';
import {
  ListViewContainerComponent,
  ListViewNoDataConfig,
} from '@ui-kit/hes-responsive-list-view/list-view-container/list-view-container.component';
import { map } from 'rxjs';
import { IListViewPrimaryAction } from '@ui-kit/hes-responsive-list-view/list-view.interface';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-students',
  templateUrl: './students.page.html',
  styleUrls: ['./students.page.scss'],
  standalone: true,
  providers: [SchoolStructureListingService, HesDatePipe],
  imports: [HesButtonModule, ListViewContainerComponent, TranslocoDirective],
})
export class StudentsPage implements OnInit {
  private authService = inject(AuthService);
  private readonly hesDatePipe = inject(HesDatePipe);
  private readonly accountBlockingService = inject(AccountBlockingService);
  private readonly layoutService = inject(LayoutService);
  private permissionService = inject(RoleBaseAccessControlService);
  faPlus = faPlus;

  private readonly viewContainerListRef = viewChild<ListViewContainerComponent>(
    ListViewContainerComponent,
  );
  noDataBtnConfig = signal<NoDataBtnInterface>({
    label: this.translocoService.t('user_management.add_student.btn'),
    onAction: () => {
      this.router.navigate(['add'], { relativeTo: this.route });
    },
  });

  primaryActions = computed<IListViewPrimaryAction[]>(() => {
    return [
      {
        onClick: () => {
          this.router.navigate(['add'], { relativeTo: this.route });
        },
        text: this.translocoService.t('user_management.add_student.btn'),
        isVisible: () => {
          return this.permissionService.hasPermission(
            RESOURCE_PERMISSION.student.addNewStudent,
          );
        },
      },
    ];
  });

  AcademicYearsListing = computed(() =>
    this.academicYearScope
      .academicYears()
      .map((item) => ({ value: item.id, displayedValue: item.name })),
  );

  actions: IAction<IStudentListItem>[] = [
    {
      iconProps: { icon: faEye },
      text: this.translocoService.t('global.view.btn'),
      onClick: (data) => {
        this.router.navigate([data?.id], {
          relativeTo: this.route,
        });
      },
      hasPermission: (data) => {
        return (
          this.rbacService.hasPermission(
            RESOURCE_PERMISSION.student.viewStudentProfile,
          ) || this.rbacService.isCurrentUser(data.userId)
        );
      },
    },
    {
      iconProps: { icon: faPen },
      text: this.translocoService.t('global.edit.btn'),
      onClick: (data) => {
        this.router.navigate([data?.id, 'update'], {
          relativeTo: this.route,
        });
      },
      hasPermission: (data) => {
        return (
          this.rbacService.hasPermission(
            RESOURCE_PERMISSION.student.editStudentProfile,
          ) || this.rbacService.isCurrentUser(data.userId)
        );
      },
    },
    {
      iconProps: { icon: faUser },
      text: this.translocoService.t('global.login_user.btn'),
      onClick: (data) => {
        // show switch confirmation dialog
        this.authService.displayLoginConfirmationDialog(
          data.userId,
          data.id,
          UserType.STUDENT,
        );
      },
      hasPermission: (data) => {
        if (data.status !== UserStatus.ACTIVE) return false;
        const isSameUser =
          this.authService.user()?.type === UserType.STUDENT &&
          this.authService.user()?.userTypeId === data.id;
        return (
          !this.authService.isLoggedInAsOtherUser() &&
          !isSameUser &&
          this.rbacService.hasPermission(
            RESOURCE_PERMISSION.LOGIN.LOGIN_AS_USER,
          )
        );
      },
    },
    {
      iconProps: { icon: faPauseCircle, flip: 'horizontal' },
      text: this.translocoService.t(
        'deactivation_paused_user.pause_account.title',
      ),
      textFormatter: (data) =>
        data.status === UserStatus.ACTIVE
          ? this.translocoService.t(
              'deactivation_paused_user.pause_account.title',
            )
          : this.translocoService.t(
              'deactivation_paused_user.resume_account_msg.title',
            ),
      onClick: (data) => {
        data.status === UserStatus.ACTIVE
          ? this.onPauseStudentAccount(data.id, data.displayName)
          : this.onResumeStudentAccount(data.id);
      },
      hasPermission: (data) => {
        if (data.status === UserStatus.INACTIVE) return false;
        else
          return this.rbacService.hasPermission(
            RESOURCE_PERMISSION.student.deactivateActivateProfile,
          );
      },
    },
    {
      iconProps: { icon: faBan, flip: 'horizontal' },
      text: this.translocoService.t('global.de_activate.btn'),
      textFormatter: (data) =>
        data.status !== UserStatus.INACTIVE
          ? this.translocoService.t('global.de_activate.btn')
          : this.translocoService.t('global.activate_account.btn'),
      onClick: (data) => {
        data.status !== UserStatus.INACTIVE
          ? this.onDeactivateStudent(data.id, data.displayName)
          : this.onActivateStudent(data.id);
      },
      hasPermission: () => {
        return this.rbacService.hasPermission(
          RESOURCE_PERMISSION.student.deactivateActivateProfile,
        );
      },
    },
  ];

  columns: ITableCol<IStudentListItem>[] = [];

  params = signal<IStudentQueryParams>({});

  noDataConfig: ListViewNoDataConfig = {
    mainImagePath: 'assets/illustrations/no_data.svg',
    title: this.translocoService.t('user_management.no_students.txt'),
    ...(this.rbacService.hasPermission(
      RESOURCE_PERMISSION.student.addNewStudent,
    ) && {
      primaryButton: {
        label: this.translocoService.t('user_management.add_student.btn'),
        onAction: () => {
          this.router.navigate(['add'], { relativeTo: this.route });
        },
      },
    }),
  };

  constructor(
    private studentService: StudentsService,
    private router: Router,
    private route: ActivatedRoute,
    private translocoService: HesTranslateService,
    private academicYearScope: AcademicYearsScopeService,
    private rbacService: RoleBaseAccessControlService,
  ) {}

  ngOnInit() {
    this.columns = [
      {
        field: 'displayName',
        headerName: this.translocoService.t('global.name.title'),
        sortable: true,
        filter: false,
      },
      {
        field: 'nationalId',
        headerName: this.translocoService.t('global.national_id.title'),
        sortable: true,
        filter: false,
      },
      {
        field: 'phoneNumber',
        headerName: this.translocoService.t('global.phone_number.title'),
        sortable: true,
        filter: false,
        cellRenderer: (params: any) => {
          return `<div class="phone-number-dir">${params.value}</div>`;
        },
      },
      {
        field: 'gender',
        headerName: this.translocoService.t('global.gender.title'),
        sortable: true,
        filter: true,
        filterType: 'chip-selector',
        valueFormatter: (params) =>
          this.translocoService.t('enum.' + params.value),
        filterSelectOptions: dropdownArrayFromEnum(Gender),
        filterPlaceholder: this.translocoService.t('global.gender.title'),
      },
      {
        field: 'dateOfBirth',
        headerName: this.translocoService.t('global.date_of_birth.title'),
        sortable: false,
        filter: true,
        filterType: 'date',
        filterPlaceholder: this.translocoService.t(
          'global.date_of_birth.title',
        ),
        type: 'date',
      },
      {
        field: 'pioneerId',
        headerName: this.translocoService.t('global.pioneers_id.title'),
        sortable: false,
        filter: false,
        filterPlaceholder: this.translocoService.t('global.pioneers_id.title'),
      },
      {
        field: 'passportNumber',
        headerName: this.translocoService.t('global.passport_num.title'),
        sortable: false,
        filter: false,
        filterPlaceholder: this.translocoService.t('global.passport_num.title'),
      },
      {
        field: 'passportExpiryDate',
        headerName: this.translocoService.t(
          'global.passport_expiry_date.title',
        ),
        sortable: false,
        filter: true,
        filterType: 'date',
        type: 'date',
        filterPlaceholder: this.translocoService.t(
          'global.passport_expiry_date.title',
        ),
      },
      {
        field: 'registrationDate',
        headerName: this.translocoService.t('global.registration_date.title'),
        sortable: false,
        filter: true,
        filterType: 'date',
        type: 'date',
        filterPlaceholder: this.translocoService.t(
          'global.registration_date.title',
        ),
      },
      {
        field: 'nationalityName',
        headerName: this.translocoService.t('global.nationality.title'),
        sortable: false,
        filter: false,
        filterPlaceholder: this.translocoService.t('global.nationality.title'),
      },
      {
        field: 'classId',
        headerName: this.translocoService.t('global.class.title'),
        sortable: false,
        filter: true,
        filterType: 'chip-selector',
        SchoolStructureListingType: 'class',
        filterPlaceholder: this.translocoService.t('global.class.title'),
        valueFormatter: ({ data }) => {
          return data.className ?? '-';
        },
        filterOrder: -1,
      },
      {
        field: 'levelId',
        headerName: this.translocoService.t('global.level.title'),
        sortable: false,
        filter: true,
        filterType: 'chip-selector',
        SchoolStructureListingType: 'level',
        valueFormatter: ({ data }) => {
          return data.levelName ?? '-';
        },
        filterOrder: -2,
      },
      {
        field: 'schoolId',
        headerName: this.translocoService.t('global.school.title'),
        filterPlaceholder: this.translocoService.t('global.school.title'),
        sortable: false,
        filter: true,
        filterType: 'chip-selector',
        SchoolStructureListingType: 'school',
        valueFormatter: ({ data }) => {
          return data.schoolName ?? '-';
        },
        filterOrder: -3,
      },
      {
        field: 'campusId',
        headerName: this.translocoService.t('global.campus.title'),
        sortable: false,
        filter: true,
        filterType: 'chip-selector',
        SchoolStructureListingType: 'campus',
        valueFormatter: ({ data }) => {
          return data.campusName ?? '-';
        },
        filterOrder: -4,
      },
      {
        field: 'companyId',
        headerName: this.translocoService.t('global.company.title'),
        sortable: false,
        filter: true,
        filterType: 'chip-selector',
        SchoolStructureListingType: 'company',
        valueFormatter: ({ data }) => {
          return data.companyName ?? '-';
        },
        filterOrder: -5,
      },
      {
        field: 'id',
        headerName: this.translocoService.t('global.student_id.title'),
        sortable: true,
        filter: false,
      },
      {
        field: 'guardian',
        headerName: this.translocoService.t('global.linked_guardians.title'),
        sortable: false,
        filter: false,
      },
      {
        field: 'academicYearId',
        headerName: this.translocoService.t('global.academic_year.title'),
        filterPlaceholder: this.translocoService.t(
          'global.academic_year.title',
        ),
        sortable: false,
        filter: true,
        filterType: 'chip-selector',
        valueFormatter: ({ data }) => {
          return data.academicYearName ?? '-';
        },
      },
      {
        field: 'studentClassStatus',
        headerName: this.translocoService.t(
          'global.student_class.status.title',
        ),
        sortable: false,
        filter: true,
        type: 'enum',
        filterType: 'chip-selector',
        filterSelectOptions: enumArrayFromEnum(ResourceStatus).map(
          (status) => ({
            value: status as string | number,
            displayedValue: this.translocoService.enumT(status as string),
          }),
        ),
      },
      {
        field: 'userStatus',
        headerName: this.translocoService.t('global.status.title'),
        sortable: false,
        filter: true,
        filterType: 'chip-selector',
        filterSelectOptions: enumArrayFromEnum(UserStatus).map((status) => ({
          value: status as string,
          displayedValue:
            status === 'INACTIVE'
              ? this.translocoService.t('deactivation_deactivated.txt')
              : this.translocoService.enumT(status as string),
        })),
        valueFormatter: ({ data }) => {
          if (data.status === 'INACTIVE')
            return this.translocoService.t('deactivation_deactivated.txt');
          else return this.translocoService.enumT(data.status);
        },
      },
      {
        field: 'lastActive',
        headerName: this.translocoService.t('global.last_active.txt'),
        sortable: false,
        filter: false,
        cellRenderer: LastActiveDateCellComponent,
      },
      {
        field: 'actions',
        headerName: this.translocoService.t('global.actions.title'),
        sortable: false,
        filter: false,
        type: 'action',
        actions: this.actions,
        lockPosition: true,
      },
    ];
  }

  fetchStudentList = (params: Record<string, any>) => {
    return this.studentService.fetchStudents(params).pipe(
      map((resp) => ({
        data: mapStudentsToStudentListItems(resp.data),
        paginate: resp.paginate,
      })),
    );
  };

  activateStudent(id: ObjId) {
    this.studentService.activateStudent(id).subscribe({
      next: () => {
        this.onActivateStudentSuccess();
      },
      error: () => {
        this.onActivateStudentError(id);
      },
    });
  }

  onPauseStudentAccount(studentId: ObjId, studentName: string) {
    const isPause = true;
    this.accountBlockingService
      .openPauseOrDeactivateDialog(studentId, studentName, isPause)
      .subscribe({
        next: (res) => {
          if (res) this.viewContainerListRef()?.triggerFetch();
        },
      });
  }

  onDeactivateStudent(studentId: number, studentName: string) {
    this.accountBlockingService
      .openPauseOrDeactivateDialog(studentId, studentName)
      .subscribe({
        next: () => {
          this.viewContainerListRef()?.triggerFetch();
        },
      });
  }
  onActivateStudent(id: number) {
    this.studentService.onActivateStudent(() => this.activateStudent(id));
  }
  onActivateStudentSuccess() {
    this.studentService.onActivateStudentSuccess();
    this.viewContainerListRef()?.triggerFetch();
  }
  onActivateStudentError(id: ObjId) {
    this.studentService.onActivateStudentError(
      () => () => this.activateStudent(id),
    );
  }

  onResumeStudentAccount(id: ObjId): void {
    this.layoutService.showPageSpinner();
    this.studentService.getStudent(id).subscribe({
      next: (res) => {
        if (res.statusData?.endTime) {
          this.studentService.onResumeStudent(
            this.hesDatePipe.transform(res.statusData.endTime),
            () => this.activateStudent(id),
          );
        }
      },
      complete: () => {
        this.layoutService.hidePageSpinner();
      },
    });
  }

  onRowClicked(event: IStudentListItem) {
    if (
      this.rbacService.hasPermission(
        RESOURCE_PERMISSION.student.viewStudentProfile,
      ) ||
      this.rbacService.isCurrentUser(event.userId)
    ) {
      this.router.navigate([event.id], {
        relativeTo: this.route,
      });
    }
  }
}
