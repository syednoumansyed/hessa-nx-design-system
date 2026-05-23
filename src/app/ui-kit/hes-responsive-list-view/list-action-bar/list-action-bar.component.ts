import {
  Component,
  computed,
  inject,
  Injector,
  input,
  signal,
  ViewEncapsulation,
  TemplateRef,
} from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  faCheck,
  faPlus,
  faSearch,
  IconDefinition,
} from '@fortawesome/pro-regular-svg-icons';
import { isMobile } from '@shared/utils/platform';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { ITableCol, UnknownObject } from '../../hes-table/model';
import {
  TUI_TEXTFIELD_APPEARANCE_DIRECTIVE,
  TuiDialogService,
  TuiTextfieldControllerModule,
} from '@taiga-ui/core';
import { PolymorpheusComponent } from '@tinkoff/ng-polymorpheus';
import { ListViewContextService } from '../list-view-context.service';
import { CommonModule } from '@angular/common';
import {
  TUI_DATE_RANGE_VALUE_TRANSFORMER,
  TUI_DATE_VALUE_TRANSFORMER,
  TuiInputDateModule,
  TuiInputDateRangeModule,
} from '@taiga-ui/kit';
import { TUI_DATE_SEPARATOR } from '@taiga-ui/cdk';
import {
  ExampleDateTransformer,
  getExampleDateRangeTransformer,
} from '@shared/components/form-control-generator/date-range-value-transformer';
import { TuiMobileCalendarDialogModule } from '@taiga-ui/addon-mobile';
import { faCopy, faSliders } from '@fortawesome/pro-light-svg-icons';
import { InlineFilterConfig } from '../list-view-container/list-view-container.component';
import { FilterModalComponent } from '../filter-modal/filter-modal.component';
import { TranslocoDirective } from '@jsverse/transloco';
import { createCopyToClipboard } from '../utils/copy-to-clipboard.utils';
import { IListViewPrimaryAction } from '../list-view.interface';
import { HesActionSheetComponent } from '../../hes-action-sheet/hes-action-sheet.component';
import { DatePickerAutoOpenDirective } from '@shared/directives/date-picker-auto-open.directive';

@Component({
  selector: 'app-list-action-bar',
  templateUrl: './list-action-bar.component.html',
  styleUrls: ['./list-action-bar.component.scss'],
  standalone: true,
  imports: [
    HesButtonModule,
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    TuiInputDateModule,
    TuiMobileCalendarDialogModule,
    TuiTextfieldControllerModule,
    TuiInputDateRangeModule,
    TranslocoDirective,
    HesActionSheetComponent,
    CommonModule,
    DatePickerAutoOpenDirective,
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
    {
      provide: TUI_DATE_RANGE_VALUE_TRANSFORMER,
      deps: [TUI_DATE_VALUE_TRANSFORMER],
      useFactory: getExampleDateRangeTransformer,
    },
  ],
  encapsulation: ViewEncapsulation.None,
})
export class ListActionBarComponent {
  // #region input and output
  title = input<string | undefined>();
  countTitle = input<string | undefined>();
  countValue = input<number | undefined>();
  columns = input<ITableCol[]>([]);
  rowData = input<UnknownObject[]>([]);
  loading = input<boolean>();
  isFilterShow = input<boolean>();
  primaryActions = input<IListViewPrimaryAction[]>();
  showSearchInput = input<boolean>();
  inlineFilterConfig = input<InlineFilterConfig | null>(null);
  searchTextControl = input.required<FormControl>();
  dateRageControl = input.required<FormControl>();
  dateControl = input.required<FormControl>();
  canCopy = input<boolean>(false);
  pageTitleTemplate = input<TemplateRef<any>>();

  // #endregion

  // #region injector
  private readonly dialogs = inject(TuiDialogService);
  private readonly injector = inject(Injector);
  private readonly listViewContextService = inject(ListViewContextService);
  private readonly copyToClipboard = createCopyToClipboard();
  // #endregion

  // #region protacted properties
  protected readonly faPlus = faPlus;
  protected readonly searchIcon = faSearch;
  protected readonly filterIcon = faSliders;
  protected readonly iconPrefix: IconDefinition = faSearch;
  protected readonly isMobile = isMobile();
  protected readonly copyIcon = faCopy;
  protected readonly checkIcon = faCheck;
  protected readonly isCopy = signal<boolean>(false);
  protected readonly isVisiblePrimaryActions = computed(() => {
    const actions = this.primaryActions();
    if (!actions || actions.length === 0) return false;
    return actions.some((action) =>
      action.isVisible ? action.isVisible() : true,
    );
  });

  protected readonly visiblePrimaryActions = computed(() => {
    const actions =
      this.primaryActions()?.filter((action) =>
        action?.isVisible ? action.isVisible() : true,
      ) || [];
    return this.isMobile ? actions.slice(0, 1) : actions.slice(0, 2);
  });

  protected readonly hiddenPrimaryActions = computed(() => {
    const actions =
      this.primaryActions()?.filter((action) =>
        action?.isVisible ? action.isVisible() : true,
      ) || [];
    return this.isMobile ? actions.slice(1) : actions.slice(2);
  });
  // #endregion

  // region private methods
  protected onFilterClick() {
    this.dialogs
      .open<Record<string, any>>(
        new PolymorpheusComponent(FilterModalComponent, this.injector),
        {
          dismissible: false,
          data: {
            tableConfig: this.columns(),
          },
        },
      )
      .subscribe((isApply) => {
        if (!!isApply) {
          this.listViewContextService.onApplyModalFilter();
        } else {
          this.listViewContextService.onCancelFilter();
        }
      });
  }

  protected onCopyToClipboard() {
    this.isCopy.set(true);
    setTimeout(() => {
      this.isCopy.set(false);
    }, 3000);
    this.copyToClipboard(this.rowData(), this.columns());
  }
  // #endregion
}
