import { Injectable, inject } from '@angular/core';
import { StructureDepth } from '@shared/utils/school-structure';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { DsSchoolStructureControlItem } from '../types/school-structure-control.types';

@Injectable({ providedIn: 'root' })
export class DsSchoolStructureApiService {
  private readonly schoolStructureScope = inject(SchoolStructureScopeService);

  getSchoolStructure(
    depth: StructureDepth,
  ): DsSchoolStructureControlItem[] | null {
    const data =
      this.schoolStructureScope.getUserScopedSchoolStructureTillDepth(
        depth,
      ) as unknown as DsSchoolStructureControlItem[];

    if (!data) {
      return null;
    }

    this.attachParentReferences(data, null);
    return data;
  }

  private attachParentReferences(
    nodes: DsSchoolStructureControlItem[],
    parent: DsSchoolStructureControlItem | null,
  ) {
    nodes.forEach((node) => {
      node.parent = parent;
      if (node.children?.length) {
        this.attachParentReferences(node.children, node);
      }
    });
  }
}
