import {
  booleanAttribute,
  Component,
  computed,
  input,
  OnInit,
  output,
} from '@angular/core';
import { DsIcon, DsIconComponent } from '../icon/icon.component';
import {
  faCartCircleXmark,
  faCircleXmark,
} from '@fortawesome/pro-solid-svg-icons';
import { NgClass } from '@angular/common';

type ChipVariantBasicType = 'default' | 'primary' | 'none';
type ChipVariant = ChipVariantBasicType | Exclude<string, ChipVariantBasicType>;

type ChipDisplayType = 'pill' | 'card';
/**
 * @ai-hint
 * component: DsChipComponent
 * selector: app-ds-chip
 * intent: Compact label/tag element used for selected values, filter tokens, and status badges; supports pill and card display shapes
 * do: Use variant="primary" for active/selected state; use removable=true + remove output to allow users to deselect; use static=true when the chip is display-only and should not show hover effects
 * dont: Don't use chips as primary navigation — use DsTabsComponent; don't place chips inside button elements
 * device: Hover effects are scoped to md: breakpoint (desktop), so mobile never shows hover state
 * student-theme: NO — no student: Tailwind variants detected in this component
 * rtl: Icon and text order inherits host direction; no explicit RTL overrides needed
 * alternatives: DsButtonComponent for clickable actions; DsTabsComponent for navigation; DsSelectComponent shows chips for multi-select selections
 */
@Component({
  selector: 'app-ds-chip',
  templateUrl: './chip.component.html',
  standalone: true,
  imports: [DsIconComponent, NgClass],
})
export class DsChipComponent implements OnInit {
  // inputs
  displayType = input<ChipDisplayType>('pill');
  variant = input<ChipVariant | undefined>();
  customClasses = input<string>('default');
  text = input<string>('');
  startIcon = input<DsIcon | null>(null);
  startIconSize = input<string>('sm');
  startIconColorClass = input<string>(''); // Added for icon color
  removable = input<boolean>(false);
  static = input<boolean>(false); // When true, chip is view-only without hover effects

  // outputs
  remove = output<void>();

  protected readonly closeIcon = faCircleXmark;

  // Computed icon size based on display type
  computedIconSize = computed(() => {
    const displayType = this.displayType();
    const customSize = this.startIconSize();

    // If custom size is provided and differs from default, use it
    if (customSize !== 'sm') {
      return customSize;
    }

    // Otherwise, use display type defaults
    return displayType === 'card' ? 'lg' : 'sm';
  });

  chipClasses = computed(() => {
    const variant = this.variant();
    const customClasses = this.customClasses();
    const isStatic = this.static();
    const displayType = this.displayType();

    let variantClasses = '';
    let displayTypeClasses = '';

    // Variant classes (colors)
    switch (variant) {
      case 'primary':
        variantClasses = isStatic
          ? 'bg-brand-100 border-brand-500'
          : 'bg-brand-100 border-brand-500 md:hover:border-brand-500 md:hover:bg-brand-200';
        break;

      case 'default':
        variantClasses = isStatic
          ? 'border-[var(--colors-neutral-cool-black-08)] bg-surface-primary'
          : 'border-[var(--colors-neutral-cool-black-08)] md:hover:border-neutral-cool-300 md:hover:bg-neutral-cool-50 bg-surface-primary';
        break;
    }

    // Display type classes (shape/spacing)
    switch (displayType) {
      case 'card':
        displayTypeClasses = 'rounded-ds-md p-ds-md';
        break;
      case 'pill':
      default:
        displayTypeClasses = 'rounded-ds-full px-ds-sm py-ds-sm';
        break;
    }

    // Combine all classes
    return [variantClasses, displayTypeClasses, customClasses]
      .filter(Boolean)
      .join(' ');
  });

  constructor() {}

  ngOnInit() {}
}
