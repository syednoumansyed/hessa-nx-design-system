import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { faPlus } from '@fortawesome/pro-light-svg-icons';
import { ApiParam, PersonnelService } from './personnel.service';
import { Gender, SortOrder } from '@shared/enums';
import {
  PersonnelTableCol,
  PersonnelTableColDefService,
} from './personnels-col-def.service';
import { IPaginatedResponse, IPagination } from '@shared/interfaces';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { map, Subscription } from 'rxjs';
import { PersonnelStatusService } from './utils/personnel-status.service';
import {
  TranslocoDirective,
  TranslocoModule,
  TranslocoService,
} from '@jsverse/transloco';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { SchoolStructureListingService } from '@core/school-structure-listing.service';
import { DEFAULT_PARAM } from '@shared/constants/default-page-param.constant';
import { Personnel } from '@shared/dto-transformation';
import {
  ListViewContainerComponent,
  ListViewNoDataConfig,
} from '@ui-kit/hes-responsive-list-view/list-view-container/list-view-container.component';
import { IListViewPrimaryAction } from '@ui-kit/hes-responsive-list-view/list-view.interface';

interface PersonnelTableMataData {
  id?: number;
  nationalId?: string;
  fullName?: string;
  phoneNumber?: string;
  gender?: Gender;
  employeeIdentifier?: string;
  nationality?: number;
  dateOfBirth?: string;
  status?: string;
  order?: SortOrder;
  pageNumber?: number;
  itemsPerPage?: number;
  sortByColumn?: string;
  searchText?: string;
}

@Component({
  selector: 'app-personnels',
  templateUrl: './personnels.page.html',
  standalone: true,
  imports: [
    FormsModule,
    HesButtonModule,
    RouterModule,
    TranslocoModule,
    ListViewContainerComponent,
    TranslocoDirective,
  ],
  providers: [PersonnelTableColDefService, SchoolStructureListingService],
})
export class PersonnelsPage implements OnDestroy, OnInit {
  private readonly translocoService = inject(TranslocoService);
  private readonly personnelService = inject(PersonnelService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly personnelTableColDefService = inject(
    PersonnelTableColDefService,
  );
  private readonly rbacService = inject(RoleBaseAccessControlService);

  readonly addPersonnelPermissionId = [
    RESOURCE_PERMISSION.personnel.addNewPersonnel,
  ];

  readonly data = signal<IPaginatedResponse<Personnel[]> | null>(null);
  readonly apiQueryParam = signal<ApiParam>(DEFAULT_PARAM);
  readonly columns = this.personnelTableColDefService.columns;
  readonly paginate = signal<IPagination | null>(null);
  readonly tableData = signal<Array<PersonnelTableCol>>([]);
  private readonly subscription = new Subscription();
  private readonly personnelStatusService = inject(PersonnelStatusService);
  private readonly viewContainerListRef = viewChild<ListViewContainerComponent>(
    ListViewContainerComponent,
  );
  readonly faPlus = faPlus;
  primaryActions = computed<IListViewPrimaryAction[]>(() => {
    return [
      {
        onClick: () => {
          this.router.navigate(['add'], { relativeTo: this.route });
        },
        text: this.translocoService.translate(
          'user_management.add_personnel.btn',
        ),
        isVisible: () => {
          return this.rbacService.hasPermission(
            RESOURCE_PERMISSION.personnel.addNewPersonnel,
          );
        },
      },
    ];
  });
  noDataConfig: ListViewNoDataConfig = {
    mainImagePath: 'assets/illustrations/no_data.svg',
    title: this.translocoService.translate('user_management.no_personnels.txt'),
    ...(this.rbacService.hasPermission(
      RESOURCE_PERMISSION.personnel.addNewPersonnel,
    ) && {
      primaryButton: {
        label: this.translocoService.translate(
          'user_management.add_personnel.btn',
        ),
        onAction: () => {
          this.router.navigate(['add'], { relativeTo: this.route });
        },
      },
    }),
  };

  ngOnInit(): void {
    this.subscription.add(
      this.personnelStatusService.actionComplete$.subscribe(() => {
        this.viewContainerListRef()?.triggerFetch();
      }),
    );
  }

  fetchPersonnelList = (params: Record<string, any>) => {
    const query = { ...DEFAULT_PARAM, ...params };

    return this.personnelService.fetchPersonnels(query).pipe(
      map((resp: IPaginatedResponse<Personnel[]>) => ({
        data: this.personnelTableColDefService.mapTableData(resp.data),
        paginate: resp.paginate,
      })),
    );
  };

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  onRowClicked(event: PersonnelTableCol) {
    if (
      this.rbacService.hasPermission(
        RESOURCE_PERMISSION.personnel.viewPersonnelProfile,
      ) ||
      this.rbacService.isCurrentUser(event.userId)
    ) {
      this.router.navigate([event.id], {
        relativeTo: this.route,
      });
    }
  }
}
