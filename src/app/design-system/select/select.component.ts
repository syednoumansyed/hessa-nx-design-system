import {
  Component,
  computed,
  DestroyRef,
  effect,
  forwardRef,
  inject,
  input,
  OnChanges,
  OnInit,
  output,
  signal,
  SimpleChanges,
  untracked,
  viewChild,
} from '@angular/core';
import { DsInputComponent } from '../input/input.component';
import {
  faAngleDown,
  faAngleUp,
  faMagnifyingGlass,
} from '@fortawesome/pro-regular-svg-icons';
import { isMobile } from '@shared/utils/platform';
import { IonModal, IonSpinner } from '@ionic/angular/standalone';
import { DsSelectConfig } from './select.interface';
import { NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { ObjId } from '@shared/interfaces/common.interface';
import { DsChipComponent } from '../chip/chip.component';
import { Overlay, OverlayModule } from '@angular/cdk/overlay';
import { DsSelectItemComponent } from './select-item/select-item.component';
import { debounceTime, distinctUntilChanged, skip } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { InfiniteScrollDirective } from 'ngx-infinite-scroll';
import { NgTemplateOutlet } from '@angular/common';
import { DsSelectContextService } from './select-context.service';
import { DsTranslatePipe } from '../i18n/ds-translate.pipe';

/**
 * @ai-hint
 * component: DsSelectComponent
 * selector: app-ds-select
 * intent: Dropdown/modal select control supporting single and multi-select, search, infinite scroll, and lazy-loaded options
 * do: Pass config.required for validation; use config.loadOptions + config.paginated for server-side lists; use config.isMultiple for multi-select with chip display
 * dont: Don't mutate the config.options array directly — pass a new reference; don't open the overlay programmatically without checking effectiveDisabled first
 * device: On mobile (isMobile), the dropdown renders inside an IonModal sheet instead of a CDK overlay panel
 * student-theme: NO — no student: Tailwind variants detected in this component
 * rtl: Inherits host direction; CDK overlay repositions automatically; search icon placement follows logical CSS
 * alternatives: DsPickerSelectComponent for wheel-picker style; DsChipSelectorComponent for tag-style multi-select
 */
@Component({
  selector: 'app-ds-select',
  templateUrl: './select.component.html',
  standalone: true,
  imports: [
    IonModal,
    DsInputComponent,
    DsChipComponent,
    OverlayModule,
    DsSelectItemComponent,
    ReactiveFormsModule,
    InfiniteScrollDirective,
    IonSpinner,
    NgTemplateOutlet,
    DsTranslatePipe,
  ],
  providers: [
    DsSelectContextService,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DsSelectComponent),
      multi: true,
    },
  ],
})
export class DsSelectComponent implements OnInit, OnChanges {
  //#region Inputs
  readonly config = input.required<DsSelectConfig>();
  // New: disabled input to make the select read-only/display-only
  readonly disabled = input<boolean>(false);
  //#endregion

  //#region Protected Properties
  protected readonly arrowDown = faAngleDown;
  protected readonly arrowup = faAngleUp;
  protected readonly isMobile = isMobile();
  protected readonly isOpen = signal(false);
  protected readonly searchInputRef = viewChild(DsInputComponent);
  protected readonly scrollStrategy =
    inject(Overlay).scrollStrategies.reposition();
  protected readonly searchIcon = faMagnifyingGlass;
  protected readonly contextService = inject(DsSelectContextService);
  //#endregion

  //#region Computed Properties
  protected readonly selectedItems = computed(() =>
    this.contextService.selectedItems(),
  );
  // Show selected label inside input for single-select mode
  protected readonly selectedLabel = computed(() => {
    if (this.isMultiple()) return '';
    const first = this.selectedItems()[0];
    return first ? (first.display ?? '') : '';
  });
  readonly label = computed(() => this.config().label);
  readonly placeholder = computed(() => this.config().placeholder);
  readonly required = computed(() => this.config().required ?? false);
  protected readonly showSearch = computed(
    () => (this.config().showSearch ?? true) && !this.effectiveDisabled(),
  );
  protected readonly isMultiple = computed(
    () => this.config().isMultiple ?? false,
  );
  protected readonly showChips = computed(() => this.config().chips ?? true);
  // Effective disabled combines direct input and config-level disabled
  protected readonly effectiveDisabled = computed(
    () =>
      (this.config().disabled as boolean | undefined) === true ||
      this.disabled(),
  );
  protected readonly noItemFoundText = computed(
    () => this.config().noItemFoundText ?? 'No items found',
  );
  protected readonly showSelectAll = computed(() =>
    this.contextService.showSelectAll(),
  );
  protected readonly isAllSelected = computed(() =>
    this.contextService.isAllSelected(),
  );
  protected readonly isLoadOptions = computed(
    () => !!this.config().loadOptions,
  );
  protected readonly isPaginated = computed(() =>
    this.contextService.isPaginated(),
  );
  protected readonly isInitialLoad = computed(() =>
    this.contextService.isInitialLoad(),
  );
  protected readonly isLoading = computed(() =>
    this.contextService.isLoading(),
  );
  protected readonly isNoItemFoundText = computed(
    () => this.options().length === 0 && !this.isLoading(),
  );
  protected readonly overlayHeight = computed<number | string>(() => {
    if (this.isLoading()) return 315;
    if (this.isNoItemFoundText()) return 40;
    return '';
  });
  protected readonly isLoadOptionsWithoutPagination = computed(() =>
    this.contextService.isLoadOptionsWithoutPagination(),
  );
  protected readonly searchCtrl = this.contextService.searchCtrl;
  protected displayedItems = computed(() => {
    const items = this.selectedItems();
    return items.slice(0, items.length > 3 ? 2 : 3);
  });
  protected remainingCount = computed(() => {
    const total = this.selectedItems().length;
    const displayed = this.displayedItems().length;
    return total > displayed ? total - displayed : 0;
  });
  options = computed(() => this.contextService.searchResult());
  //#endregion

  //#region Outputs
  readonly closed = output<void>();
  readonly chipRemoved = output<void>();
  //#endregion

  //#region Reactive Forms Properties
  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};
  isDisabled = false;
  //#endregion

  //#region Lifecycle Methods
  constructor() {
    // Watch config signal changes — needed because ngOnChanges doesn't fire
    // for signal inputs. Only update when options array length changes to avoid
    // resetting selection on every CD cycle.
    let lastOptionsLength = -1;
    effect(() => {
      const cfg = this.config();
      const optionsLength = cfg.options?.length ?? 0;
      if (optionsLength !== lastOptionsLength) {
        lastOptionsLength = optionsLength;
        untracked(() => {
          this.contextService.setConfig(cfg);
          this.contextService.selectItemsFromValue();
        });
      }
    });
  }
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit() {
    this.contextService.setConfig(this.config());
    this.contextService.selectItemsFromValue();
    this.contextService.valueChange$
      .pipe(skip(1), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        if (!this.isMultiple()) {
          this.isOpen.set(false);
        }
        if (this.showSearch() && !this.isMobile) {
          setTimeout(() => this.searchInputRef()?.focus(), 100);
        }
        this.onChange(this.contextService.getValue()); // Excludes disabled options
      });

    if (this.showSearch()) {
      this.searchCtrl.valueChanges
        .pipe(
          debounceTime(300),
          distinctUntilChanged(),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe(() => {
          if (this.isLoadOptions() && this.isPaginated()) {
            this.contextService.resetPagination();
            this.contextService.loadOptions();
          }
        });
    }

    if (this.isLoadOptionsWithoutPagination()) {
      this.contextService.resetPagination();
      this.contextService.loadOptions();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['config'] && !changes['config'].firstChange) {
      this.contextService.setConfig(this.config());
      this.contextService.selectItemsFromValue();
    }
  }
  //#endregion

  //#region Methods
  async openOverlay(ev?: Event) {
    if (this.effectiveDisabled()) return; // prevent opening when disabled
    if (this.isOpen()) return;

    if (this.isLoadOptions()) {
      this.contextService.resetPagination();
      this.contextService.loadOptions();
    }

    setTimeout(() => {
      this.isOpen.set(true);
    }, 100);
  }

  writeValue(value: any): void {
    this.contextService.setValue(value);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  isOptionDisabled(id: ObjId): boolean {
    return (this.contextService.options() ?? []).some(
      (o) => o.id === id && o.disabled,
    );
  }

  onRemoveByValue(value: ObjId) {
    this.contextService.removeByValue(value);
    this.onChange(this.contextService.getValue());
    this.chipRemoved.emit();
  }

  onScroll() {
    if (this.isLoadOptions()) {
      this.contextService.loadOptions();
    }
  }

  closeOverlay() {
    this.isOpen.set(false);
    this.closed.emit();
  }

  toggleSelectAll() {
    if (this.isAllSelected()) {
      this.contextService.deselectAll();
    } else {
      this.contextService.selectAll();
    }
    this.onChange(this.contextService.getValue());
  }
  //#endregion
}
