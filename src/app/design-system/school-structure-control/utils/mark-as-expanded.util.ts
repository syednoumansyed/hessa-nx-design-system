import { DsSchoolStructureControlItem } from '../types/school-structure-control.types';

export function markAsExpanded(node: DsSchoolStructureControlItem): void {
  const visited = new WeakSet<DsSchoolStructureControlItem>();
  for (let current = node.parent; current; current = current.parent) {
    if (visited.has(current)) {
      break;
    }
    visited.add(current);
    current.isExpanded = true;
  }
}
