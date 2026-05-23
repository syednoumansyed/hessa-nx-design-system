import { Injectable, inject } from '@angular/core';
import { SchoolStructureControlItem } from '../school-structure-control-item.interface';
import { StructureDepth } from '@shared/utils/school-structure';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';

@Injectable({
  providedIn: 'root',
})
export class SchoolStructureApiService {
  private schoolStructureScope = inject(SchoolStructureScopeService);
  constructor() {}

  getSchoolStructure(structureDepth: StructureDepth) {
    const data =
      this.schoolStructureScope.getUserScopedSchoolStructureTillDepth(
        structureDepth,
      ) as unknown as SchoolStructureControlItem[];
    this.addParentRef(data);
    return data;
  }

  private addParentRef(
    nodes: SchoolStructureControlItem[],
    parent: SchoolStructureControlItem | null = null,
  ) {
    nodes.forEach((node) => {
      if (parent !== null) {
        node.parent = parent;
      }
      if (node.children) {
        this.addParentRef(node.children, node);
      }
    });
  }
}
