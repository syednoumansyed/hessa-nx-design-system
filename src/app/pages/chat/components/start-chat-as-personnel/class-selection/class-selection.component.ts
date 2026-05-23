import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, output, signal } from '@angular/core';
import { SchoolStructureScopeService } from '@core/school-structure-scope.service';
import { DsIconComponent } from '@ds/icon/icon.component';
import { sideMenuSchoolStructureItem } from '@layout/layout.component';
import { ChatService } from '@pages/chat/data-access/chat.service';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';

@Component({
  selector: 'app-class-selection',
  templateUrl: './class-selection.component.html',
  standalone: true,
  imports: [DsIconComponent, CommonModule],
})
export class ClassSelectionComponent implements OnInit {
  private readonly scopedSchoolStructure = inject(SchoolStructureScopeService);
  private readonly chatService = inject(ChatService);
  private readonly rbacService = inject(RoleBaseAccessControlService);

  classSelected = output<number>();
  schoolStructure = this.scopedSchoolStructure.userScopedSchoolStructure;
  availableGroupsList = this.chatService.availableGroupsList;
  dataToPopulateSchools = signal<any[]>([]);

  ngOnInit() {
    this.dataToPopulateSchools.set(
      this.mapDataToPopulateSchools(this.schoolStructure()),
    );
  }

  private mapDataToPopulateSchools = (data: sideMenuSchoolStructureItem[]) => {
    const result: any = [];
    const availableClassIds = new Set(
      this.availableGroupsList().map((group) => group.id),
    );

    const mapClasses = (
      levels: sideMenuSchoolStructureItem[],
    ): {
      classId: number;
      className: string;
      levelName: string;
      levelId: number;
    }[] => {
      const classes: {
        classId: number;
        className: string;
        levelName: string;
        levelId: number;
      }[] = [];

      const isTeacher = this.rbacService.isTeacher();

      levels.forEach((level: sideMenuSchoolStructureItem) => {
        level.children.forEach((cls: sideMenuSchoolStructureItem) => {
          if (!isTeacher || availableClassIds.has(cls.id)) {
            classes.push({
              classId: cls.id,
              className: cls.name,
              levelId: level.id,
              levelName: level.name,
            });
          }
        });
      });

      return classes;
    };

    function mapSchools(campuses: sideMenuSchoolStructureItem[]) {
      return campuses.flatMap((campus: sideMenuSchoolStructureItem) =>
        campus.children
          .map((school: sideMenuSchoolStructureItem) => {
            const classes = mapClasses(school.children);

            return {
              schoolId: school.id,
              schoolName: school.name,
              campusId: campus.id,
              campusName: campus.name,
              classes: classes,
            };
          })
          .filter((school: any) => school.classes.length > 0),
      );
    }

    function processCompany(company: sideMenuSchoolStructureItem) {
      company.children.forEach((child: sideMenuSchoolStructureItem) => {
        if (child.type === 'campus') {
          result.push(...mapSchools([child]));
        } else if (child.type === 'sub-company') {
          processCompany(child);
        }
      });
    }

    data.forEach((company: sideMenuSchoolStructureItem) => {
      processCompany(company);
    });

    return result;
  };

  selectClass(classItem: any) {
    this.classSelected.emit(classItem.classId);
  }
}
