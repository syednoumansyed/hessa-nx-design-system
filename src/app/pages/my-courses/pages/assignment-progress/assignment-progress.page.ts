import {
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';
import { HesButtonModule } from '@ui-kit/hes-button/hes-button.module';
import { HesTableComponent } from '@ui-kit/hes-table/hes-table.component';
import { AssignmentProgressTableColDefService } from './assignment-progress-col-def.service';
import {
  SizeColumnsToFitGridStrategy,
  SizeColumnsToContentStrategy,
} from 'ag-grid-community';
import { INoRowsOverlay } from '@ui-kit/hes-table/model';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { ListingHeaderComponent } from '@shared/components/user-listing-header/listing-header.component';
import { ActivatedRoute } from '@angular/router';

import { CMSAssignmentsService } from '@pages/course-management/data-access/cms/cms-assignments.service';
import { CMSAssignmentDTO } from '@pages/course-management/data-access/cms/cms-assignment.dto';
import { isMobile } from '@shared/utils/platform';
import { CourseManagementService } from '@pages/course-management/data-access/course-management.service';
import { Idropdown } from '@shared/interfaces';
import { first, map, Observable } from 'rxjs';
import { IControl } from '@shared/components/form-control-generator/form-control-generator.component';
import { getLocalizedName } from '@shared/utils/localization.util';

@Component({
  selector: 'app-assignment-progress',
  templateUrl: './assignment-progress.page.html',
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    HesButtonModule,
    HesTableComponent,
    ListingHeaderComponent,
    TranslocoDirective,
  ],
  providers: [AssignmentProgressTableColDefService],
})
export class AssignmentProgressPage implements OnInit {
  courseId = input<number>();
  readonly isMobile = isMobile();
  private readonly translocoService = inject(TranslocoService);
  private readonly activeRoute = inject(ActivatedRoute);
  private readonly activeAssignmentId = signal<number>(0);
  private readonly academicYearScope = inject(AcademicYearsScopeService);
  private readonly assignmentService = inject(CMSAssignmentsService);
  private readonly courseManagementService = inject(CourseManagementService);
  private readonly assignmentProgressTableColDefService = inject(
    AssignmentProgressTableColDefService,
  );
  readonly columns = this.assignmentProgressTableColDefService.columns;
  assignmentDetails = signal<CMSAssignmentDTO | undefined>(undefined);

  readonly assignmentProgressTableData = signal<Array<any>>([]);
  autoSizeStrategy:
    | SizeColumnsToFitGridStrategy
    | SizeColumnsToContentStrategy
    | undefined = { type: 'fitCellContents' };

  noRowsOverlayComponentParams: INoRowsOverlay = {
    imgSrc: 'assets/illustrations/no_data.svg',
    title: this.translate('course_management.no_submissions.title'),
    subTitle: this.translate('course_management.no_submissions.txt'),
  };

  isLoading = signal(false);
  courseClasses = signal<Idropdown[]>([]);
  readonly headerFilterConfig = computed<
    Array<IControl & { initVal?: string | number | null }>
  >(() => {
    return [
      {
        formControlName: 'classId',
        placeholder: this.translocoService.translate('global.class.label'),
        selectValues: this.courseClasses(),
        initVal: this.selectedClassId(),
        required: false,
        type: 'searchable-select',
      },
    ];
  });

  selectedClassId = signal<number | null>(null);

  ngOnInit() {
    if (!this.isMobile) {
      this.autoSizeStrategy = { type: 'fitGridWidth' };
    }
    this.activeRoute.params.subscribe((params) => {
      this.activeAssignmentId.set(params['assignmentId']);
    });
    this.fetchCourseClasses();
  }

  onFiltersChange(event: { classId: number }) {
    this.selectedClassId.set(event.classId);
    this.fetchStudentsProgress();
  }

  private fetchCourseClasses() {
    return this.courseManagementService
      .getCourseById(this.courseId())
      .subscribe(({ data }) => {
        if (Array.isArray(data?.classes)) {
          this.courseClasses.set(
            data.classes.map(
              (cls: { id: number; arName: string; enName: string }) => ({
                value: cls.id,
                displayedValue: getLocalizedName(cls),
              }),
            ),
          );
        }
        this.fetchStudentsProgress();
      });
  }

  private fetchStudentsProgress() {
    this.isLoading.set(true);
    this.assignmentService
      .getAssignmentsStudentsProgress(this.activeAssignmentId(), {
        academicYearId: this.academicYearScope.selectedAcademicYear()?.id!,
        ...(this.selectedClassId() && { classId: this.selectedClassId()! }),
      })
      .subscribe({
        next: (response: any) => {
          this.assignmentDetails.set(response.data.assignment);
          this.assignmentProgressTableData.set(
            this.assignmentProgressTableColDefService.mapTableData(
              response.data,
            ),
          );
          this.isLoading.set(false);
        },
        error: (err) => {
          if (err.status === 404 && err.error.paginate.totalItems === 0) {
            this.assignmentProgressTableData.set([]);
          }
          this.isLoading.set(false);
        },
      });
  }

  translate(key: string, params: object = {}): string {
    return this.translocoService.translate(key, params);
  }
}
