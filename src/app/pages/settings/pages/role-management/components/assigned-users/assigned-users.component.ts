import {
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import {
  AssignedUsersTableCol,
  AssignedUsersTableColDefService,
} from './assigned-users-table-col-def.service';
import { CommonModule } from '@angular/common';
import { HesTableComponent } from '@ui-kit/hes-table/hes-table.component';
import { IPagination } from '@shared/interfaces';
import { INoRowsOverlay, ITableModel } from '@ui-kit/hes-table/model';
import { SortOrder } from '@shared/enums';
import { IonSkeletonText } from '@ionic/angular/standalone';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { FeedbackService } from '@shared/services/feedback.service';
import { Subscription, merge, skip } from 'rxjs';
import { RoleApiService } from '@core/api-services/role-api/role.api-service';
import { AssignedUserResponseDTO } from '@core/api-services/role-api/dto/assigned-users.dto';
import { ApiParam } from '@core/api-services/role-api/dto/role.dto';
import { Router } from '@angular/router';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { DEFAULT_PARAM } from '@shared/constants/default-page-param.constant';

interface AssignedUserTableMataData {
  id?: number;
  name?: string;
  createdAt?: string | null;
  order?: SortOrder;
  pageNumber?: number;
  itemsPerPage?: number;
  sortByColumn?: string;
  searchText?: string;
}
@Component({
  selector: 'app-assigned-users',
  templateUrl: './assigned-users.component.html',
  standalone: true,
  imports: [
    IonSkeletonText,
    CommonModule,
    HesTableComponent,
    TranslocoDirective,
  ],
  providers: [AssignedUsersTableColDefService],
  host: { class: 'flex flex-1 flex-col' },
})
export class AssignedUsersComponent implements OnInit, OnDestroy {
  @Input() roleId: number;

  private readonly cdRef = inject(ChangeDetectorRef);
  private readonly translocoService = inject(TranslocoService);
  private readonly feedbackService = inject(FeedbackService);
  private readonly roleApiService = inject(RoleApiService);
  private readonly assignedUserTableColDefService = inject(
    AssignedUsersTableColDefService,
  );
  private readonly toastr = inject(HesToasterService);
  private readonly router = inject(Router);
  private schoolScopeService = inject(SchoolStructureScopeService);
  private academicYearsScopeService = inject(AcademicYearsScopeService);

  private readonly subscription = new Subscription();
  readonly data = signal<AssignedUserResponseDTO | null>(null);
  readonly columnDefs = this.assignedUserTableColDefService.colDef;
  readonly apiQueryParam = signal<ApiParam>(DEFAULT_PARAM);
  readonly paginate = signal<IPagination | null>(null);
  readonly tableData = signal<Array<AssignedUsersTableCol>>([]);
  readonly noRowsOverlayComponentParams = signal<INoRowsOverlay>({
    imgSrc: 'assets/illustrations/no_data.svg',
  });

  isLoading = signal(false);

  constructor() {
    const obs1 = toObservable(this.schoolScopeService.selectedSchoolId);
    const obs2 = toObservable(
      this.academicYearsScopeService.selectedAcademicYear,
    );

    merge(obs1, obs2)
      .pipe(takeUntilDestroyed(), skip(2))
      .subscribe((v) => {
        this.onTableMetaDataChange();
      });
  }

  ngOnInit() {
    this.onTableMetaDataChange();
    this.subscription.add(
      this.assignedUserTableColDefService.onUnLink$.subscribe((userId) => {
        this.onShowUnLinkConfirmModal(userId);
      }),
    );
  }

  onTableMetaDataChange(event?: ITableModel<AssignedUserTableMataData>) {
    let newParams: ApiParam = {
      ...(this.schoolScopeService.selectedSchoolId() && {
        schoolId: this.schoolScopeService.selectedSchoolId()?.toString(),
      }),
      academicYearId: this.academicYearsScopeService
        .selectedAcademicYear()
        ?.id?.toString(),
    };
    if (event) {
      const { colName, order, pageNumber, itemsPerPage, ...params } = event;
      newParams = {
        ...newParams,
        ...params,
        ...(colName && { sortByColumn: colName }),
        ...(order && { order }),
        ...(pageNumber && { pageNumber: pageNumber }),
        ...(itemsPerPage && { itemsPerPage: itemsPerPage }),
      };
      if (this.isResetPageNumber(this.apiQueryParam(), newParams)) {
        newParams.pageNumber = 1;
      }
    }
    this.apiQueryParam.set(newParams);
    this.fetchAssignedUsers();
  }

  private isResetPageNumber(oldParam: ApiParam, newParam: ApiParam): boolean {
    return (
      oldParam.order !== newParam.order ||
      oldParam.itemsPerPage !== newParam.itemsPerPage ||
      oldParam.sortByColumn !== newParam.sortByColumn
    );
  }

  private fetchAssignedUsers() {
    this.isLoading.set(true);
    this.roleApiService
      .fetchAssignedUsers(this.roleId, this.apiQueryParam() || DEFAULT_PARAM)
      .subscribe({
        next: (data) => {
          this.paginate.set(data.paginate);
          this.tableData.set(
            this.assignedUserTableColDefService.mapTableData(data.data),
          );
          this.isLoading.set(false);
        },
        error: (err) => {
          if (err.status === 404 && err.error.paginate.totalItems === 0) {
            this.tableData.set([]);
          }
          this.paginate.set(err.error.paginate);
          this.isLoading.set(false);
          this.toastr.showBackendError(err);
        },
        complete: () => {
          this.cdRef.detectChanges();
        },
      });
  }

  onShowUnLinkConfirmModal(userId: number) {
    this.feedbackService.openFeedbackModal(
      {
        type: 'error',
        modalTitle: this.translocoService.translate(
          'roles_permissions.remove_user.title',
        ),
        modalMessage: this.translocoService.translate(
          'roles_permissions.remove_user_msg.txt',
        ),
        primaryBtnStr: this.translocoService.translate(
          'roles_permissions.remove_user.btn',
        ),
        secondaryBtnStr: this.translocoService.translate('global.cancel.btn'),
      },
      () => this.onUnLink(userId),
    );
  }

  private onUnLink(userId: number) {
    this.roleApiService.unLinkUserFromRole(this.roleId, userId).subscribe({
      next: () => {
        this.toastr.success(
          '',
          this.translocoService.translate(
            'roles_permissions.successfully_removed_msg.txt',
          ),
        );
        this.onTableMetaDataChange();
      },
      error: ({ error }) => {
        this.toastr.showBackendError(error);
      },
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  onRowClicked(event: AssignedUsersTableCol) {
    this.router.navigateByUrl(
      `user-management/${event.type.toLowerCase()}s/${event.id}`,
    );
  }
}
