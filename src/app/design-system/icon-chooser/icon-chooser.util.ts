import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  ICON_NAME_TO_DEFINITION,
  ICON_CHOOSER_OPTIONS,
  IconOption,
} from './icon-chooser.constant';

/**
 * Converts an icon name string (from database) to IconDefinition for rendering
 * @param iconName - The icon name string (e.g., 'fa-user')
 * @returns The IconDefinition or undefined if not found
 */
export function getIconDefinitionByName(
  iconName: string | null | undefined,
): IconDefinition | undefined {
  if (!iconName) return undefined;
  return ICON_NAME_TO_DEFINITION[iconName];
}

/**
 * Gets the icon option by name
 * @param iconName - The icon name string
 * @returns The full IconOption or undefined
 */
export function getIconOptionByName(
  iconName: string | null | undefined,
): IconOption | undefined {
  if (!iconName) return undefined;
  return ICON_CHOOSER_OPTIONS.find((opt) => opt.name === iconName);
}

/**
 * Searches icons by search terms or icon name
 * @param searchTerm - The search string
 * @returns Array of matching IconOptions
 */
export function searchIcons(searchTerm: string): IconOption[] {
  const term = searchTerm.toLowerCase();
  return ICON_CHOOSER_OPTIONS.filter(
    (opt) =>
      opt.name.toLowerCase().includes(term) ||
      opt.searchTerms.some((t) => t.toLowerCase().includes(term)),
  );
}
