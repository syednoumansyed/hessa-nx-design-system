import {
  Component,
  HostBinding,
  Optional,
  ViewEncapsulation,
  WritableSignal,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { IFloatingFilterAngularComp } from 'ag-grid-angular';
import { debounceTime, distinctUntilChanged, skip, tap } from 'rxjs';
import { IFloatingFilterParams } from 'ag-grid-community';
import { IFilterEvent } from '../model';

import { Platform } from '@ionic/angular/standalone';
import { randomId } from '@shared/utils/randomId';
import { formatDateToUnix } from '@shared/utils/date';
import { HesSearchableSelectComponent } from '@ui-kit/hes-searchable-select/hes-searchable-select.component';
import { SchoolStructureEntityType } from '@ui-kit/hes-school-structure-control/school-structure-control-item.interface';
import { SchoolStructureListingService } from '@core/school-structure-listing.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { Idropdown } from '@shared/interfaces';
import { isMobile } from '@shared/utils/platform';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { TUI_DATE_VALUE_TRANSFORMER, TuiInputDateModule } from '@taiga-ui/kit';
import { TuiMobileCalendarDialogModule } from '@taiga-ui/addon-mobile';
import {
  TUI_TEXTFIELD_APPEARANCE_DIRECTIVE,
  TuiTextfieldControllerModule,
} from '@taiga-ui/core';
import { ExampleDateTransformer } from '@shared/components/form-control-generator/date-range-value-transformer';
import { TUI_DATE_SEPARATOR } from '@taiga-ui/cdk';
import { AcademicYearItem } from '@shared/interfaces/academic-year-scope.interface';
import { HesTranslateService } from '@shared/services/hes-translate.service';

type ICustomFloatingFilterParams = IFloatingFilterParams & {
  type: 'text' | 'select';
  onChange: (filter: IFilterEvent) => void;
  placeholder: string;
  selectValues: Array<{ value: string | number; displayedValue: string }>; // for select type
  initSelection: string | number; // for select type
  SchoolStructureListingType?: SchoolStructureEntityType;
  filterSelectOptionsSignal?: WritableSignal<Idropdown[]>;
  includeNoneOption?: boolean;
};

@Component({
  selector: 'app-cutom-floating-filter',
  templateUrl: './custom-floating-filter.component.html',
  styleUrl: './custom-floating-filter.component.scss',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    HesSearchableSelectComponent,
    TuiInputDateModule,
    TuiMobileCalendarDialogModule,
    TuiTextfieldControllerModule,
  ],
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
export class CustomFloatingFilterComponent
  implements IFloatingFilterAngularComp
{
  platform = inject(Platform);
  params: ICustomFloatingFilterParams;

  filterValue = new FormControl<any>(null);

  dateControl: FormControl<Date | null>;

  isMobile = isMobile();

  type = signal<'text' | 'select' | 'date'>('text');
  dropdown = signal<any[]>([]);
  randomId: string = randomId();
  SchoolStructureListingType = signal<SchoolStructureEntityType | false>(false);
  isAcademicYearFilter = signal<boolean>(false);
  controlListing = computed<any[]>(() => {
    const control = this.SchoolStructureListingType();
    const includeNoneOption = this.params.includeNoneOption ?? true;
    const listingSignal = this.params.filterSelectOptionsSignal;
    const noneLabel = this.hesTranslate.globalTObj.none;
    if (control) {
      let listing: any[] | null;
      switch (control) {
        case 'company':
        case 'sub-company':
          listing = this.schoolStructureListingService.companyList();
          break;
        case 'campus':
          listing = this.schoolStructureListingService.campusList();
          break;
        case 'school':
          listing = this.schoolStructureListingService.schoolsList();
          break;
        case 'level':
          listing = this.schoolStructureListingService.levelsList();
          break;
        case 'class':
          listing = this.schoolStructureListingService.classesList();
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

  selectedSchoolStructureModel$ = toObservable(
    this.schoolStructureListingService?.selectedSchoolStructureModel,
  );
  selectedAcademicYear$ = toObservable(
    this.academicYearsScopeService?.selectedAcademicYear,
  );
  SelectedAcademicYearlistener$ = this.selectedAcademicYear$.pipe(
    distinctUntilChanged(),
  );

  listener$ = this.selectedSchoolStructureModel$.pipe(
    distinctUntilChanged(),
    tap((model) => {
      switch (this.SchoolStructureListingType()) {
        case 'company':
        case 'sub-company':
          this.filterValue.patchValue(model.selectedCompany?.id, {
            emitEvent: false,
          });
          break;
        case 'campus':
          this.filterValue.patchValue(model.selectedCampus?.id, {
            emitEvent: false,
          });
          break;
        case 'school':
          this.filterValue.patchValue(model.selectedSchool?.id, {
            emitEvent: false,
          });
          break;
        case 'level':
          this.filterValue.patchValue(model.selectedLevel?.id, {
            emitEvent: false,
          });
          break;
        case 'class':
          this.filterValue.patchValue(model.selectedClass?.id, {
            emitEvent: false,
          });
          break;
      }
    }),
  );

  constructor(
    @Optional()
    private schoolStructureListingService: SchoolStructureListingService,
    private academicYearsScopeService: AcademicYearsScopeService,
    private hesTranslate: HesTranslateService,
  ) {}

  agInit(params: ICustomFloatingFilterParams): void {
    this.params = params;
    this.type.set(params.type);
    this.dropdown.set(params.selectValues);
    if (this.schoolStructureListingService) {
      this.listener$.subscribe();
    }

    if (
      this.params.column.getColDef().field === 'academicYearId' ||
      this.params.column.getColDef().field === 'academicYear'
    ) {
      this.isAcademicYearFilter.set(true);
      this.SelectedAcademicYearlistener$.pipe(
        skip(this.params.hasOwnProperty('initSelection') ? 1 : 0),
      ).subscribe((year: AcademicYearItem | null) => {
        // Updated type to accept null
        this.filterValue.patchValue(year?.id, {
          emitEvent: false,
        });
      });
    } else this.isAcademicYearFilter.set(false);

    this.SchoolStructureListingType.set(
      params.SchoolStructureListingType ?? false,
    );

    if (params.type === 'select') {
      if (params.SchoolStructureListingType) {
        let initSelection;
        switch (params.SchoolStructureListingType) {
          case 'company':
          case 'sub-company':
            initSelection =
              this.schoolStructureListingService.selectedCompany();
            break;
          case 'campus':
            initSelection = this.schoolStructureListingService.selectedCampus();
            break;
          case 'school':
            initSelection = this.schoolStructureListingService.selectedSchool();
            break;
          case 'level':
            initSelection = this.schoolStructureListingService.selectedLevel();
            break;
          case 'class':
            initSelection = this.schoolStructureListingService.selectedClass();
            break;
        }
        this.filterValue.setValue(initSelection?.id, {
          emitEvent: false,
        });
      } else if (
        this.params.column.getColDef().field === 'academicYearId' ||
        this.params.column.getColDef().field === 'academicYear'
      ) {
        if (params.hasOwnProperty('initSelection')) {
          this.filterValue.setValue(params.initSelection, {
            emitEvent: false,
          });
        } else {
          const initSelection =
            this.academicYearsScopeService.selectedAcademicYear();
          this.filterValue.setValue(initSelection?.id, {
            emitEvent: false,
          });
        }
      } else if (params.initSelection)
        this.filterValue.setValue(params.initSelection.toString(), {
          emitEvent: false,
        });
    }

    switch (this.type()) {
      case 'select':
        this.filterValue.valueChanges
          .pipe(distinctUntilChanged())
          .subscribe((value) => {
            if (
              this.SchoolStructureListingType() &&
              this.schoolStructureListingService
            ) {
              switch (this.SchoolStructureListingType()) {
                case 'company':
                case 'sub-company':
                  this.schoolStructureListingService.updateSelectedCompany(
                    value,
                  );
                  break;
                case 'campus':
                  this.schoolStructureListingService.updateSelectedCampus(
                    value,
                  );
                  break;
                case 'school':
                  this.schoolStructureListingService.updateSelectedSchool(
                    value,
                  );
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
            } else {
              this.onFilterChange(value?.toString() ?? null);
            }
          });
        break;

      case 'date':
        this.listenToDateControlValueChange();
        break;

      case 'text':
      default:
        this.filterValue.valueChanges
          .pipe(debounceTime(500), distinctUntilChanged())
          .subscribe((value) => {
            this.onFilterChange(value);
          });
        break;
    }
  }

  onParentModelChanged(_parentModel: any): void {
    // react to changes in the parent filter
  }

  onFilterChange(value: string | null): void {
    const fieldName = this.params.column.getColDef().field;
    if (fieldName) {
      const filter: IFilterEvent = {
        name: fieldName,
        value: value?.length ? value : null,
      };
      this.params.onChange(filter);
    }

    // update the grid row data when the input value changes
    this.params.parentFilterInstance(() => {
      // call the function to update the grid row data
    });
  }

  private listenToDateControlValueChange() {
    if (this.type() === 'date') {
      this.dateControl = new FormControl<Date | null>(null);
      this.dateControl.valueChanges
        .pipe(distinctUntilChanged())
        .subscribe((value) => {
          if (value) {
            this.onFilterChange(
              formatDateToUnix(value.toISOString()).toString(),
            );
          } else {
            this.onFilterChange(null);
          }
        });
    }
  }

  @HostBinding('class')
  get elementClasses() {
    return 'w-full';
  }
}
