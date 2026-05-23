import { Injectable, computed, signal } from '@angular/core';
import {
  DsSchoolStructureControlItem,
  DsSchoolStructureControlValue,
} from '../types/school-structure-control.types';
import { findNodeInSchoolStructure } from '../utils/find-node-in-school-structure.util';
import { markAsExpanded } from '../utils/mark-as-expanded.util';

type SelectionMap = Map<string, DsSchoolStructureControlItem>;

@Injectable()
export class DsSchoolStructureControlHelperService {
  private readonly selection = signal<SelectionMap>(new Map());

  /** Flag toggled by the control to determine if multiple selection is allowed. */
  isMultiSelect = false;

  /**
   * Consumers subscribe to this signal from templates to render the selected nodes.
   */
  readonly mapSelectValue = computed(() =>
    Array.from(this.selection().values()),
  );

  /** Callback wired by the control to propagate value updates to the form API. */
  onControlChange: (value: DsSchoolStructureControlValue[]) => void = () => {};

  onToggle(node: DsSchoolStructureControlItem) {
    if (this.hasValue(node)) {
      this.delete(node);
    } else {
      this.onSelect(node);
    }
    this.onChange();
  }

  onSelect(node: DsSchoolStructureControlItem) {
    this.deselectParentNodes(node);
    this.deselectAllChildNodes(node.children);
    this.setNodeAsSelected(node);
  }

  onDeselect(node: DsSchoolStructureControlItem) {
    this.delete(node);
  }

  writeValue(
    values: DsSchoolStructureControlValue[] | null,
    data: DsSchoolStructureControlItem[] | null,
  ) {
    this.selection.set(new Map());
    if (!values?.length || !data?.length) {
      return;
    }

    const nodesToSelect: DsSchoolStructureControlItem[] = [];
    values.forEach((value) => {
      const found = findNodeInSchoolStructure(data, value);
      if (found) {
        nodesToSelect.push(found);
        markAsExpanded(found);
      }
    });

    nodesToSelect.forEach((node) => this.setNodeAsSelected(node));
  }

  mapToFormControlValue(): DsSchoolStructureControlValue[] {
    return this.mapSelectValue().map((item) => ({
      id:
        item.type === 'level' && item.schoolLevelId
          ? item.schoolLevelId
          : item.id,
      type: item.type === 'level' ? 'school_level' : item.type,
      name: item.name,
    }));
  }

  hasValue(node: DsSchoolStructureControlItem): boolean {
    return this.selection().has(this.getKey(node));
  }

  onChange() {
    this.onControlChange(this.mapToFormControlValue());
  }

  private delete(node: DsSchoolStructureControlItem) {
    const current = this.selection();
    current.delete(this.getKey(node));
    this.selection.set(new Map(current));
  }

  private setNodeAsSelected(node: DsSchoolStructureControlItem) {
    const current = this.selection();
    if (!this.isMultiSelect) {
      current.clear();
    }
    current.set(this.getKey(node), node);
    this.selection.set(new Map(current));
  }

  private deselectParentNodes(node: DsSchoolStructureControlItem) {
    const visited = new WeakSet<DsSchoolStructureControlItem>();
    for (
      let current: DsSchoolStructureControlItem | null = node;
      current && !visited.has(current);
      current = current.parent
    ) {
      visited.add(current);
      this.delete(current);
    }
  }

  private deselectAllChildNodes(children: DsSchoolStructureControlItem[]) {
    const visited = new WeakSet<DsSchoolStructureControlItem>();
    const traverse = (nodes: DsSchoolStructureControlItem[]) => {
      nodes.forEach((child) => {
        if (visited.has(child)) {
          return;
        }
        visited.add(child);
        this.delete(child);
        if (child.children?.length) {
          traverse(child.children);
        }
      });
    };
    traverse(children);
  }

  private getKey(value: DsSchoolStructureControlItem) {
    if (value.type === 'level') {
      return `${value.schoolLevelId}-${value.type}`;
    }
    return `${value.id}-${value.type}`;
  }
}
