import { Injectable, inject, signal } from '@angular/core';
import { RoleApiService } from '@core/api-services/role-api/role.api-service';
import { AnnouncementService } from '@pages/announcements/data-access/announcement.service';
import { ISelectValue } from '@shared/components/form-control-generator/form-control-generator.component';
import { SchoolStructureControlItem } from '@ui-kit/hes-school-structure-control/school-structure-control-item.interface';

@Injectable({
  providedIn: 'root',
})
export class PostFormStore {
  private _schoolStructure = signal<SchoolStructureControlItem[]>([]);
  readonly schoolStructure = this._schoolStructure.asReadonly();

  private readonly _roles = signal<ISelectValue[]>([]);
  readonly roles = this._roles.asReadonly();
  private readonly announcementApiService = inject(AnnouncementService);

  private readonly roleApiService = inject(RoleApiService);

  loadDataStructure() {
    const resp = this.announcementApiService.getSchoolStructure();
    this._schoolStructure.set(resp);
  }

  loadRoles() {
    this.roleApiService.fetchRolesForDropDown().subscribe((resp) => {
      this._roles.set(resp);
    });
  }

  setRoles(roles: ISelectValue[]) {
    this._roles.set(roles);
  }

  clearRoles() {
    this._roles.set([]);
  }
}
