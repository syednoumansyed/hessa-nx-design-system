import { CommonModule } from '@angular/common';
import { Component, input, computed } from '@angular/core';
import { DsChipComponent } from '@ds/chip/chip.component';
import { DsTranslatePipe } from '@ds/i18n/ds-translate.pipe';
import { DsIcon, DsIconComponent } from '@ds/icon/icon.component';
import { DsMenuComponent } from '@ds/popup/ds-menu.component';
import { PopupItem } from '@ds/popup/types/popup.interface';

export interface DsIconContainerConfig {
  icon: DsIcon;
  iconColorClass?: string;
  chip?: {
    text?: string;
    variant?: string;
    customClasses?: string;
    startIcon?: string;
    removable?: boolean;
  };
  menu?: {
    items?: PopupItem[];
    position?: 'top' | 'bottom' | 'left' | 'right';
  };
  label?: string;
  hasIndicator?: boolean;
  isGrayed?: boolean;
}

/**
 * Helper function to create icon container configuration with type safety
 */
export function createIconContainerConfig(
  config: DsIconContainerConfig,
): DsIconContainerConfig {
  return config;
}

/**
 * @ai-hint
 * component: DsIconContainerComponent
 * selector: ds-icon-container
 * intent: Composite display unit that wraps an icon with optional chip badge, context menu, label, and notification indicator dot; used in list rows, cards, and data tables to represent entities with status
 * do: Use the createIconContainerConfig() helper for type-safe config construction; set hasIndicator=true for notification dot (mutually exclusive with menu — menu is hidden when indicator is shown); set isGrayed=true to render the icon in a low-emphasis color for disabled/inactive states
 * dont: Don't pass both menu.items and hasIndicator=true — the menu will not render; don't use this for interactive icon buttons (use DsButtonComponent with an icon variant instead)
 * device: No structural device differences
 * student-theme: NO — no student: Tailwind variants detected in this component
 * rtl: Label and chip layout inherit host direction; menu position prop allows top/bottom/left/right placement independently of RTL
 * alternatives: AvatarComponent for user profile representations; DsButtonComponent ghost variant for interactive icon actions
 */
@Component({
  selector: 'ds-icon-container',
  templateUrl: './icon-container.component.html',
  standalone: true,
  imports: [
    DsMenuComponent,
    DsChipComponent,
    DsIconComponent,
    CommonModule,
    DsTranslatePipe,
  ],
})
export class DsIconContainerComponent {
  config = input.required<DsIconContainerConfig>();

  // Computed properties for cleaner template
  hasChip = computed(() => !!this.config().chip?.text);
  hasMenu = computed(() => {
    const menu = this.config().menu;
    return menu?.items && menu.items.length > 0 && !this.config().hasIndicator;
  });
  hasIndicator = computed(() => !!this.config().hasIndicator);
  hasLabel = computed(() => !!this.config().label);
  isGrayed = computed(() => !!this.config().isGrayed);

  // Computed icon color class that handles grayed state
  iconColorClass = computed(() => {
    if (this.isGrayed()) {
      return 'text-icon-low'; // Grayed out color
    }
    return this.config().iconColorClass || '';
  });

  // Computed chip configuration with defaults
  chipConfig = computed(() => {
    const chip = this.config().chip;
    if (!chip?.text) return null;

    return {
      text: chip.text,
      variant: chip.variant || 'primary',
      customClasses: chip.customClasses || '',
      startIcon: chip.startIcon || null,
      removable: chip.removable || false,
    };
  });
}
