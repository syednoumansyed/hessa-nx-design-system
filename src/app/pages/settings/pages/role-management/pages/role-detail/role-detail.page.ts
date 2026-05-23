import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';

import { HessaBtnDirective } from '@ui-kit/hes-button/hes-button.directive';
import { Dictionary, groupBy } from 'lodash';
import { Router, RouterModule } from '@angular/router';
import { AssignedUsersComponent } from '../../components/assigned-users/assigned-users.component';
import { IPagination } from '@shared/interfaces';
import { FeedbackService } from '@shared/services/feedback.service';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { PermissionDTO } from '@core/api-services/role-api/dto/permission.dto';
import { RoleApiService } from '@core/api-services/role-api/role.api-service';
import { RoleResponseDataDTO } from '@core/api-services/role-api/dto/role.dto';
import { RbacDirective } from '@shared/role-bace-acces-controller/rbac.directive';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { GenericErrorFeedbackService } from '@shared/services/generic-error-feedback.service';
import { HesToasterService } from '@shared/services/hes-toaster.service';
import {
  RolePermission,
  RolePermissionDetail,
} from '@core/api-services/role-api/dto/role.interface';

interface RoleDetail {
  roleName: string;
  deletable: boolean;
  editable: boolean;
  resources: Array<{
    resourceName: string;
    groupByOperation: Dictionary<PermissionDTO[]>;
  }>;
}
@Component({
  selector: 'app-role-detail',
  templateUrl: './role-detail.page.html',
  standalone: true,
  imports: [
    IonContent,
    HessaBtnDirective,
    RouterModule,
    AssignedUsersComponent,
    TranslocoDirective,
    RbacDirective,
    CommonModule,
  ],
})
export class RoleDetailPage {
  private readonly translocoService = inject(TranslocoService);
  private readonly roleApiService = inject(RoleApiService);
  private readonly feedbackService = inject(FeedbackService);
  private readonly toasterService = inject(HesToasterService);
  private readonly router = inject(Router);
  private readonly genericErrorFeedbackService = inject(
    GenericErrorFeedbackService,
  );

  public readonly deleteRolePermissionId =
    RESOURCE_PERMISSION.rolesAndPermission.deleteRole;
  public readonly editRolePermissoinId =
    RESOURCE_PERMISSION.rolesAndPermission.updateRole;

  public readonly viewData = signal<RoleDetail | null>(null);
  readonly paginate = signal<IPagination | null>(null);

  @Input() roleId: number;

  ionViewWillEnter() {
    this.roleApiService.fetchRoleById(this.roleId).subscribe((resp) => {
      this.viewData.set(this.groupByOperations(resp));
    });
  }

  onShowDeleteConfirmModal() {
    this.feedbackService.openFeedbackModal(
      {
        type: 'error',
        modalTitle: this.translocoService.translate(
          'roles_permissions.delete_role.title',
        ),
        modalMessage: this.translocoService.translate(
          'roles_permissions.delete_role_msg.txt',
        ),
        primaryBtnStr: this.translocoService.translate('global.delete.btn'),
        secondaryBtnStr: this.translocoService.translate('global.cancel.btn'),
      },
      () => this.onDelete(),
    );
  }

  private onDelete() {
    this.roleApiService.deleteRole(this.roleId).subscribe({
      next: () => {
        this.showDeleteSuccessFeedBack();
      },
      error: () => {
        this.genericErrorFeedbackService.show();
      },
    });
  }

  private showDeleteSuccessFeedBack() {
    this.toasterService.success(
      '',
      this.translocoService.translate(
        'roles_permissions.successfully_deleted_msg.txt',
      ),
    );
    this.navigateBackToRoleListing();
  }

  private groupByOperations(roleData: RolePermissionDetail) {
    return {
      roleName: roleData.displayName,
      deletable: roleData.deletable,
      editable: roleData.editable,
      resources: this.getResources(roleData.resources),
    };
  }

  private getResources(resources: RoleResponseDataDTO['resources']) {
    return resources.map((resource) => {
      return {
        resourceName: resource.name,
        groupByOperation: groupBy(resource.permissions, 'operation'),
      };
    });
  }

  private navigateBackToRoleListing() {
    this.router.navigate(['settings/roles']);
  }
}
