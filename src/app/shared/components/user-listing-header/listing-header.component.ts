import {
  Component,
  DestroyRef,
  EnvironmentInjector,
  HostBinding,
  Input,
  OnInit,
  ViewEncapsulation,
  computed,
  inject,
  input,
  output,
  runInInjectionContext,
  signal,
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlus } from '@fortawesome/pro-solid-svg-icons';
import { RbacSomeDirective } from '@shared/role-bace-acces-controller/rbac.directive';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { Platform, IonSkeletonText } from '@ionic/angular/standalone';
import { isMobile } from '@shared/utils/platform';
import { randomId } from '@shared/utils/randomId';
import { NgClass } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, skip } from 'rxjs';
import { formatToHesDate } from '@shared/utils/date';
import { RouterModule } from '@angular/router';
import { SchoolStructureListingService } from '@core/school-structure-listing.service';
import {
  IControl,
  FormControlGeneratorComponent,
} from '../form-control-generator/form-control-generator.component';
import { TuiMobileCalendarDialogModule } from '@taiga-ui/addon-mobile';
import {
  TUI_TEXTFIELD_APPEARANCE_DIRECTIVE,
  TuiTextfieldControllerModule,
} from '@taiga-ui/core';
import { TUI_DATE_VALUE_TRANSFORMER, TuiInputDateModule } from '@taiga-ui/kit';
import { TUI_DATE_SEPARATOR, TuiDay } from '@taiga-ui/cdk';
import { ExampleDateTransformer } from '../form-control-generator/date-range-value-transformer';
import { IconDefinition } from '@fortawesome/pro-regular-svg-icons';

@Component({
  selector: 'app-listing-header',
  templateUrl: './listing-header.component.html',
  styleUrl: './listing-header.component.scss',
  standalone: true,
  imports: [
    IonSkeletonText,
    FontAwesomeModule,
    HesButtonModule,
    RbacSomeDirective,
    ReactiveFormsModule,
    RouterModule,
    FormControlGeneratorComponent,
    NgClass,
    TuiInputDateModule,
    TuiMobileCalendarDialogModule,
    TuiTextfieldControllerModule,
  ],
  providers: [
    {
      provide: TUI_TEXTFIELD_APPEARANCE_DIRECTIVE,
      useValue: {
        appearance: 'hes-date-filter',
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
export class ListingHeaderComponent implements OnInit {
  faPlus = faPlus;
  isMobile = isMobile();
  randomId = randomId();

  private readonly platform = inject(Platform);
  private readonly schoolStructureListingService = inject(
    SchoolStructureListingService,
    {
      optional: true,
    },
  );
  private environmentInjector = inject(EnvironmentInjector);
  destroyRef = inject(DestroyRef);
  @Input() title: string;
  @Input() countTitle: string;
  @Input() countValue: string | undefined;

  primaryBtnIcon = input<IconDefinition>();
  secondaryBtnIcon = input<IconDefinition>();
  primaryBtnTitle = input<string>();
  primaryBtnHref = input<string>();
  primaryBtnPermissionId = input<number[]>([]);
  primaryBtnDisabled = input<boolean>(false);
  ShowPrimaryBtnTitleMobile = input<boolean>(false);
  onPrimaryBtnClick = output();

  secondaryBtnTitle = input<string>();
  secondaryBtnHref = input<string>();
  secondaryBtnDisabled = input<boolean>(false);
  secondaryBtnPermissionId = input<number[]>([]);
  onSecondaryBtnClick = output();

  filterControls =
    input<Array<IControl & { initVal?: string | number | null }>>();
  modifiedFilterControls = computed<Array<IControl> | undefined>(() => {
    return this.filterControls()?.map((c) => {
      return {
        ...c,
        searchableSelectObject: {
          ...(c.searchableSelectObject ?? {}),
          condensed: true,
          fill: 'outline',
          allowEmptySelection: this.allowEmptySelectionFilter(),
          showClearBtn: this.showDropdownClearBtn(),
        },
        readonly: this.readonlyFilters(),
      };
    });
  });
  showDropdownClearBtn = input<boolean>(true);
  allowEmptySelectionFilter = input<boolean>(false);
  showPrimaryBtnInFilterRow = input<boolean>(false);
  showDateFilter = input<boolean>(false);
  selectedDate = input<Date | null>();
  disableFutureDates = input<boolean>(false);
  maxDate = computed<TuiDay | null>(() =>
    this.disableFutureDates() ? TuiDay.currentLocal() : null,
  );
  onDateFilterChange = output<Date | null>();
  dateControl = new FormControl<any>(null);
  dateInputControl = new FormControl<any>(null);
  filtersForm: FormGroup<any> | undefined;

  private readonly filtersValue = signal({});
  onFiltersChange = output<any>();
  onFormCreate = output<FormGroup>();
  filtersPermissionId = input<number[]>([]);

  readonlyFilters = input(false);

  loading = input<boolean>();

  constructor() {
    this.listenToDateControlValueChange();
    toObservable(this.selectedDate)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (selectedDate) => {
          if (selectedDate) {
            this.dateControl.setValue(selectedDate);
          }
        },
      });
  }

  ngOnInit(): void {
    if (this.filterControls()?.length) {
      const controls: {
        [key: string]: FormControl;
      } = {};
      this.filterControls()!.forEach((f) => {
        controls[f.formControlName!] = new FormControl(f.initVal);
      });
      this.filtersForm = new FormGroup(controls);
      this.onFormCreate.emit(this.filtersForm);

      this.filterControls()
        ?.filter((c) => !c.SchoolStructureListingType)
        .forEach((c) => {
          this.filtersForm?.controls[c.formControlName!].valueChanges.subscribe(
            (v) => {
              this.filtersValue.update((oldValue) => {
                const newFilter: { [key: string]: any } = {
                  ...oldValue,
                };
                newFilter[c.formControlName!] = v;
                const cleanedFilter = Object.fromEntries(
                  Object.entries(newFilter).filter(
                    ([_key, value]) =>
                      value != undefined && value != null && value !== '',
                  ),
                );
                return cleanedFilter;
              });
              this.onFiltersChange.emit(this.filtersValue());
            },
          );
        });

      if (
        this.filterControls()?.some((c) => c.SchoolStructureListingType) &&
        this.schoolStructureListingService
      ) {
        runInInjectionContext(this.environmentInjector, () => {
          toObservable(
            this.schoolStructureListingService!.selectedSchoolStructureModelId,
          )
            .pipe(skip(1), takeUntilDestroyed(this.destroyRef))
            .subscribe((v) => {
              this.filtersValue.update((oldValue) => {
                const newFilter: { [key: string]: any } = {
                  ...oldValue,
                  ...v,
                };
                const cleanedFilter = Object.fromEntries(
                  Object.entries(newFilter).filter(
                    ([_key, value]) =>
                      value != undefined && value != null && value !== '',
                  ),
                );
                return cleanedFilter;
              });
              this.onFiltersChange.emit(this.filtersValue());
            });
        });
      }
    }
  }

  private listenToDateControlValueChange() {
    this.dateControl.valueChanges
      .pipe(takeUntilDestroyed(), distinctUntilChanged())
      .subscribe((value) => {
        if (value) {
          const formattedDate = formatToHesDate(value, this.platform.isRTL);
          this.dateInputControl.setValue(formattedDate);
          this.onDateFilterChange.emit(value);
        } else {
          this.dateInputControl.setValue(null);
          this.onDateFilterChange.emit(null);
        }
      });
  }

  @HostBinding('class')
  get elementClasses() {
    return 'w-full flex flex-wrap';
  }
}
