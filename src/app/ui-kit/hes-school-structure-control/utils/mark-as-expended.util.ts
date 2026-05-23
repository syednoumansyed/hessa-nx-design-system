import { SchoolStructureControlItem } from '../school-structure-control-item.interface';

export function markAsExpended(node: SchoolStructureControlItem): void {
  if (node.parent) {
    node.parent.isExpended = true;
    markAsExpended(node.parent);
  }
}
