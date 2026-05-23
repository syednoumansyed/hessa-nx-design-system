import { Injectable, inject } from '@angular/core';
import { GenericErrorFeedbackService } from '@shared/services/generic-error-feedback.service';
import { DsModalService } from '@ds/modal';
import { LectureFormComponent } from '../components/lecture-form/lecture-form.component';
import { Subject } from 'rxjs';
import { LectureDTO } from '../data-access/course-management.dto';
import { LectureApiService } from '../data-access/lecture.api.service';
import { ToastrService } from 'ngx-toastr';
import { TranslocoService } from '@jsverse/transloco';
import { CourseManagement } from '../data-access/course-management.interface';

@Injectable({
  providedIn: 'root',
})
export class LectureModalService {
  private readonly dsModalService = inject(DsModalService);
  private readonly genericModalSerivce = inject(GenericErrorFeedbackService);
  private readonly apiService = inject(LectureApiService);
  private readonly translocoService = inject(TranslocoService);
  private readonly toaster = inject(ToastrService);
  private onRefresh = new Subject<void>();
  public onRefresh$ = this.onRefresh.asObservable();
  async openLectureForm(
    course: CourseManagement,
    lecture?: LectureDTO,
    isView = false,
  ) {
    await this.dsModalService.open({
      component: LectureFormComponent,
      componentProps: {
        isView,
        course,
        onRefresh: this.onRefresh,
        lecture,
        deleteLecture: () => {
          if (lecture) this.deleteLectureConfirmationModal(lecture.id);
        },
      },
      size: 'md',
      scrollableContent: true,
    });
  }

  onViewLecture(course: CourseManagement, lecture: LectureDTO) {
    this.openLectureForm(course, lecture, true);
  }

  private deleteLectureConfirmationModal(academicId: number) {
    this.genericModalSerivce.show(
      () => {
        this.onDeleteLecture(academicId);
      },
      {
        modalTitle: this.translate('course.management.lecture_delete_msg.text'),
        modalMessage: '',
        primaryBtnStr: this.translocoService.translate('global.delete.btn'),
      },
    );
  }

  private onDeleteLecture(id: number) {
    this.apiService.deleteLecture(id).subscribe({
      next: (resp) => {
        this.onRefresh.next();
        this.toaster.success(
          '',
          this.translate('course_management.lecture_delete_successfully.txt'),
        );
      },
      error: (errorResp) => {
        if (errorResp.error.message) {
          this.toaster.error('', errorResp.error.message);
        } else {
          this.toaster.error(
            this.translocoService.translate('global.delete_wrong_msg.txt'),
            this.translocoService.translate('global.wrong_msg.title'),
          );
        }
      },
    });
  }

  private translate(key: string, params: object = {}): string {
    return this.translocoService.translate(key, params);
  }
}
