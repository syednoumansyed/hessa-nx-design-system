import {
  Component,
  effect,
  inject,
  AfterViewInit,
  OnDestroy,
  OnInit,
  output,
  viewChild,
  signal,
  input,
} from '@angular/core';
import { DsIconComponent } from '@ds/icon/icon.component';
import { DsInputComponent } from '@ds/input/input.component';
import { faSearch } from '@fortawesome/pro-light-svg-icons';
import { faAdd } from '@fortawesome/pro-regular-svg-icons';
import { faCircleX } from '@fortawesome/pro-solid-svg-icons';
import { TranslocoDirective } from '@jsverse/transloco';
import { LayoutService } from '@layout/layout.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

/**
 * @ai-hint
 * component: SearchBoxComponent
 * selector: app-search-box
 * intent: Debounced search input with optional add-button and cancel-button; hides the app bottom navigation bar while focused to maximize screen space on mobile
 * do: Listen to searchChange output for debounced (300ms) search queries; use value input to set an initial or externally controlled search string; set autoFocus=true with an autoFocusDelay of 300–400ms when used inside modals to avoid layout shift; use includeAddButton when the search bar also serves as a creation trigger
 * dont: Don't use for form submission (use DsInputComponent with a submit button instead); don't set manageBottomBarVisibility=false unless the host page intentionally keeps the bottom bar visible during search
 * device: Hides the bottom navigation bar on focus via LayoutService.updateBottomBarVisibility — critical mobile behavior; autoFocus skips iOS focus to avoid scroll-jump (delegated to DsInputComponent)
 * student-theme: NO — no student: Tailwind variants detected in this component
 * rtl: Inherits direction from host; search and clear icons are placed via DsInputComponent logical slots
 * alternatives: DsInputComponent with iconStart for a lightweight non-debounced search field; DsSelectComponent with showSearch for in-dropdown filtering
 */
@Component({
  selector: 'app-search-box',
  templateUrl: './search-box.component.html',
  standalone: true,
  imports: [DsIconComponent, DsInputComponent, TranslocoDirective],
})
export class SearchBoxComponent implements OnInit, OnDestroy, AfterViewInit {
  searchInputRef = viewChild<DsInputComponent>('searchInputRef');

  private readonly layoutService = inject(LayoutService);

  faAdd = faAdd;
  faSearch = faSearch;
  faClose = faCircleX;

  searchValue = signal<string>('');
  value = input<string>('');
  includeAddButton = input<boolean>(false);
  includeCancelButton = input<boolean>(false);
  placeholderTxt = input<string>('');
  manageBottomBarVisibility = input<boolean>(true);
  autoFocus = input<boolean>(false);
  /** Delay in ms before autofocus triggers. Increase for use inside modals (300-400ms). */
  autoFocusDelay = input<number>(0);
  searchChange = output<string>();
  addButtonClick = output<void>();
  cancelButtonClick = output<void>();

  private readonly searchInput$ = new Subject<string>();
  private readonly destroy$ = new Subject<void>();
  private readonly syncValueEffect = effect(() => {
    const nextValue = this.value() ?? '';
    if (nextValue === this.searchValue()) {
      return;
    }
    this.searchValue.set(nextValue);
  });

  ngOnInit() {
    this.searchInput$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((value) => this.searchChange.emit(value));
  }

  ngAfterViewInit(): void {
    if (!this.autoFocus()) {
      return;
    }
    setTimeout(() => this.searchInputRef()?.focus(), this.autoFocusDelay());
  }

  onSearchInput(value: string) {
    this.searchValue.set(value ?? '');
    this.searchInput$.next(this.searchValue());
  }

  clearSearch() {
    if (!this.searchValue()) return;
    this.searchValue.set('');
    this.searchInput$.next('');
    queueMicrotask(() => this.searchInputRef()?.focus());
  }

  onInputFocus() {
    if (!this.manageBottomBarVisibility()) {
      return;
    }
    this.layoutService.updateBottomBarVisibility(false);
  }

  onInputBlur() {
    if (!this.manageBottomBarVisibility()) {
      return;
    }
    this.layoutService.updateBottomBarVisibility(true);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onAddButtonClick() {
    this.addButtonClick.emit();
  }

  onCancelButtonClick() {
    this.cancelButtonClick.emit();
  }
}
