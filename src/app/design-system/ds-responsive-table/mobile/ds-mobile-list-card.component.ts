import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  TemplateRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DsCheckboxComponent } from '@ds/checkbox/checkbox.component';
import { DsChipComponent } from '@ds/chip/chip.component';
import { DsResponsiveMenuComponent } from '@ds/popup/responsive-menu/responsive-menu.component';
import { PopupItem } from '@ds/popup/types/popup.interface';
import {
  DsResponsiveColumn,
  DsRowAction,
  DsBadgeVariant,
  DsMobileItemContext,
  DsMobileFooterContext,
  getTitleColumn,
  getSubtitleColumn,
  getBadgeColumns,
  getMetadataColumns,
  formatColumnValue,
  resolveBadgeVariant,
} from '../ds-responsive-table.model';

/**
 * Badge style mapping to Tailwind classes
 */
const BADGE_VARIANT_CLASSES: Record<DsBadgeVariant, string> = {
  default: 'bg-surface-pastel-background-redRich',
  success: 'bg-surface-pastel-background-green',
  warning: 'bg-surface-pastel-background-yellow',
  danger: 'bg-pastels-errorRed-200',
  info: 'bg-surface-pastel-background-blueRich',
  neutral: 'bg-surface-secondary',
};

@Component({
  selector: 'ds-mobile-list-card',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DsCheckboxComponent,
    DsChipComponent,
    DsResponsiveMenuComponent,
  ],
  template: `
    <div class="flex w-full items-stretch gap-ds-xl">
      <!-- Selection checkbox - 40x40 tappable area, vertically centered to card -->
      @if (showSelection()) {
        <div class="flex shrink-0 items-center self-center">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-full active:bg-neutral-cool-100"
          >
            <app-ds-checkbox
              size="sm"
              [ngModel]="selected()"
              [disabled]="selectionDisabled()"
              (ngModelChange)="onSelectionToggle($event)"
            />
          </div>
        </div>
      }

      <!-- Card content - no visual change on selection -->
      <div
        class="flex min-w-0 flex-1 flex-col gap-ds-xl rounded-2xl border-2 border-stroke-mid bg-surface-primary p-ds-xl"
      >
        @if (itemTemplate(); as template) {
          <!-- Custom template -->
          <ng-container *ngTemplateOutlet="template; context: itemContext()" />
        } @else {
          <!-- Default card layout -->
          <div class="flex flex-col gap-ds-md">
            <div class="flex items-center justify-between gap-ds-md">
              <div class="flex min-w-0 flex-1 flex-col gap-ds-xs">
                @if (computedTitle(); as title) {
                  <span class="content-lg-high-emphasis truncate">
                    {{ title }}
                  </span>
                }
                @if (computedSubtitle(); as subtitle) {
                  @if (subtitleBadgeClass()) {
                    <app-ds-chip
                      [text]="subtitle"
                      [customClasses]="
                        subtitleBadgeClass()! +
                        ' border-black-8 text-emphasis-high'
                      "
                    />
                  } @else {
                    <span class="text-ds-sm font-semibold text-emphasis-mid">
                      {{ subtitle }}
                    </span>
                  }
                }
              </div>

              <!-- Actions menu -->
              @if (menuActions().length > 0) {
                <ds-responsive-menu
                  [items]="menuActions()"
                  [triggerAriaLabel]="'Actions'"
                  (itemSelected)="onActionSelect($event)"
                />
              }
            </div>

            <!-- Badges -->
            @if (computedBadges().length > 0) {
              <div class="flex flex-wrap gap-ds-md">
                @for (badge of computedBadges(); track badge.label) {
                  <app-ds-chip
                    [text]="badge.label"
                    [customClasses]="
                      badge.class + ' border-black-8 text-emphasis-high'
                    "
                  />
                }
              </div>
            }
          </div>

          <!-- Metadata section -->
          @if (visibleMetadata().length > 0) {
            <div
              class="flex flex-col gap-ds-lg rounded-ds-lg px-ds-xl py-ds-md"
              [ngClass]="
                showMetadataBackground()
                  ? 'bg-surface-pastel-background-blue'
                  : ''
              "
            >
              @for (item of visibleMetadata(); track item.field) {
                <div class="flex items-center justify-between gap-ds-md">
                  <span class="single-line-sm-low-emphasis text-emphasis-mid">
                    {{ item.label }}
                  </span>
                  <span
                    class="content-md-high-emphasis text-right text-emphasis-high"
                  >
                    {{ item.value }}
                  </span>
                </div>
              }
            </div>
          }

          <!-- Footer template -->
          @if (footerTemplate(); as footer) {
            <div class="pt-ds-md">
              <ng-container
                *ngTemplateOutlet="footer; context: footerContext()"
              />
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DsMobileListCardComponent<T = Record<string, unknown>> {
  /** The row data */
  readonly data = input.required<T>();

  /** Column definitions */
  readonly columns = input.required<DsResponsiveColumn<T>[]>();

  /** Row actions */
  readonly actions = input<DsRowAction<T>[]>([]);

  /** Whether this row is selected */
  readonly selected = input<boolean>(false);

  /** Row index */
  readonly index = input<number>(0);

  /** Whether to show selection checkbox */
  readonly showSelection = input<boolean>(false);

  /** Whether the row selection checkbox is disabled (row is not selectable) */
  readonly selectionDisabled = input<boolean>(false);

  /** Whether to show metadata background */
  readonly showMetadataBackground = input<boolean>(true);

  /** Custom item template */
  readonly itemTemplate = input<TemplateRef<DsMobileItemContext<T>> | null>(
    null,
  );

  /** Custom footer template */
  readonly footerTemplate = input<TemplateRef<DsMobileFooterContext<T>> | null>(
    null,
  );

  /** Selection change event */
  readonly selectionChange = output<boolean>();

  /** Action click event */
  readonly actionClick = output<DsRowAction<T>>();

  /** Computed title from columns */
  protected readonly computedTitle = computed(() => {
    const titleCol = getTitleColumn(this.columns());
    if (!titleCol) return '';
    return formatColumnValue(titleCol, this.data(), true);
  });

  /** Computed subtitle from columns */
  protected readonly computedSubtitle = computed(() => {
    const subtitleCol = getSubtitleColumn(this.columns());
    if (!subtitleCol) return '';
    return formatColumnValue(subtitleCol, this.data(), true);
  });

  /** Computed badge class for subtitle (null = plain text) */
  protected readonly subtitleBadgeClass = computed<string | null>(() => {
    const subtitleCol = getSubtitleColumn(this.columns());
    const config = subtitleCol?.mobile?.subtitleAsBadge;
    if (!config) return null;
    const variant: DsBadgeVariant =
      typeof config === 'string' ? config : 'info';
    return BADGE_VARIANT_CLASSES[variant] ?? BADGE_VARIANT_CLASSES['info'];
  });

  /** Computed badges from columns */
  protected readonly computedBadges = computed(() => {
    const badgeCols = getBadgeColumns(this.columns());
    return badgeCols
      .map((col) => {
        const label = formatColumnValue(col, this.data(), true);
        const variant = resolveBadgeVariant(col, this.data());
        return {
          label,
          variant,
          class: BADGE_VARIANT_CLASSES[variant],
        };
      })
      .filter((b) => b.label);
  });

  /** Visible metadata items - always show all */
  protected readonly visibleMetadata = computed(() => {
    const metaCols = getMetadataColumns(this.columns());
    return metaCols
      .map((col) => ({
        field: col.field,
        label: col.headerName ?? col.field,
        value: formatColumnValue(col, this.data(), true),
      }))
      .filter((m) => m.value);
  });

  /** Convert row actions to menu items */
  protected readonly menuActions = computed<PopupItem[]>(() => {
    const row = this.data();
    return this.actions()
      .filter((action) => {
        if (typeof action.visible === 'function') {
          return action.visible(row);
        }
        return action.visible !== false;
      })
      .map((action) => ({
        id: action.id,
        title: action.label,
        icon: action.icon,
        disabled:
          typeof action.disabled === 'function'
            ? action.disabled(row)
            : action.disabled,
        selectable: false,
      }));
  });

  /** Context for custom item template */
  protected readonly itemContext = computed<DsMobileItemContext<T>>(() => ({
    $implicit: this.data(),
    data: this.data(),
    title: this.computedTitle(),
    subtitle: this.computedSubtitle(),
    badges: this.computedBadges().map((b) => ({
      label: b.label,
      variant: b.variant,
    })),
    metadata: this.visibleMetadata(),
    selected: this.selected(),
    index: this.index(),
  }));

  /** Context for footer template */
  protected readonly footerContext = computed<DsMobileFooterContext<T>>(() => ({
    $implicit: this.data(),
    data: this.data(),
    actions: this.actions(),
  }));

  protected onSelectionToggle(selected: boolean): void {
    if (this.selectionDisabled()) return;
    this.selectionChange.emit(selected);
  }

  protected onActionSelect(item: PopupItem): void {
    const action = this.actions().find((a) => a.id === item.id);
    if (action) {
      this.actionClick.emit(action);
      action.action?.(this.data());
    }
  }
}
