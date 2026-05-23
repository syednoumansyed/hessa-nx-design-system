import {
  SchoolStructureControlItem,
  SchoolStructureControlValue,
} from '../school-structure-control-item.interface';
export const findNodeInSchoolStructure = (
  items: SchoolStructureControlItem[],
  searchKey: SchoolStructureControlValue,
): SchoolStructureControlItem | undefined => {
  for (const item of items) {
    if (searchKey.type === 'school_level') {
      if (item.type === 'level' && item.schoolLevelId === searchKey.id) {
        return item;
      }
    } else {
      if (item.id === searchKey.id && item.type === searchKey.type) {
        return item;
      }
    }

    if (item.children) {
      const found = findNodeInSchoolStructure(item.children, searchKey);
      if (found) {
        return found;
      }
    }
  }

  return undefined;
};
