import { Idropdown } from '@shared/interfaces';
import { ensureArray } from './array.util';

// Overload for types that have a `name` property.
export function toDropdown<
  T extends
    | { id: string | number; name: string }
    // TODO: bilingual => need to remove name from here always use displayName
    | { id: string | number; displayName: string },
>(list: T[]): Idropdown[];

// Overload for types without a `name` property (caller must supply keyName).
export function toDropdown<T extends { id: string | number }>(
  list: T[],
  keyName: keyof T,
): Idropdown[];

// Implementation:
export function toDropdown<T extends { id: string | number }>(
  list: T[],
  keyName?: keyof T,
): Idropdown[] {
  return ensureArray(list).map((item) => {
    let displayValue: string;

    if (keyName) {
      // Use the specified key
      displayValue = item[keyName] as string;
    } else {
      // Default logic: try displayName first, fallback to name
      const hasDisplayName = 'displayName' in item;
      const hasName = 'name' in item;

      if (hasDisplayName && item.displayName) {
        displayValue = item.displayName as string;
      } else if (hasName && item.name) {
        displayValue = item.name as string;
      } else {
        displayValue = String(item.id); // Last resort fallback
      }
    }

    return {
      value: item.id,
      displayedValue: displayValue,
    };
  });
}
