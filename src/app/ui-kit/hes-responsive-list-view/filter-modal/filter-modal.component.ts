import {
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';
import { TuiDialogContext } from '@taiga-ui/core';
import { FilterControlComponent } from './filter-control/filter-control.component';
import { SchoolStructureListingService } from '@core/school-structure-listing.service';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { ListViewContextService } from '../list-view-context.service';
import { skip } from 'rxjs';
import { ColumnVisibilityControllerComponent } from './column-visibility-controller/column-visibility-controller.component';
import { ITableCol } from '@ui-kit/hes-table/model';

@Component({
  selector: 'app-filter-modal',
  templateUrl: './filter-modal.component.html',
  standalone: true,
  imports: [
    HesButtonModule,
    TranslocoDirective,
    ReactiveFormsModule,
    CommonModule,
    FilterControlComponent,
    ColumnVisibilityControllerComponent,
  ],
  providers: [SchoolStructureListingService],
})
export class FilterModalComponent implements OnInit {
  // #region injector
  private readonly schoolStructureListingService = inject(
    SchoolStructureListingService,
  );
  private readonly destroyRef$ = inject(DestroyRef);
  private readonly listViewContextService = inject(ListViewContextService);
  private readonly context =
    inject<TuiDialogContext<any, any>>(POLYMORPHEUS_CONTEXT);

  // #endregion

  // #region private properties

  private readonly selectedSchoolStructureModel$ = toObservable(
    this.schoolStructureListingService?.selectedSchoolStructureModel!,
  );
  private readonly tableConfig = signal<ITableCol[]>([]);
  protected readonly validFilterConfig = computed(() => {
    return this.tableConfig()
      .filter(
        (control) =>
          control.filter &&
          (control.filterType === 'select' ||
            control.filterType === 'date' ||
            control.filterType === 'chip-selector'),
      )
      .slice()
      .sort((a, b) => (a.filterOrder ?? 0) - (b.filterOrder ?? 0));
  });

  // #endregion

  // #region public methods
  ngOnInit() {
    this.tableConfig.set(this.context.data.tableConfig);
    this.initAllSchoolStructureFilter();
    this.listenToSchoolStructureFilterModelChange();
  }
  // #endregion

  // #region private methods

  protected onCloseModal() {
    this.context.completeWith(false);
  }

  protected applyFilters() {
    this.context.completeWith(true);
  }

  private initAllSchoolStructureFilter() {
    this.initSchoolStruchtureFilter('company');
    this.initSchoolStruchtureFilter('campus');
    this.initSchoolStruchtureFilter('school');
    this.initSchoolStruchtureFilter('level');
    this.initSchoolStruchtureFilter('class');
  }

  private initSchoolStruchtureFilter(
    schoolFilterKey: 'company' | 'campus' | 'school' | 'level' | 'class',
  ) {
    const schoolStructureColumn = this.validFilterConfig().find((column) => {
      return column.SchoolStructureListingType === schoolFilterKey;
    });
    if (schoolStructureColumn) {
      const { value } = this.listViewContextService.getModalFilterState(
        schoolStructureColumn?.field,
      ) ?? { value: null };

      switch (schoolStructureColumn.SchoolStructureListingType) {
        case 'company':
        case 'sub-company':
          this.schoolStructureListingService?.updateSelectedCompany(value);
          break;
        case 'campus':
          this.schoolStructureListingService?.updateSelectedCampus(value);
          break;
        case 'school':
          this.schoolStructureListingService?.updateSelectedSchool(value);
          break;
        case 'level':
          this.schoolStructureListingService?.updateSelectedLevel(value);
          break;
        case 'class':
          this.schoolStructureListingService?.updateSelectedClass(value);
          break;
        default:
          break;
      }
    }
  }

  private listenToSchoolStructureFilterModelChange() {
    this.selectedSchoolStructureModel$
      .pipe(takeUntilDestroyed(this.destroyRef$), skip(1))
      .subscribe((model) => {
        this.listViewContextService.applySchoolStructureFilters({
          model,
          columns: this.validFilterConfig(),
        });
      });
  }
  // #endregion
}
