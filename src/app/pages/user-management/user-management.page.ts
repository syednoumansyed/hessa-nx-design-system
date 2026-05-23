import {
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { ViewWillEnter } from '@ionic/angular';
import { NavigationEnd, Router } from '@angular/router';
import { filter, forkJoin, Observable, skip } from 'rxjs';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { DsTabsComponent, Tab } from '@ds/tabs/tabs.component';
import { DsButtonComponent } from '@ds/button/button.component';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { faPlus } from '@fortawesome/pro-solid-svg-icons';
import { StudentsService } from './students/students.service';
import { GuardianService } from './guardians/guardians.service';
import { ApiParam, PersonnelService } from './personnels/personnel.service';
import { StudentsTabComponent } from './tabs/students-tab/students-tab.component';
import { GuardiansTabComponent } from './tabs/guardians-tab/guardians-tab.component';
import { PersonnelsTabComponent } from './tabs/personnels-tab/personnels-tab.component';
import { SchoolStructureListingService } from '@core/school-structure-listing.service';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { LayoutService } from '@layout/layout.service';
import { DsResponsiveTableStateService } from '@ds/ds-responsive-table/ds-responsive-table-state.service';
import { DsFiltersValue } from '@ds/filter-panel/ds-filter-panel.model';

type UserManagementTabId = 'students' | 'guardians' | 'personnels';

interface PrimaryAction {
  label: string;
  route: string;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    DsTabsComponent,
    DsButtonComponent,
    StudentsTabComponent,
    GuardiansTabComponent,
    PersonnelsTabComponent,
  ],
  providers: [SchoolStructureListingService],
  template: `
    <div class="flex h-full min-h-0 flex-col">
      <!-- Tab bar template - projected into each tab's responsive table -->
      <ng-template #tabBar>
        <div
          class="mb-ds-lg flex w-full items-center gap-ds-lg pt-ds-xl lg:mb-0 lg:pt-0"
        >
          <div class="w-full lg:w-fit">
            <app-ds-tabs
              [tabs]="tabs()"
              [activeTabId]="activeTab()"
              (tabChange)="onTabChange($event)"
              variant="secondary"
            />
          </div>
          @if (primaryAction()) {
            <ds-button
              class="ms-auto hidden lg:flex"
              variant="primary"
              size="md"
              [iconStart]="faPlus"
              (click)="onPrimaryAction()"
              >{{ primaryAction()!.label }}</ds-button
            >
          }
        </div>
      </ng-template>

      @switch (activeTab()) {
        @case ('students') {
          <app-students-tab
            class="flex min-h-0 flex-1 flex-col"
            [tabsTemplate]="tabBar"
            [mobilePrimaryAction]="mobilePrimaryAction()"
            [refreshTrigger]="refreshTrigger()"
            (totalItemsChanged)="studentCount.set($event)"
          />
        }
        @case ('guardians') {
          <app-guardians-tab
            class="flex min-h-0 flex-1 flex-col"
            [tabsTemplate]="tabBar"
            [mobilePrimaryAction]="mobilePrimaryAction()"
            [refreshTrigger]="refreshTrigger()"
            (totalItemsChanged)="guardianCount.set($event)"
          />
        }
        @case ('personnels') {
          <app-personnels-tab
            class="flex min-h-0 flex-1 flex-col"
            [tabsTemplate]="tabBar"
            [mobilePrimaryAction]="mobilePrimaryAction()"
            [refreshTrigger]="refreshTrigger()"
            (totalItemsChanged)="personnelCount.set($event)"
          />
        }
      }
    </div>
  `,
})
export class UserManagementPage implements OnInit, OnDestroy, ViewWillEnter {
  private readonly router = inject(Router);
  private readonly rbacService = inject(RoleBaseAccessControlService);
  private readonly translocoService = inject(HesTranslateService);
  private readonly studentService = inject(StudentsService);
  private readonly guardianService = inject(GuardianService);
  private readonly personnelService = inject(PersonnelService);
  private readonly scopeService = inject(SchoolStructureScopeService);
  private readonly academicYearScope = inject(AcademicYearsScopeService);
  private readonly layoutService = inject(LayoutService);
  private readonly tableStateService = inject(DsResponsiveTableStateService);

  protected readonly faPlus = faPlus;

  /** Combined scope signal used for propagation */
  private readonly scopeState = computed(() => ({
    scopeItem: this.scopeService.selectedSchoolStructureItem(),
    academicYear: this.academicYearScope.selectedAcademicYear(),
  }));

  /**
   * When the scope (school/academic year) changes WHILE the user is on the
   * user-management page, propagate the new scope into the localStorage state
   * of all inactive tabs so they load with the correct scope when activated.
   * skip(1) ensures this does NOT fire on the page's initial load.
   */
  private readonly propagateScopeToTabs = toObservable(this.scopeState)
    .pipe(skip(1), takeUntilDestroyed())
    .subscribe(({ scopeItem, academicYear }) => {
      const scope: DsFiltersValue = {};
      scope['schoolStructure'] = scopeItem
        ? ([
            { id: scopeItem.id, type: scopeItem.type, name: scopeItem.name },
          ] as any)
        : undefined;
      scope['academicYearId'] = academicYear?.id;

      // Update scope keys in localStorage for all tabs that have saved state.
      // Tabs without saved state will receive the new scope via initialFilters
      // on their first visit.
      for (const namespace of [
        'students-tab',
        'guardians-tab',
        'personnels-tab',
      ] as const) {
        const saved = this.tableStateService.loadState(namespace);
        if (saved.filters && Object.keys(saved.filters).length > 0) {
          this.tableStateService.saveState(
            { filters: { ...saved.filters, ...scope } },
            namespace,
          );
        }
      }
    });

  readonly activeTab = signal<UserManagementTabId>(this.getFirstPermittedTab());
  readonly studentCount = signal<number | undefined>(undefined);
  readonly guardianCount = signal<number | undefined>(undefined);
  readonly personnelCount = signal<number | undefined>(undefined);

  /** Signal that increments when tabs should refresh (on re-enter) */
  readonly refreshTrigger = signal(0);

  ionViewWillEnter(): void {
    this.refreshTrigger.update((v) => v + 1);
  }

  /**
   * Restore the correct tab when navigating back from a sub-route.
   * e.g. /user-management/personnels/5/view → back to /user-management → "personnels" tab
   */
  private readonly restoreTabOnReturn = this.router.events
    .pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      filter((e) => e.urlAfterRedirects?.startsWith('/user-management')),
      takeUntilDestroyed(),
    )
    .subscribe((event) => {
      // Extract the tab segment from the previous URL
      // NavigationEnd.url contains the *target* URL before redirects
      // e.g. "/user-management/personnels" redirects to "/user-management"
      const match = event.url.match(
        /\/user-management\/(students|guardians|personnels)/,
      );
      if (match) {
        this.activeTab.set(match[1] as UserManagementTabId);
      }
    });

  readonly tabs = computed<Tab<UserManagementTabId>[]>(() => {
    const tabList: Tab<UserManagementTabId>[] = [];

    if (
      this.rbacService.hasPermission(
        RESOURCE_PERMISSION.student.viewStudentsList,
      )
    ) {
      const studentLabel = this.translocoService.t('global.students.title');
      const count = this.studentCount();
      tabList.push({
        id: 'students',
        label:
          count !== undefined ? `${studentLabel} (${count})` : studentLabel,
      });
    }

    if (
      this.rbacService.hasPermission(
        RESOURCE_PERMISSION.guardians.viewGuardiansList,
      )
    ) {
      const guardianLabel = this.translocoService.t('global.guardians.title');
      const count = this.guardianCount();
      tabList.push({
        id: 'guardians',
        label:
          count !== undefined ? `${guardianLabel} (${count})` : guardianLabel,
      });
    }

    if (
      this.rbacService.hasPermission(
        RESOURCE_PERMISSION.personnel.viewPersonnelList,
      )
    ) {
      const personnelLabel = this.translocoService.t('global.personnels.title');
      const count = this.personnelCount();
      tabList.push({
        id: 'personnels',
        label:
          count !== undefined ? `${personnelLabel} (${count})` : personnelLabel,
      });
    }

    return tabList;
  });

  readonly primaryAction = computed<PrimaryAction | null>(() => {
    const tab = this.activeTab();

    switch (tab) {
      case 'students':
        if (
          this.rbacService.hasPermission(
            RESOURCE_PERMISSION.student.addNewStudent,
          )
        ) {
          return {
            label: this.translocoService.t('action.student.new.add'),
            route: '/user-management/students/add',
          };
        }
        return null;

      case 'guardians':
        if (
          this.rbacService.hasPermission(
            RESOURCE_PERMISSION.guardians.addNewGuardian,
          )
        ) {
          return {
            label: this.translocoService.t('action.guardian.new.add'),
            route: '/user-management/guardians/add',
          };
        }
        return null;

      case 'personnels':
        if (
          this.rbacService.hasPermission(
            RESOURCE_PERMISSION.personnel.addNewPersonnel,
          )
        ) {
          return {
            label: this.translocoService.t('action.personnel.new.add'),
            route: '/user-management/personnels/add',
          };
        }
        return null;

      default:
        return null;
    }
  });

  readonly mobilePrimaryAction = computed(() => {
    const action = this.primaryAction();
    if (!action) return null;
    return {
      label: action.label,
      icon: faPlus,
      action: () => this.router.navigate([action.route]),
    };
  });

  ngOnInit(): void {
    this.layoutService.updateSelectedSchoolInfoVisibility(true);
    this.loadTabCounts();
  }

  ngOnDestroy(): void {
    this.layoutService.updateSelectedSchoolInfoVisibility(false);
  }

  onTabChange(tabId: UserManagementTabId): void {
    this.activeTab.set(tabId);
  }

  onPrimaryAction(): void {
    const action = this.primaryAction();
    if (action) {
      this.router.navigate([action.route]);
    }
  }

  private loadTabCounts(): void {
    const scopeItem = this.scopeService.selectedSchoolStructureItem();
    const scopeParams: Record<string, any> = {};
    if (scopeItem) {
      switch (scopeItem.type) {
        case 'company':
        case 'sub-company':
          scopeParams['companyId'] = scopeItem.id;
          break;
        case 'campus':
          scopeParams['campusId'] = scopeItem.id;
          break;
        case 'school':
          scopeParams['schoolId'] = scopeItem.id;
          break;
        case 'level':
          scopeParams['levelId'] = scopeItem.id;
          break;
        case 'class':
          scopeParams['classId'] = scopeItem.id;
          break;
      }
    }

    const minParams = { pageNumber: 1, itemsPerPage: 1, ...scopeParams };

    // Build requests only for tabs the user has permission to view.
    // This prevents 403 errors from failing the entire forkJoin when the user
    // has partial access (e.g., can view students but not guardians).
    const requests: Record<string, Observable<any>> = {};

    if (
      this.rbacService.hasPermission(
        RESOURCE_PERMISSION.student.viewStudentsList,
      )
    ) {
      requests['students'] = this.studentService.fetchStudents(minParams);
    }

    if (
      this.rbacService.hasPermission(
        RESOURCE_PERMISSION.guardians.viewGuardiansList,
      )
    ) {
      requests['guardians'] = this.guardianService.getGuardiansList(minParams);
    }

    if (
      this.rbacService.hasPermission(
        RESOURCE_PERMISSION.personnel.viewPersonnelList,
      )
    ) {
      requests['personnels'] = this.personnelService.fetchPersonnels(
        minParams as Partial<ApiParam>,
      );
    }

    // If no permissions, don't make any requests
    if (Object.keys(requests).length === 0) {
      return;
    }

    forkJoin(requests).subscribe({
      next: (results) => {
        if (results['students']) {
          this.studentCount.set(results['students'].paginate?.totalItems ?? 0);
        }
        if (results['guardians']) {
          this.guardianCount.set(
            results['guardians'].paginate?.totalItems ?? 0,
          );
        }
        if (results['personnels']) {
          this.personnelCount.set(
            results['personnels'].paginate?.totalItems ?? 0,
          );
        }
      },
    });
  }

  private getFirstPermittedTab(): UserManagementTabId {
    if (
      this.rbacService.hasPermission(
        RESOURCE_PERMISSION.student.viewStudentsList,
      )
    )
      return 'students';
    if (
      this.rbacService.hasPermission(
        RESOURCE_PERMISSION.guardians.viewGuardiansList,
      )
    )
      return 'guardians';
    if (
      this.rbacService.hasPermission(
        RESOURCE_PERMISSION.personnel.viewPersonnelList,
      )
    )
      return 'personnels';
    return 'students';
  }
}
