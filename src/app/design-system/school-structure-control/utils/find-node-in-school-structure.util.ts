import {
  DsSchoolStructureControlItem,
  DsSchoolStructureControlValue,
} from '../types/school-structure-control.types';

export const findNodeInSchoolStructure = (
  items: DsSchoolStructureControlItem[],
  searchKey: DsSchoolStructureControlValue,
  visited: WeakSet<DsSchoolStructureControlItem> = new WeakSet(),
): DsSchoolStructureControlItem | undefined => {
  for (const item of items) {
    if (visited.has(item)) {
      continue;
    }
    visited.add(item);

    if (searchKey.type === 'school_level') {
      if (item.type === 'level' && item.schoolLevelId === searchKey.id) {
        return item;
      }
    } else if (item.id === searchKey.id && item.type === searchKey.type) {
      return item;
    }

    if (item.children?.length) {
      const found = findNodeInSchoolStructure(
        item.children,
        searchKey,
        visited,
      );
      if (found) {
        return found;
      }
    }
  }
  return undefined;
};
