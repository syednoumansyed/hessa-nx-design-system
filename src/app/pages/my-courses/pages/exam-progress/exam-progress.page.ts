import {
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { HesTableComponent } from '@ui-kit/hes-table/hes-table.component';
import { ExamProgressTableColDefService } from './exam-progress-col-def.service';
import { INoRowsOverlay } from '@ui-kit/hes-table/model';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { ListingHeaderComponent } from '@shared/components/user-listing-header/listing-header.component';
import { ActivatedRoute } from '@angular/router';

import { LmsExamDto } from '@pages/course-management/data-access/lms-exam.dto';
import { LMSExamService } from '@pages/course-management/data-access/lms-exam.service';
import { CourseManagementService } from '@pages/course-management/data-access/course-management.service';
import { Idropdown } from '@shared/interfaces';
import { IControl } from '@shared/components/form-control-generator/form-control-generator.component';
import { getLocalizedName } from '@shared/utils/localization.util';

@Component({
  selector: 'app-exam-progress',
  templateUrl: './exam-progress.page.html',
  standalone: true,
  imports: [
    IonContent,
    HesTableComponent,
    ListingHeaderComponent,
    TranslocoDirective,
  ],
  providers: [ExamProgressTableColDefService],
})
export class ExamProgressPage implements OnInit {
  courseId = input<number>();
  private readonly translocoService = inject(TranslocoService);
  private readonly activeRoute = inject(ActivatedRoute);
  private readonly activeExamId = signal<number>(0);
  private readonly academicYearScope = inject(AcademicYearsScopeService);
  private readonly examApiService = inject(LMSExamService);
  private readonly courseManagementService = inject(CourseManagementService);

  private readonly examProgressTableColDefService = inject(
    ExamProgressTableColDefService,
  );
  readonly columns = this.examProgressTableColDefService.columns;
  examDetails = signal<LmsExamDto | undefined>(undefined);

  readonly examProgressTableData = signal<Array<any>>([]);

  noRowsOverlayComponentParams = signal<INoRowsOverlay>({
    imgSrc: 'assets/illustrations/no_data.svg',
    title: this.translate('course_management.no_submissions.title'),
    subTitle: this.translate('course_management.no_submissions.txt'),
  });
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

  constructor() {}

  ngOnInit() {
    this.activeRoute.params.subscribe((params) => {
      this.activeExamId.set(params['examId']);
    });
    this.fetchCourseClasses();
  }

  private fetchExamStudentsProgress() {
    this.isLoading.set(true);

    this.examApiService
      .getExamStudentsProgress(this.activeExamId(), {
        academicYearId: this.academicYearScope.selectedAcademicYear()?.id!,
        ...(this.selectedClassId() && { classId: this.selectedClassId()! }),
      })
      .subscribe({
        next: (response: any) => {
          this.examDetails.set(response.data.exam);
          this.examProgressTableData.set(
            this.examProgressTableColDefService.mapTableData(response.data),
          );
          this.isLoading.set(false);
        },
        error: (err) => {
          if (err.status === 404 && err.error.paginate.totalItems === 0) {
            this.examProgressTableData.set([]);
          }
          this.isLoading.set(false);
        },
      });
  }

  translate(key: string, params: object = {}): string {
    return this.translocoService.translate(key, params);
  }

  onFiltersChange(event: { classId: number }) {
    this.selectedClassId.set(event.classId);
    this.fetchExamStudentsProgress();
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
        this.fetchExamStudentsProgress();
      });
  }
}
