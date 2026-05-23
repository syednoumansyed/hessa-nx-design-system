import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { PersonnelService } from '@pages/user-management/personnels/personnel.service';
import { IResponse } from '@shared/interfaces';
import { DsSelectConfig } from 'src/app/design-system/select/select.interface';
import { faHome, faMessage, faUser } from '@fortawesome/pro-regular-svg-icons';
import { DsSelectComponent } from 'src/app/design-system/select/select.component';
import { map } from 'rxjs';
import { DsButtonComponent } from 'src/app/design-system/button/button.component';

@Component({
  selector: 'app-select-testing',
  templateUrl: './select-testing.component.html',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    DsSelectComponent,
    DsButtonComponent,
  ],
})
export class SelectTestingComponent implements OnInit {
  private readonly personnelService = inject(PersonnelService);

  selectConfig: DsSelectConfig = {
    label: 'Personnel',
    placeholder: 'Select a personnel',
    options: new Array(50).fill(0).map((_, index) => {
      return {
        id: index,
        display: 'Student ' + index,
        secondaryDisplay: '@abdullah',
        icon: faUser,
        disabled: [2, 3, 6].includes(index),
      };
    }),
  };

  multiSelectConfig: DsSelectConfig = {
    ...this.selectConfig,
    options: new Array(20).fill(0).map((_, index) => {
      return {
        id: index,
        display: 'Student ' + index,
        secondaryDisplay: '@abdullah',
        icon: faUser,
        disabled: [2, 3, 6].includes(index),
      };
    }),
    isMultiple: true,
  };

  paginatedConfig: DsSelectConfig = {
    placeholder: 'Selecte Personnel',
    label: 'Paginated  Select',
    isMultiple: false,
    fieldMapper: {
      display: (item) => item.displayName,
    },
    isPaginated: true,
    loadOptions: ({ params, searchText }) => {
      return this.personnelService.fetchPersonnels({
        ...params,
        ...(searchText && { enFullName: searchText }),
      });
    },
    loadSelectedItems: ({ selectedId }) => {
      return this.personnelService
        .fetchPersonnels({
          pageNumber: 1,
          itemsPerPage: 1,
          personnelId: selectedId,
        })
        .pipe(
          map((response) => {
            const { paginate, ...rest } = response;
            return rest as IResponse<any>;
          }),
        );
    },
  };
  paginatedMultiConfig: DsSelectConfig = {
    placeholder: 'Selecte Personnel',
    label: 'Paginated Multi Select',
    isMultiple: true,
    fieldMapper: {
      display: (item) => item.displayName,
    },
    isPaginated: true,
    loadOptions: ({ params, searchText }) => {
      return this.personnelService.fetchPersonnels({
        ...params,
        ...(searchText && { enFullName: searchText }),
      });
    },
    loadSelectedItems: ({ selectedId }) => {
      return this.personnelService
        .fetchPersonnels({
          pageNumber: 1,
          itemsPerPage: 1,
          personnelId: selectedId,
        })
        .pipe(
          map((response) => {
            const { paginate, ...rest } = response;
            return rest as IResponse<any>;
          }),
        );
    },
  };

  nonPaginatedConfig: DsSelectConfig = {
    placeholder: 'Selecte Personnel',
    label: 'Non Paginated Select',
    fieldMapper: {
      display: (item) => item.displayName,
    },
    isMultiple: true,
    loadOptions: ({ params, searchText }) => {
      return this.personnelService
        .fetchPersonnels({
          ...params,
          ...(searchText && { enFullName: searchText }),
        })
        .pipe(
          map((response) => {
            const { paginate, ...rest } = response;
            return rest as IResponse<any>;
          }),
        );
    },
  };
  nonePaginatedMultiConfig: DsSelectConfig = {
    placeholder: 'Selecte Personnel',
    label: 'Non multi Paginated Select',
    fieldMapper: {
      display: (item) => item.displayName,
    },
    isMultiple: true,
    loadOptions: ({ params, searchText }) => {
      return this.personnelService
        .fetchPersonnels({
          ...params,
          ...(searchText && { enFullName: searchText }),
        })
        .pipe(
          map((response) => {
            const { paginate, ...rest } = response;
            return rest as IResponse<any>;
          }),
        );
    },
  };

  dynamicLoadConfig: DsSelectConfig = {
    ...this.selectConfig,
    label: 'Dynamic Load Select',
    placeholder: 'Select a student',
  };

  selectCtrl = new FormControl(1);
  multiSelectCtrl = new FormControl([1, 4]);
  paginatedSelectCtrl = new FormControl(1);
  paginatedMultiSelectCtrl = new FormControl([1, 43]);
  nonePaginatedSelectControl = new FormControl(1);
  nonPaginatedMultiSelectControl = new FormControl([1, 4]);
  dynamicCtrl = new FormControl(1);

  dynamicLoadCtrl = new FormControl(1);
  constructor() {}

  ngOnInit() {}
  onLoad() {
    this.dynamicLoadConfig = {
      ...this.dynamicLoadConfig,
      options: new Array(50).fill(0).map((_, index) => {
        return {
          id: index,
          display: 'Personal ' + index,
          secondaryDisplay: '@shahid',
          icon: faUser,
          disabled: [2, 3, 6].includes(index),
        };
      }),
      placeholder: 'Select a Personnel',
      label: 'Personal',
    };
    setTimeout(() => {
      this.dynamicCtrl.setValue(4);
    });
  }
}
