import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
  output,
  signal,
  ViewEncapsulation,
  WritableSignal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { SchoolStructureListingService } from '@core/school-structure-listing.service';
import { ExampleDateTransformer } from '@shared/components/form-control-generator/date-range-value-transformer';
import { Idropdown } from '@shared/interfaces';
import { TuiMobileCalendarDialogModule } from '@taiga-ui/addon-mobile';
import { TUI_DATE_SEPARATOR } from '@taiga-ui/cdk';
import {
  TUI_TEXTFIELD_APPEARANCE_DIRECTIVE,
  TuiTextfieldControllerModule,
} from '@taiga-ui/core';
import { TUI_DATE_VALUE_TRANSFORMER, TuiInputDateModule } from '@taiga-ui/kit';
import { SchoolStructureEntityType } from '@ui-kit/hes-school-structure-control/school-structure-control-item.interface';
import { HesSearchableSelectComponent } from '@ui-kit/hes-searchable-select/hes-searchable-select.component';
import { IFilterEvent, ITableCol } from '@ui-kit/hes-table/model';
import { distinctUntilChanged } from 'rxjs';
import { ListViewContextService } from '../../list-view-context.service';
import { HesChipSelectorComponent } from '@ui-kit/chip-selector-component/chip-selector.component';
import { HesButtonModule } from '../../../hes-button/hes-button.module';
import { faAngleDown } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HesTranslateService } from '@shared/services/hes-translate.service';

@Component({
  selector: 'app-filter-control',
  templateUrl: './filter-control.component.html',
  styleUrls: ['./filter-control.component.scss'],
  imports: [
    ReactiveFormsModule,
    HesSearchableSelectComponent,
    TuiInputDateModule,
    TuiMobileCalendarDialogModule,
    TuiTextfieldControllerModule,
    HesChipSelectorComponent,
    HesButtonModule,
    FontAwesomeModule,
  ],
  standalone: true,
  providers: [
    {
      provide: TUI_TEXTFIELD_APPEARANCE_DIRECTIVE,
      useValue: {
        appearance: 'hes-date-table-filter',
      },
    },
    { provide: TUI_DATE_SEPARATOR, useValue: '/' },
    {
      provide: TUI_DATE_VALUE_TRANSFORMER,
      useClass: ExampleDateTransformer,
    },
  ],
  encapsulation: ViewEncapsulation.None,
})
export class FilterControlComponent implements OnInit {
  // #region input and output
  params = input<ITableCol>();
  filterChange = output<IFilterEvent>();
  // #endregion

  // #region injector
  private readonly schoolStructureListingService = inject(
    SchoolStructureListingService,
    { optional: true },
  );
  private readonly academicYearsScopeService = inject(
    AcademicYearsScopeService,
  );
  private readonly listViewContextService = inject(ListViewContextService);
  private readonly destroyRef$ = inject(DestroyRef);
  // #endregion

  // #region protected properties
  protected readonly isCollapsed = signal<boolean>(true);
  protected readonly isCollapsedEnable = computed(() => {
    return this.controlListing().length > 15;
  });
  protected readonly contentShown = computed<boolean>(() => {
    return this.isCollapsedEnable() ? !this.isCollapsed() : true;
  });
  protected type = computed(() => {
    return this.params()?.filterType;
  });

  protected readonly isEmptyList = computed(() => {
    if (this.params()?.filterType === 'chip-selector') {
      return this.controlListing().length > 0;
    }
    return true;
  });
  protected readonly angalDownIcon = faAngleDown;
  protected filterValue = new FormControl<any>(null);

  protected readonly controlListing = computed<any[]>(() => {
    const control = this.schoolStructureListingType();
    const includeNoneOption = this.params()?.includeNoneOption ?? true;
    const listingSignal = this.params()?.filterSelectOptionsSignal;
    const noneLabel = this.hesTranslate.globalTObj.none;
    if (control) {
      let listing: any[] | null;
      switch (control) {
        case 'company':
        case 'sub-company':
          listing = this.schoolStructureListingService?.companyList() ?? null;
          break;
        case 'campus':
          listing = this.schoolStructureListingService?.campusList() ?? null;
          break;
        case 'school':
          listing = this.schoolStructureListingService?.schoolsList() ?? null;
          break;
        case 'level':
          listing = this.schoolStructureListingService?.levelsList() ?? null;
          break;
        case 'class':
          listing = this.schoolStructureListingService?.classesList() ?? null;
          break;
        default:
          listing = null;
          break;
      }
      return listing
        ? [
            ...listing.map((entity) => ({
              ...entity,
              value: entity.id,
              displayedValue: entity.name,
            })),
            ...(includeNoneOption
              ? [
                  {
                    value: 0,
                    displayedValue: noneLabel,
                  },
                ]
              : []),
          ]
        : this.dropdown();
    } else if (this.isAcademicYearFilter()) {
      return [
        ...this.academicYearsScopeService.AcademicYearsListing(),
        ...(includeNoneOption
          ? [
              {
                value: 0,
                displayedValue: noneLabel,
              },
            ]
          : []),
      ];
    } else if (listingSignal) {
      return listingSignal();
    } else return this.dropdown();
  });
  private readonly hesTranslate = inject(HesTranslateService);
  // #endregion

  // #region private properties
  private readonly schoolStructureListingType = computed(() => {
    return this.params()?.SchoolStructureListingType;
  });

  private readonly dropdown = computed(() => {
    return this.params()?.filterSelectOptions ?? [];
  });

  private isAcademicYearFilter = computed(() => {
    return (
      this.params()?.field === 'academicYearId' ||
      this.params()?.field === 'academicYear'
    );
  });
  // #endregion

  // #region Protected methods
  ngOnInit() {
    if (this.type() === 'date') {
      this.filterValue = new FormControl<Date | null>(null);
    }

    this.syncFilterStateWithStore();
    if (this.params()?.SchoolStructureListingType) {
      this.listenToFilterValueChanges();
    }
  }
  protected onToggleCollapsed() {
    this.isCollapsed.set(!this.isCollapsed());
  }
  // #endregion

  // #region Private methods
  private syncFilterStateWithStore(): void {
    const col = this.params()!;

    // Check if there's a saved state in the store and initialize the filter value
    if (this.listViewContextService.hasModalFilterState(col.field)) {
      this.filterValue.setValue(
        this.listViewContextService.getModalFilterState(col.field).value,
      );
    }

    // Subscribe to changes in the filter value and update the store
    this.filterValue.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef$))
      .subscribe(() => {
        this.listViewContextService.setModalFilterState(
          col,
          this.filterValue.value,
        );
      });
  }

  private listenToFilterValueChanges() {
    if (this.type() === 'select' || this.type() === 'chip-selector') {
      this.filterValue.valueChanges
        .pipe(distinctUntilChanged())
        .subscribe((value) => {
          if (
            this.schoolStructureListingType() &&
            this.schoolStructureListingService
          ) {
            switch (this.schoolStructureListingType()) {
              case 'company':
              case 'sub-company':
                this.schoolStructureListingService.updateSelectedCompany(value);
                break;
              case 'campus':
                this.schoolStructureListingService.updateSelectedCampus(value);
                break;
              case 'school':
                this.schoolStructureListingService.updateSelectedSchool(value);
                break;
              case 'level':
                this.schoolStructureListingService.updateSelectedLevel(value);
                break;
              case 'class':
                this.schoolStructureListingService.updateSelectedClass(value);
                break;
              default:
                break;
            }
          }
        });
    }
  }
  // #endregion
}
