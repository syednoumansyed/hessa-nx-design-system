import { HttpClient } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { sideMenuSchoolStructureItem } from '@layout/layout.component';
import { LANGUAGE_LOCAL_STORAGE_KEY } from '@shared/constants/localstorage-keys.constants';
import {
  Company,
  ORGANIZATION_MAP_FORM_DTO,
} from '@shared/dto-transformation/organization';
import { CompanyDTO } from '@shared/dto-transformation/organization/organization.dto';
import { Language } from '@shared/enums';
import { IResponse } from '@shared/interfaces';
import { UserSettingPayload } from '@shared/interfaces/user-setting.interface';
import { ApiUrl } from '@shared/utils/api-url.util';
import {
  StructureDepth,
  findAllCampuses,
  findAllCompanies,
  findAllSchools,
  findSchoolStructureEntity,
  mapCompaniesWithChildren,
  mergeChildren,
} from '@shared/utils/school-structure';
import { catchError, map, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SchoolStructureScopeService {
  // scoped school structure entities till CLASS for logged in user (default)
  private _userScopedSchoolStructure = signal<sideMenuSchoolStructureItem[]>(
    [],
  );
  userScopedSchoolStructure = this._userScopedSchoolStructure.asReadonly();

  private _isStructureSelectionSaved = signal<boolean>(false);
  isStructureSelectionSaved = this._isStructureSelectionSaved.asReadonly();

  // scoped school structure entities till SCHOOL for logged in user
  private _userScopedSchoolStructureTillSchool = signal<
    sideMenuSchoolStructureItem[]
  >([]);
  userScopedSchoolStructureTillSchool =
    this._userScopedSchoolStructureTillSchool.asReadonly();

  readonly isSchoolStructureEmpty = computed(() => {
    const currScope = this._userScopedSchoolStructure();
    return currScope.length === 0;
  });
  // TODO: remove after hes-table with default scope refactor
  schoolsList = computed(() => {
    const currScope = this._userScopedSchoolStructure();
    return findAllSchools(currScope).map((school) => ({
      value: school.id,
      displayedValue: school.name,
    }));
  });

  // TODO: remove after hes-table with default scope refactor
  campusList = computed(() => {
    const currScope = this._userScopedSchoolStructure();
    return findAllCampuses(currScope).map((school) => ({
      value: school.id,
      displayedValue: school.name,
    }));
  });

  // TODO: remove after hes-table with default scope refactor
  companyList = computed(() => {
    const currScope = this._userScopedSchoolStructure();
    return findAllCompanies(currScope).map((school) => ({
      value: school.id,
      displayedValue: school.name,
    }));
  });

  // current selected school structure entity
  private _selectedSchoolStructureItem =
    signal<sideMenuSchoolStructureItem | null>(
      JSON.parse(localStorage.getItem('selectedSchoolStructureItem') ?? 'null'),
    );
  public selectedSchoolStructureItem =
    this._selectedSchoolStructureItem.asReadonly();

  public selectedSchoolId = computed(() => {
    return this.selectedSchoolStructureItem()?.type === 'school'
      ? this.selectedSchoolStructureItem()?.id
      : null;
  });

  public selectedCampusId = computed(() => {
    return this.selectedSchoolStructureItem()?.type === 'campus'
      ? this.selectedSchoolStructureItem()?.id
      : null;
  });

  private http = inject(HttpClient);
  private _isPopulated = false;
  private _cachedCompanies: Company[] = [];

  constructor() {
    effect(() => {
      localStorage.setItem(
        'selectedSchoolStructureItem',
        JSON.stringify(this.selectedSchoolStructureItem()),
      );
      const userData = JSON.parse(localStorage.getItem('user') ?? 'null');
      if (userData) {
        localStorage.setItem(
          'user',
          JSON.stringify({
            ...userData,
            settings: {
              selectedTargetId: this.selectedSchoolStructureItem()?.id,
              selectedTargetType: this.selectedSchoolStructureItem()?.type,
            },
          }),
        );
      }
    });
  }

  getAllCompanies(): Observable<Company[]> {
    return this.http
      .get<IResponse<CompanyDTO[]>>(`${ApiUrl.v1BE}/companies/`)
      .pipe(
        map(({ data }) => {
          return ORGANIZATION_MAP_FORM_DTO.companies(data);
        }),
      );
  }

  setStructureSelectionSaved(save: boolean) {
    this._isStructureSelectionSaved.set(save);
    this.setUserSetting();
  }

  setUserSetting() {
    this.saveUserSetting$().subscribe();
  }

  saveUserSetting$() {
    const selectedTargetType =
      this.selectedSchoolStructureItem()?.type.includes('company')
        ? 'company'
        : this.selectedSchoolStructureItem()?.type;
    const userSetting: UserSettingPayload = {
      clearStructureSelection: !this.isStructureSelectionSaved(),
      selectedTargetId: this.selectedSchoolStructureItem()?.id,
      selectedTargetType,
      selectedLanguage: localStorage.getItem(
        LANGUAGE_LOCAL_STORAGE_KEY,
      ) as Language,
    };
    return this.http.put(`${ApiUrl.v1BE}/user-settings`, userSetting);
  }

  populateDefaultScope(forceRefresh = false) {
    if (this._isPopulated && !forceRefresh) {
      return of(this._cachedCompanies);
    }

    const userData = JSON.parse(localStorage.getItem('user') ?? 'null');
    const settings = userData?.settings;
    let seStructureItemCallback: undefined | ((item: any) => void) = undefined;
    if (settings?.selectedTargetId && settings?.selectedTargetType) {
      this.setStructureSelectionSaved(true);
      seStructureItemCallback = (item) => {
        if (
          item.id === settings.selectedTargetId &&
          item.type.includes(settings.selectedTargetType)
        ) {
          this._selectedSchoolStructureItem.set(item);
        }
      };
    }
    return this.getAllCompanies().pipe(
      catchError((error) => {
        if (error.status === 404) {
          return of([]);
        }
        throw error;
      }),
      map((res) => {
        this._userScopedSchoolStructure.set(
          mergeChildren(
            mapCompaniesWithChildren(res, StructureDepth.CLASS),
            seStructureItemCallback,
          ),
        );
        this._userScopedSchoolStructureTillSchool.set(
          mergeChildren(mapCompaniesWithChildren(res, StructureDepth.SCHOOL)),
        );
        this._isPopulated = true;
        this._cachedCompanies = res;
        return res;
      }),
    );
  }

  updateSelectedStructure(item: sideMenuSchoolStructureItem | null) {
    if (item === null) this._selectedSchoolStructureItem.set(null);
    else {
      const schoolStructureItemTillClass = findSchoolStructureEntity(
        this._userScopedSchoolStructure(),
        item.type,
        item.id,
      );
      this._selectedSchoolStructureItem.set(schoolStructureItemTillClass);
    }
    this.setUserSetting();
  }

  getUserScopedSchoolStructureTillDepth(
    depth: StructureDepth,
    items: sideMenuSchoolStructureItem[] = this.userScopedSchoolStructure(),
  ): sideMenuSchoolStructureItem[] {
    return items
      .filter((item) => item.depth <= depth)
      .map((item) => ({
        ...item,
        children: this.getUserScopedSchoolStructureTillDepth(
          depth,
          item.children,
        ),
      }));
  }

  getSelectedScopedEntitiesOrAll(depth: StructureDepth) {
    const selectedItem = this.selectedSchoolStructureItem();

    // If no item is selected, return sorted entities at the specified depth for all user-scoped structure
    if (!selectedItem) {
      return this.userScopedSchoolStructure()
        .flatMap((item) => this.getSelectedScopedEntities(depth, item))
        .sort((a, b) => a.displayedValue.localeCompare(b.displayedValue));
    }

    // Otherwise, find and sort scoped entities from the selected item
    return this.getSelectedScopedEntities(depth, selectedItem).sort((a, b) =>
      a.displayedValue.localeCompare(b.displayedValue),
    );
  }

  getSelectedScopedEntities(
    depth: StructureDepth,
    selectedItem: sideMenuSchoolStructureItem | null = this.selectedSchoolStructureItem(),
  ) {
    if (!selectedItem) {
      return [];
    }

    // Check if the current item matches the requested depth
    if (selectedItem.depth === depth) {
      return [
        {
          value: selectedItem.id,
          displayedValue: selectedItem.name,
        },
      ];
    }

    // Recursive search for matching entities at the specified depth
    const findEntitiesByDepth = (
      items: sideMenuSchoolStructureItem[],
      targetDepth: StructureDepth,
    ): sideMenuSchoolStructureItem[] => {
      return items.flatMap((item) => {
        if (item.depth === targetDepth) {
          return [item]; // Match the requested depth
        } else if (item.children && item.children.length > 0) {
          return findEntitiesByDepth(item.children, targetDepth); // Recurse into children
        }
        return [];
      });
    };

    // Search the children of the selected item
    const scopedEntities = selectedItem.children
      ? findEntitiesByDepth(selectedItem.children, depth)
      : [];

    // Map to desired format and sort the result
    return scopedEntities
      .map((entity) => ({
        value: entity.id,
        displayedValue: entity.name,
      }))
      .sort((a, b) => a.displayedValue.localeCompare(b.displayedValue));
  }

  getLevelsBySchoolIds(schoolIds: number[]): sideMenuSchoolStructureItem[] {
    const structure = this.userScopedSchoolStructure();
    return schoolIds.flatMap((schoolId) => {
      // Locate the school entity by its id
      const school = findSchoolStructureEntity(structure, 'school', schoolId);
      // Return its children filtered by type "level" (if necessary)
      return school?.children?.filter((child) => child.type === 'level') || [];
    });
  }
}
