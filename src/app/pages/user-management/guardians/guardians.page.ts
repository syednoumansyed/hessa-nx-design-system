import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IGuardianListItem, IGuardianQueryParams } from '@shared/interfaces';
import {
  Gender,
  ResourceStatus,
  dropdownArrayFromEnum,
  UserType,
  enumArrayFromEnum,
} from '@shared/enums';
import { ITableCol } from '@ui-kit/hes-table/model';
import { GuardianService } from './guardians.service';
import {
  faBan,
  faEye,
  faPen,
  faPlus,
  faUser,
} from '@fortawesome/pro-solid-svg-icons';
import { IAction } from '@ui-kit/hes-action-sheet/model';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { SchoolStructureListingService } from '@core/school-structure-listing.service';
import {
  ListViewContainerComponent,
  ListViewNoDataConfig,
} from '@ui-kit/hes-responsive-list-view/list-view-container/list-view-container.component';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { AuthService } from '@auth/auth.service';
import { LastActiveDateCellComponent } from '../components/last-active-date-cell/last-active-date-cell.component';
import { IListViewPrimaryAction } from '@ui-kit/hes-responsive-list-view/list-view.interface';
import { map } from 'rxjs';
import { HesTranslateService } from '@shared/services/hes-translate.service';

@Component({
  selector: 'app-guardians',
  templateUrl: './guardians.page.html',
  styleUrls: ['./guardians.page.scss'],
  standalone: true,
  providers: [SchoolStructureListingService],
  imports: [
    HesButtonModule,
    CommonModule,
    FormsModule,
    ListViewContainerComponent,
    TranslocoDirective,
  ],
})
export class GuardiansPage implements OnInit {
  private readonly guardianService = inject(GuardianService);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly translocoService = inject(HesTranslateService);
  private readonly academicYearScope = inject(AcademicYearsScopeService);
  private readonly rbacService = inject(RoleBaseAccessControlService);
  private readonly toastr = inject(HesToasterService);
  private readonly viewContainerListRef = viewChild<ListViewContainerComponent>(
    ListViewContainerComponent,
  );

  faPlus = faPlus;
  AcademicYearsListing = computed(() =>
    this.academicYearScope
      .academicYears()
      .map((item) => ({ value: item.id, displayedValue: item.name })),
  );
  addGuardianPermissionId = [RESOURCE_PERMISSION.guardians.addNewGuardian];
  primaryActions = computed<IListViewPrimaryAction[]>(() => {
    return [
      {
        onClick: () => {
          this.router.navigate(['add'], { relativeTo: this.route });
        },
        text: this.translocoService.translate('action.guardian.new.add'),
        isVisible: () => {
          return this.rbacService.hasPermission(
            RESOURCE_PERMISSION.guardians.addNewGuardian,
          );
        },
      },
    ];
  });

  actions: IAction<IGuardianListItem>[] = [
    {
      iconProps: { icon: faEye },
      text: this.translocoService.translate('global.view.btn'),
      onClick: (data) => {
        this.router.navigate([data?.id], {
          relativeTo: this.route,
        });
      },
      hasPermission: (data) => {
        return (
          this.rbacService.hasPermission(
            RESOURCE_PERMISSION.guardians.viewGuardianProfile,
          ) || this.rbacService.isCurrentUser(data.userId)
        );
      },
    },
    {
      iconProps: { icon: faPen },
      text: this.translocoService.translate('global.edit.btn'),
      onClick: (data) => {
        this.router.navigate([data?.id, 'update'], {
          relativeTo: this.route,
        });
      },
      hasPermission: (data) => {
        return (
          this.rbacService.hasPermission(
            RESOURCE_PERMISSION.guardians.updateGuardainsProfile,
          ) || this.rbacService.isCurrentUser(data.userId)
        );
      },
    },
    {
      iconProps: { icon: faUser },
      text: this.translocoService.translate('global.login_user.btn'),
      onClick: (data) => {
        // show switch confirmation dialog
        this.authService.displayLoginConfirmationDialog(
          data.userId,
          data.id,
          UserType.GUARDIAN,
        );
      },
      hasPermission: (data) => {
        const isSameUser =
          this.authService.user()?.type === UserType.GUARDIAN &&
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
      iconProps: { icon: faBan, flip: 'horizontal' },
      text: this.translocoService.translate('global.de_activate.btn'),
      textFormatter: (data) =>
        data.status === ResourceStatus.ACTIVE
          ? this.translocoService.translate('global.de_activate.btn')
          : this.translocoService.translate('global.activate_account.btn'),
      onClick: (data) => {
        data.status === ResourceStatus.ACTIVE
          ? this.onDeactivateGuardian(data.id)
          : this.onActivateGuardian(data.id);
      },
      hasPermission: () => {
        return this.rbacService.hasPermission(
          RESOURCE_PERMISSION.guardians.deactivateActivateProfile,
        );
      },
    },
  ];

  columns: ITableCol<IGuardianListItem>[] = [];

  params = signal<IGuardianQueryParams>({});

  noDataConfig: ListViewNoDataConfig = {
    mainImagePath: 'assets/illustrations/no_data.svg',
    title: this.translocoService.translate('user_management.no_guardian.txt'),
    ...(this.rbacService.hasPermission(
      RESOURCE_PERMISSION.guardians.addNewGuardian,
    ) && {
      primaryButton: {
        label: this.translocoService.translate(
          'user_management.add_guardian.btn',
        ),
        onAction: () => {
          this.router.navigate(['add'], { relativeTo: this.route });
        },
      },
    }),
  };

  ngOnInit() {
    this.columns = [
      {
        field: 'displayName',
        headerName: this.translocoService.translate('global.name.title'),
        sortable: true,
        filter: false,
      },
      {
        field: 'nationalId',
        headerName: this.translocoService.translate('global.national_id.title'),
        sortable: true,
        filter: false,
      },
      {
        field: 'phoneNumber',
        headerName: this.translocoService.translate(
          'global.phone_number.title',
        ),
        sortable: false,
        filter: false,
        cellRenderer: (params: any) => {
          return `<div class="phone-number-dir">${params.value}</div>`;
        },
      },
      {
        field: 'gender',
        headerName: this.translocoService.translate('global.gender.title'),
        sortable: true,
        filter: true,
        valueFormatter: (params) =>
          this.translocoService.translate('enum.' + params.value),
        filterType: 'chip-selector',
        filterPlaceholder: this.translocoService.translate(
          'global.gender.title',
        ),
        filterSelectOptions: dropdownArrayFromEnum(Gender),
      },
      {
        field: 'student',
        headerName: this.translocoService.translate(
          'global.linked_students.title',
        ),
        sortable: false,
        filter: false,
      },
      {
        field: 'schoolId',
        headerName: this.translocoService.translate('global.school.title'),
        filterPlaceholder: this.translocoService.translate(
          'global.school.title',
        ),
        sortable: false,
        filter: true,
        filterType: 'chip-selector',
        SchoolStructureListingType: 'school',
        filterOrder: -1,
      },
      {
        field: 'campusId',
        headerName: this.translocoService.translate('global.campus.title'),
        filterPlaceholder: this.translocoService.translate(
          'global.campus.title',
        ),
        sortable: false,
        filter: true,
        filterType: 'chip-selector',
        SchoolStructureListingType: 'campus',
        filterOrder: -2,
      },
      {
        field: 'companyId',
        headerName: this.translocoService.translate('global.company.title'),
        filterPlaceholder: this.translocoService.translate(
          'global.company.title',
        ),
        sortable: false,
        filter: true,
        filterType: 'chip-selector',
        SchoolStructureListingType: 'company',
        filterOrder: -3,
      },
      {
        field: 'academicYearId',
        headerName: this.translocoService.translate(
          'global.academic_year.title',
        ),
        filterPlaceholder: this.translocoService.translate(
          'global.academic_year.title',
        ),
        sortable: false,
        filter: true,
        filterType: 'chip-selector',
      },
      {
        field: 'status',
        headerName: this.translocoService.translate('global.status.title'),
        sortable: false,
        filterType: 'chip-selector',
        filterSelectOptions: enumArrayFromEnum(ResourceStatus).map(
          (status) => ({
            value: status as string | number,
            displayedValue: this.translocoService.enumT(status as string),
          }),
        ),
        valueFormatter: (params) =>
          this.translocoService.translate('enum.' + params.value),
        filter: false,
      },
      {
        field: 'lastActive',
        headerName: this.translocoService.translate('global.last_active.txt'),
        sortable: false,
        filter: false,
        cellRenderer: LastActiveDateCellComponent,
      },
      {
        field: 'actions',
        headerName: this.translocoService.translate('global.actions.title'),
        sortable: false,
        filter: false,
        type: 'action',
        actions: this.actions,
        lockPosition: true,
      },
    ];
  }

  fetchGuardianList = (params: Record<string, any>) => {
    const query = { ...params };
    return this.guardianService.getGuardiansList(query).pipe(
      map((res) => {
        return {
          data: this.guardianService.mapGuardiansToGuardianListItems(res.data),
          paginate: res.paginate,
        };
      }),
    );
  };

  deactivateGuardian(id: number) {
    this.guardianService.deactivateGuardian(id.toString()).subscribe({
      next: () => {
        this.viewContainerListRef()?.triggerFetch();
        this.toastr.success(
          '',
          this.translocoService.translate(
            'global.successfully_deactivated.txt',
          ),
        );
      },
      error: (error) => {
        this.toastr.showBackendError(error);
      },
    });
  }

  activateGuardian(id: number) {
    this.guardianService.activateGuardian(id.toString()).subscribe({
      next: () => {
        this.toastr.success(
          '',
          this.translocoService.translate('global.successfully_activated.txt'),
        );
        this.viewContainerListRef()?.triggerFetch();
      },
      error: () => {
        this.toastr.error(
          this.translocoService.translate(
            'user_management.account.activation.error',
          ),
          this.translocoService.translate('global.wrong_msg.title'),
        );
        this.deactivateGuardian(id);
      },
    });
  }

  onDeactivateGuardian = (id: number) => {
    this.guardianService.onDeactivateGuardian(() =>
      this.deactivateGuardian(id),
    );
  };
  onActivateGuardian(id: number) {
    this.guardianService.onActivateGuardian(() => this.activateGuardian(id));
  }

  onRowClicked(event: IGuardianListItem) {
    if (
      this.rbacService.hasPermission(
        RESOURCE_PERMISSION.guardians.viewGuardianProfile,
      ) ||
      this.rbacService.isCurrentUser(event.userId)
    ) {
      this.router.navigate([event.id], {
        relativeTo: this.route,
      });
    }
  }
}
