import {
  Component,
  input,
  output,
  signal,
  computed,
  TemplateRef,
  ContentChild,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DsIconComponent } from '../icon/icon.component';
import { DsChipComponent } from '../chip/chip.component';
import { DsResponsiveMenuComponent } from '../popup/responsive-menu/responsive-menu.component';
import { PopupItem } from '../popup/types/popup.interface';
import { faChevronDown, faChevronUp } from '@fortawesome/pro-solid-svg-icons';
import {
  DsAccordionTag,
  DsAccordionIconPosition,
  DsAccordionMenuItem,
} from './accordion.types';

/**
 * @ai-hint
 * component: DsAccordionComponent
 * selector: ds-accordion
 * intent: Collapsible panel with a configurable header (title, subtitle, tags, menu) and an ng-content body; used for FAQ lists, grouped settings, and detail-disclosure patterns
 * do: Use expanded input for initial state only (it is one-time synced on first render); listen to expandedChange output for controlled expand/collapse; project action buttons via #accordionActions ng-template; use menuItems to add a context menu in the header
 * dont: Don't expect two-way binding on expanded — after init the component manages its own isExpanded signal; don't nest accordions more than two levels deep
 * device: No structural device differences
 * student-theme: NO — no student: Tailwind variants detected in this component
 * rtl: Header layout and chevron icon direction inherit host direction; no explicit RTL overrides
 * alternatives: DsExpandableComponent for simpler expand/collapse without header chrome; DsTabsComponent when sections are mutually exclusive
 */
@Component({
  selector: 'ds-accordion',
  standalone: true,
  imports: [
    CommonModule,
    DsIconComponent,
    DsChipComponent,
    DsResponsiveMenuComponent,
  ],
  templateUrl: './accordion.component.html',
  styleUrls: ['./accordion.component.scss'],
})
export class DsAccordionComponent {
  @ContentChild('accordionActions', { static: false })
  actionsTemplate?: TemplateRef<unknown>;

  // Header configuration
  readonly title = input<string>('');
  readonly subtitle = input<string>('');
  readonly tags = input<DsAccordionTag[]>([]);

  // Icon configuration
  readonly iconPosition = input<DsAccordionIconPosition>('start');
  readonly showIcon = input<boolean>(true);

  // Menu configuration
  readonly menuItems = input<DsAccordionMenuItem[]>([]);
  readonly showMenu = input<boolean>(true);

  // State
  readonly expanded = input<boolean>(false);
  readonly disabled = input<boolean>(false);

  // Custom styling
  readonly headerClass = input<string>('');
  readonly contentClass = input<string>('');
  readonly containerClass = input<string>('');

  // Events
  readonly expandedChange = output<boolean>();
  readonly menuItemSelected = output<PopupItem>();

  // Internal state
  readonly isExpanded = signal<boolean>(false);

  // Icons
  protected readonly chevronDownIcon = faChevronDown;
  protected readonly chevronUpIcon = faChevronUp;

  protected readonly currentIcon = computed(() =>
    this.isExpanded() ? this.chevronUpIcon : this.chevronDownIcon,
  );

  private isFirstChange = true;

  constructor() {
    // Only sync from input on initial load, not on every change
    effect(() => {
      const expandedValue = this.expanded();
      if (this.isFirstChange) {
        this.isExpanded.set(expandedValue);
        this.isFirstChange = false;
      }
    });
  }

  toggle() {
    if (this.disabled()) return;
    this.isExpanded.update((value) => !value);
    this.expandedChange.emit(this.isExpanded());
  }

  expand() {
    if (this.disabled()) return;
    this.isExpanded.set(true);
    this.expandedChange.emit(true);
  }

  collapse() {
    this.isExpanded.set(false);
    this.expandedChange.emit(false);
  }

  onMenuItemSelected(item: PopupItem) {
    this.menuItemSelected.emit(item);
  }
}
