/**
 * Utility for DS Icon Color Classes
 *
 * Maps design system icon names to their corresponding Tailwind color classes.
 * This provides a centralized way to manage icon colors across the application.
 *
 * Color definitions are maintained in tailwind.config.js under 'ds-icon' colors.
 */

export type DsIconName =
  | 'ds-exam'
  | 'ds-assignment'
  | 'ds-attachment'
  | 'ds-video'
  | 'ds-quiz'
  | 'ds-image'
  | string; // Allow other icon names

/**
 * Maps DS icon names to their color classes
 */
export const DS_ICON_COLOR_MAP: Record<string, string> = {
  'ds-exam': 'text-ds-icon-exam', // #B85BEA
  'ds-assignment': 'text-ds-icon-assignment', // #62BA0A
  'ds-attachment': 'text-ds-icon-attachment', // #EC6955
  'ds-video': 'text-ds-icon-video', // #7883EA
  'ds-quiz': 'text-ds-icon-quiz', // #E47097
  'ds-image': 'text-ds-icon-image', // #6CCBFA
} as const;

/**
 * Gets the Tailwind color class for a DS icon
 * @param iconName - The name of the DS icon
 * @returns The corresponding Tailwind color class or empty string if not found
 */
export function getDsIconColorClass(iconName: DsIconName): string {
  return DS_ICON_COLOR_MAP[iconName] || '';
}

/**
 * Checks if an icon name has a custom DS color class
 * @param iconName - The name of the icon
 * @returns True if the icon has a custom color class
 */
export function hasDsIconColor(iconName: string): boolean {
  return iconName in DS_ICON_COLOR_MAP;
}
