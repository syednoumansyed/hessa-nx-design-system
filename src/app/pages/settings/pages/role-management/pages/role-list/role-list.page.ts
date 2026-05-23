import { Component, inject, signal } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { TranslocoDirective } from '@jsverse/transloco';

import { faPlus } from '@fortawesome/pro-regular-svg-icons';
import { HesTableComponent } from '@ui-kit/hes-table/hes-table.component';
import {
  RoleListTableCol,
  RoleListTableColDefService,
} from './role-list-table-col-def.service';
import { mapToRoleListTableData } from './role-list-table-map.util';
import { ActivatedRoute, Router } from '@angular/router';
import { ITableModel, ITableSort } from '@ui-kit/hes-table/model';
import { SortOrder } from '@shared/enums';
import { IPagination } from '@shared/interfaces';
import { RoleApiService } from '@core/api-services/role-api/role.api-service';
import { ApiParam } from '@core/api-services/role-api/dto/role.dto';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { ListingHeaderComponent } from '@shared/components/user-listing-header/listing-header.component';
import { DEFAULT_PARAM } from '@shared/constants/default-page-param.constant';

interface RoleTableMataData {
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
  selector: 'app-role-list',
  templateUrl: './role-list.page.html',
  standalone: true,
  imports: [
    IonContent,
    TranslocoDirective,
    HesTableComponent,
    ListingHeaderComponent,
  ],
})
export class RoleListPage {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly rbacService = inject(RoleBaseAccessControlService);

  private readonly roleListTableColDefService = inject(
    RoleListTableColDefService,
  );
  readonly faPlusIcon = faPlus;
  readonly columnDefs = this.roleListTableColDefService.colDef;

  readonly roleTableData = signal<Array<RoleListTableCol>>([]);
  private readonly roleApiService = inject(RoleApiService);
  public readonly addRolePermissionId = [
    RESOURCE_PERMISSION.rolesAndPermission.createRole,
  ];
  readonly apiQueryParam = signal<ApiParam>(DEFAULT_PARAM);
  readonly paginate = signal<IPagination | null>(null);

  isLoading = signal(false);

  ionViewWillEnter(): void {
    this.fetchRoles();
  }

  onTableSortChange(event: ITableSort | null) {
    if (event) {
      const param = this.apiQueryParam();
      if (param) {
        this.apiQueryParam.set({
          ...param,
          sortByColumn: event.colName,
          order: event.order,
        });
      }
    }
    this.fetchRoles();
  }

  onTableMetaDataChange(event: ITableModel<RoleTableMataData>) {
    if (event) {
      const { colName, order, pageNumber, itemsPerPage, ...params } = event;
      let newParams = {
        ...params,
        ...(colName && { sortByColumn: colName }),
        ...(order && { order }),
        ...(pageNumber && { pageNumber: pageNumber }),
        ...(itemsPerPage && { itemsPerPage: itemsPerPage }),
      };
      if (this.isResetPageNumber(this.apiQueryParam(), newParams)) {
        newParams.pageNumber = 1;
      }
      this.apiQueryParam.set(newParams);
    }
    this.fetchRoles();
  }

  private isResetPageNumber(oldParam: ApiParam, newParam: ApiParam): boolean {
    return (
      oldParam.order !== newParam.order ||
      oldParam.itemsPerPage !== newParam.itemsPerPage ||
      oldParam.sortByColumn !== newParam.sortByColumn
    );
  }

  private fetchRoles() {
    this.isLoading.set(true);
    this.roleApiService
      .fetchRoles(this.apiQueryParam() || DEFAULT_PARAM)
      .subscribe({
        next: (response) => {
          this.paginate.set(response.paginate);
          this.roleTableData.set(mapToRoleListTableData(response.data));
          this.isLoading.set(false);
        },
        error: (err) => {
          if (err.status === 404 && err.error.paginate.totalItems === 0) {
            this.roleTableData.set([]);
          }
          this.paginate.set(err.error.paginate);
          this.isLoading.set(false);
        },
      });
  }

  onRowClicked(event: RoleListTableCol) {
    if (
      this.rbacService.hasPermission(
        RESOURCE_PERMISSION.rolesAndPermission.viewRoleDetail,
      )
    ) {
      this.router.navigate(['detail', event.id], {
        relativeTo: this.route,
      });
    }
  }

  handleAddRoleClick() {
    this.router.navigate(['add'], {
      relativeTo: this.route,
    });
  }
}
