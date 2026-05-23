import { Injectable, computed, signal } from '@angular/core';
import {
  SchoolStructureControlItem,
  SchoolStructureControlValue,
} from './school-structure-control-item.interface';
import { findNodeInSchoolStructure } from './utils/find-node-in-school-structure.util';
import { markAsExpended } from './utils/mark-as-expended.util';

type SelectValueMapType = Map<string, SchoolStructureControlItem>;

@Injectable()
export class SchoolStructureControlHelperService {
  private _value = signal<SelectValueMapType>(new Map());
  onControlChange: any = () => {};
  value = this._value.asReadonly();
  isMultiSelect = false;
  mapSelectValue = computed<SchoolStructureControlItem[]>(() => {
    const value = this._value();
    return Array.from(value.values());
  });

  onSelect(node: SchoolStructureControlItem) {
    this.deselectParentNodes(node);
    this.deselectAllChildNodes(node.children);
    this.setNodeAsSelected(node);
  }

  onToggle(node: SchoolStructureControlItem) {
    if (this.hasValue(node)) {
      this.delete(node);
    } else {
      this.onSelect(node);
    }
    this.onChange();
  }

  mapToFormControlValue(): SchoolStructureControlValue[] {
    return this.mapSelectValue().map((item) => ({
      id:
        item.type === 'level' && item.schoolLevelId
          ? item.schoolLevelId
          : item.id,
      type: item.type === 'level' ? 'school_level' : item.type,
      name: item.name,
    }));
  }
  onDeselect(node: SchoolStructureControlItem) {
    this.delete(node);
  }

  writeValue(
    values: Array<SchoolStructureControlValue>,
    data: SchoolStructureControlItem[] | null,
  ) {
    const selectNodes: SchoolStructureControlItem[] = [];
    this.makeEmptyValue();
    if (data && Array.isArray(values)) {
      values.forEach((item) => {
        const found = findNodeInSchoolStructure(data, item);
        if (found) {
          selectNodes.push(found);
          markAsExpended(found);
        }
      });
    }
    selectNodes.forEach((node) => {
      this.setNodeAsSelected(node);
    });
  }

  deselectParentNodes(node: SchoolStructureControlItem) {
    for (
      let currentNode: SchoolStructureControlItem | null = node;
      currentNode;
      currentNode = currentNode.parent
    ) {
      this.delete(currentNode);
    }
  }

  deselectAllChildNodes(childrenNodes: SchoolStructureControlItem[]) {
    childrenNodes.forEach((node) => {
      this.delete(node);
      if (node.children) {
        this.deselectAllChildNodes(node.children);
      }
    });
  }

  private delete(node: SchoolStructureControlItem) {
    const selectValue = this._value();
    selectValue.delete(this.getKey(node));
    this._value.set(new Map(selectValue));
  }

  private setNodeAsSelected(node: SchoolStructureControlItem) {
    const selectValue = this._value();
    if (!this.isMultiSelect) {
      selectValue.clear();
    }
    selectValue.set(this.getKey(node), node);
    this._value.set(new Map(selectValue));
  }

  private getKey(value: SchoolStructureControlItem) {
    if (value.type === 'level') return `${value.schoolLevelId}-${value.type}`;
    return `${value.id}-${value.type}`;
  }

  private makeEmptyValue() {
    this._value.set(new Map());
  }

  hasValue(value: SchoolStructureControlItem): boolean {
    const selectValue = this._value();
    if (value.type && value.id) {
      return selectValue.has(this.getKey(value));
    }
    return false;
  }
  // setData(data: SchoolStructureControlItem[] | null) {
  //   this._data.set(data);
  // }

  onChange() {
    this.onControlChange(this.mapToFormControlValue());
  }
}
