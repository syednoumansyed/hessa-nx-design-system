import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';

import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HessaInputComponent } from '@ui-kit/hessa-input/hessa-input.component';
import { IonCheckboxCustomEvent, CheckboxChangeEventDetail } from '@ionic/core';
import { PermissionFormGroupService } from './permission-form-group.service';
import { forkJoin, of } from 'rxjs';
import { PermissionFormViewData } from './permission-form.model';
import { RoleApiService } from '@core/api-services/role-api/role.api-service';
import { IonContent, IonFooter } from '@ionic/angular/standalone';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { HesCheckboxModule } from '@ui-kit/hes-checkbox/hes-checkbox.module';
import { ToastrService } from 'ngx-toastr';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ResourceResponseData,
  RolePermissionDetail,
} from '@core/api-services/role-api/dto/role.interface';

@Component({
  selector: 'app-role-and-permission-form',
  templateUrl: './role-and-permission-form.page.html',
  standalone: true,
  providers: [PermissionFormGroupService],
  imports: [
    IonContent,
    IonFooter,
    HesButtonModule,
    CommonModule,
    FormsModule,
    TranslocoDirective,

    RouterModule,
    HessaInputComponent,
    ReactiveFormsModule,
    FormsModule,
    HesCheckboxModule,
  ],
})
export class RoleAndPermissionFormPage implements OnInit, OnDestroy {
  public readonly roleData = signal<ResourceResponseData>({
    resources: [],
    dependentPermission: [],
  });
  readonly permissionFormGroup = inject(PermissionFormGroupService);
  private readonly router = inject(Router);
  private readonly roleApiService = inject(RoleApiService);
  private readonly translocoService = inject(TranslocoService);
  private readonly activeRoute = inject(ActivatedRoute);
  private readonly toastr = inject(ToastrService);

  readonly arRoleNameControl = new FormControl('', [Validators.required]);
  readonly enRoleNameControl = new FormControl('', [Validators.required]);

  @Input() roleId: number;
  readonly isPermissionFormDirty = signal<boolean>(false);

  ngOnInit(): void {
    forkJoin([
      this.roleApiService.fetchResources(),
      this.roleId ? this.roleApiService.fetchRoleById(this.roleId) : of(null),
    ]).subscribe(([resourceResponse, roleResponse]) => {
      this.roleData.set(resourceResponse);
      this.permissionFormGroup.init(resourceResponse);
      if (roleResponse) {
        this.updateForm(roleResponse);
      }
      // Refresh permission states after initialization
      this.permissionFormGroup.refreshPermissionStates();
    });
  }

  updateForm(role: RolePermissionDetail) {
    this.arRoleNameControl.setValue(role.arName);
    this.enRoleNameControl.setValue(role.enName);
    const permissionIds = role.resources.reduce((acc: number[], resource) => {
      resource.permissions.forEach((permission) => {
        acc.push(permission.id);
      });
      return acc;
    }, []);
    this.permissionFormGroup.builkChecked(permissionIds);
    // Refresh permission states after updating form
    this.permissionFormGroup.refreshPermissionStates();
  }

  onSave(): void {
    const permissionIds = this.permissionFormGroup.getSelectedPermissionsIds();
    const arName = this.arRoleNameControl.value;
    const enName = this.enRoleNameControl.value;
    if (!arName || !enName) {
      return;
    }

    const saveRole = this.roleId
      ? this.roleApiService.updateRole(this.roleId, {
          permissionIds,
          arName,
          enName,
        })
      : this.roleApiService.addRole({ permissionIds, arName, enName });
    saveRole.subscribe({
      next: () => {
        this.toastr.success(
          '',
          this.translocoService.translate(
            this.roleId
              ? 'roles_permissions.update_role_msg.txt'
              : 'roles_permissions.add_role_msg.txt',
          ),
        );
        this.navigateBack();
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 409) {
          this.toastr.error(
            '',
            this.translocoService.translate(err.error.messageRef),
          );
        } else {
          this.toastr.error(
            this.translocoService.translate('global.delete_wrong_msg.txt'),
            this.translocoService.translate('global.wrong_msg.title'),
          );
        }
      },
    });
  }

  onCancel() {
    this.navigateBack();
  }

  onAllToggle(
    event: IonCheckboxCustomEvent<CheckboxChangeEventDetail<any>>,
    permissionData: PermissionFormViewData[],
  ) {
    const isChecked = event.detail.checked;
    if (isChecked) {
      this.permissionFormGroup.builkChecked(
        this.getPermissionIds(permissionData),
      );
    } else {
      this.permissionFormGroup.builkUnChecked(
        this.getPermissionIds(permissionData),
      );
    }
    // Refresh permission states after any change
    this.permissionFormGroup.refreshPermissionStates();
    this.isPermissionFormDirty.set(true);
  }

  private getPermissionIds(data: PermissionFormViewData[]) {
    return data.map((item) => item.id);
  }

  onTogglePermission(
    event: IonCheckboxCustomEvent<CheckboxChangeEventDetail<any>>,
    permission: PermissionFormViewData,
  ) {
    const isChecked = event.detail.checked;
    const permissionId = permission.id;

    // If trying to uncheck and permission cannot be unchecked, prevent it
    if (
      !isChecked &&
      !this.permissionFormGroup.canPermissionBeUnchecked(permissionId)
    ) {
      // Reset the checkbox to checked state
      setTimeout(() => {
        if (permission.control) {
          permission.control.setValue(true);
        }
      }, 0);
      return;
    }

    if (isChecked) {
      this.permissionFormGroup.explictChecked(permissionId);
    } else {
      this.permissionFormGroup.explictUnChecked(permissionId);
    }

    // Refresh permission states after any change
    this.permissionFormGroup.refreshPermissionStates();
    this.isPermissionFormDirty.set(true);
  }

  private navigateBack() {
    const forwordUrl = this.activeRoute.snapshot.queryParams['forwordUrl'];
    if (forwordUrl) {
      this.router.navigateByUrl(forwordUrl);
    } else {
      this.router.navigate(['settings/roles']);
    }
  }

  ngOnDestroy(): void {
    this.permissionFormGroup.destroy();
  }

  get isSaveDisabled(): boolean {
    if (this.roleId) {
      return (
        this.arRoleNameControl.invalid ||
        this.enRoleNameControl.invalid ||
        (!this.arRoleNameControl.dirty &&
          !this.enRoleNameControl.dirty &&
          !this.isPermissionFormDirty())
      );
    }
    return this.arRoleNameControl.invalid || this.enRoleNameControl.invalid;
  }
}
