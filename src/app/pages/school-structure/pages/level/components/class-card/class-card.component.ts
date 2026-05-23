import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import {
  CardListItemComponent,
  CardListItemConfig,
} from '@shared/components/card-list-item/card-list-item.component';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';
import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { LevelsService } from '../../data-access/levels.service';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { catchError, combineLatest, map, of } from 'rxjs';
import { Class, Level, School } from '@shared/dto-transformation/organization';

@Component({
  selector: 'app-class-card',
  templateUrl: './class-card.component.html',
  standalone: true,
  imports: [CardListItemComponent],
})
export class ClassCardComponent implements OnInit {
  private _classDetail: Class;
  @Input() set classDetail(data: Class) {
    this._classDetail = data;
  }

  get classDetail() {
    return this._classDetail;
  }
  @Input() schoolDetail: School;
  @Input() levelDetail: Level;
  @Output() edit = new EventEmitter<Class>();
  @Output() delete = new EventEmitter<number>();

  readonly classMeta = signal<CardListItemConfig | null>(null);
  private readonly rbacService = inject(RoleBaseAccessControlService);
  private readonly translocoService = inject(TranslocoService);
  private readonly router = inject(Router);
  private readonly levelApiService = inject(LevelsService);
  private readonly academicYearsScopeService = inject(
    AcademicYearsScopeService,
  );
  ngOnInit(): void {
    this.fetchAssignedStudent();
  }

  fetchActiveStudent() {
    return this.levelApiService
      .getStudentsList({
        itemsPerPage: 1,
        pageNumber: 1,
        studentClassStatus: 'ACTIVE',
        classId: this.classDetail.id,
        academicYearId:
          this.academicYearsScopeService.selectedAcademicYear()?.id,
        schoolId: this.schoolDetail?.id?.toString(),
      })
      .pipe(
        map((resp) => {
          return resp.paginate.totalItems;
        }),
        catchError(() => {
          return of(0);
        }),
      );
  }

  fetchAllStudents() {
    return this.levelApiService
      .getStudentsList({
        itemsPerPage: 1,
        pageNumber: 1,
        classId: this.classDetail.id,
      })
      .pipe(
        map((resp) => {
          return resp.paginate.totalItems;
        }),
        catchError(() => {
          return of(0);
        }),
      );
  }

  private fetchAssignedStudent() {
    combineLatest([
      this.fetchActiveStudent(),
      this.fetchAllStudents(),
    ]).subscribe({
      next: ([activeStudentCount, allStudentCount]) => {
        this.setMetaData(activeStudentCount, allStudentCount);
      },
      error: () => {
        this.setMetaData(0, 0);
      },
    });
  }

  private setMetaData(
    activeStudentCount: number,
    studentLinkToClassCount: number,
  ) {
    const classMeta = {
      title: this.classDetail.displayName,
      icon: {
        hesIcon: {
          src: 'assets/icons/class.svg',
        },
      },
      info: [
        {
          label: `${activeStudentCount} ${this.translocoService.translate('global.students.title')}`,
          hesIcon: {
            src: 'assets/icons/class.svg',
          },
        },
      ],
      actions: [
        {
          label: this.translocoService.translate('global.view.btn'),
          onAction: () => {
            this.router.navigate([
              `school-structure/school/${this.schoolDetail?.id}/level/${this.levelDetail?.id}/class/${this.classDetail.id}`,
            ]);
          },
          hasAccess: this.classDetail.hasAccess,
        },
      ],
    };

    if (this.rbacService.hasPermission(RESOURCE_PERMISSION.class.updateClass)) {
      classMeta.actions.push({
        label: this.translocoService.translate('global.edit.btn'),
        onAction: () => {
          this.edit.next(this.classDetail);
        },
        hasAccess: this.classDetail.hasAccess,
      });
    }
    if (
      this.rbacService.hasPermission(RESOURCE_PERMISSION.class.deleteClass) &&
      !studentLinkToClassCount
    ) {
      classMeta.actions.push({
        label: this.translocoService.translate('global.delete.btn'),
        onAction: () => {
          this.delete.next(this.classDetail.id);
        },
        hasAccess: this.classDetail.hasAccess,
      });
    }
    this.classMeta.set(classMeta);
  }
}
