import { sideMenuSchoolStructureItem } from '@layout/layout.component';

/**
 * Resolves a school structure filter selection into API query params
 * by traversing the tree to find the node and collecting all ancestor IDs.
 *
 * For levels, returns the actual levelId (entity ID) instead of schoolLevelId.
 *
 * @example
 * // Selecting a class returns: { classId, levelId, schoolId, campusId, companyId }
 * // Selecting a level returns: { levelId, schoolId, campusId, companyId }
 * // Selecting a school returns: { schoolId, campusId, companyId }
 * // Selecting a campus returns: { campusId, companyId }
 * // Selecting a company returns: { companyId }
 */
export function resolveSchoolStructureParams(
  tree: sideMenuSchoolStructureItem[],
  nodeId: number,
  nodeType: string,
): Record<string, number> {
  const result: Record<string, number> = {};

  const find = (
    items: sideMenuSchoolStructureItem[],
    ancestors: sideMenuSchoolStructureItem[],
  ): boolean => {
    for (const item of items) {
      const path = [...ancestors, item];

      // For level nodes, match by schoolLevelId since the filter
      // control returns schoolLevelId as the selection id
      const isMatch =
        (nodeType === 'school_level' || nodeType === 'level') &&
        item.type === 'level'
          ? (item as any).schoolLevelId === nodeId
          : item.type === nodeType && item.id === nodeId;

      if (isMatch) {
        for (const node of path) {
          switch (node.type) {
            case 'company':
            case 'sub-company':
              result['companyId'] = node.id;
              break;
            case 'campus':
              result['campusId'] = node.id;
              break;
            case 'school':
              result['schoolId'] = node.id;
              break;
            case 'level':
              // Use actual level entity ID, not schoolLevelId (junction ID)
              result['levelId'] = node.id;
              break;
            case 'class':
              result['classId'] = node.id;
              break;
          }
        }
        return true;
      }

      if (item.children?.length && find(item.children, path)) {
        return true;
      }
    }
    return false;
  };

  find(tree, []);
  return result;
}
