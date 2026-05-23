import { Injectable, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { GenericErrorFeedbackService } from '@shared/services/generic-error-feedback.service';
import { TranslocoService } from '@jsverse/transloco';
import { ToastrService } from 'ngx-toastr';
import { CourseManagementService } from '@pages/course-management/data-access/course-management.service';
import { AddEditCourseDialogComponent } from '../components/add-edit-level-dialog/add-edit-course-dialog.component';
import { DsModalService } from '@ds/modal/modal.service';
import { HesTranslateService } from '@shared/services/hes-translate.service';

import { RoleBaseAccessControlService } from '@shared/role-bace-acces-controller/role-base-access-control.service';
import { RESOURCE_PERMISSION } from '@shared/role-bace-acces-controller/resource-permission.constant';

@Injectable({
  providedIn: 'root',
})
export class CourseManagementModalService {
  private readonly modalService = inject(DsModalService);
  private readonly genericModalSerivce = inject(GenericErrorFeedbackService);
  private readonly translocoService = inject(TranslocoService);
  private readonly hesTranslate = inject(HesTranslateService);
  private readonly toaster = inject(ToastrService);
  private readonly courseService = inject(CourseManagementService);
  private readonly rbac = inject(RoleBaseAccessControlService);
  private readonly onSuccessCourseSource$ = new Subject<void>();
  readonly onSuccessCourse$ = this.onSuccessCourseSource$.asObservable();

  private translate(key: string, params: object = {}): string {
    return this.translocoService.translate(key, params);
  }

  onAddViewEditCourse = (courseId?: number, isView = false) => {
    this.modalService.open({
      component: AddEditCourseDialogComponent,
      componentProps: {
        courseId,
        onRefresh: this.onSuccessCourseSource$,
        isView,
      },
      headerConfig: {
        title: courseId
          ? this.hesTranslate.t('global.course.title')
          : this.hesTranslate.t('course_management.add_course.title'),
        showCloseButton: true,
      },
      ...(!isView && {
        footerConfig: {
          primaryButton: {
            text: this.hesTranslate.t('global.save.btn'),
          },
          secondaryButton: {
            text: this.hesTranslate.t('global.cancel.btn'),
          },
        },
      }),
      size: 'lg',
      scrollableContent: true,
      respectTopSafeArea: true,
    });
  };

  deleteCourse(courseId: number, hasContents: boolean, hasLectures = false) {
    if (hasLectures) {
      this.toaster.error(
        this.translocoService.translate(
          'course_management.course_delete_has_lectures_error.text',
        ),
        this.translocoService.translate('global.wrong_msg.title'),
      );
    } else if (
      !this.rbac.hasPermission(
        RESOURCE_PERMISSION.course.courseDeleteWithContents,
      ) &&
      hasContents
    ) {
      this.toaster.error(
        this.translocoService.translate(
          'course_management.course_delete_error.text',
        ),
        this.translocoService.translate('global.wrong_msg.title'),
      );
    } else
      this.genericModalSerivce.show(
        () => {
          this.handleCourseDelete(courseId, hasContents);
        },
        {
          modalTitle: this.translocoService.translate(
            'course_management.course_delete_msg.title',
          ),
          modalMessage:
            this.rbac.hasPermission(
              RESOURCE_PERMISSION.course.courseDeleteWithContents,
            ) && hasContents
              ? this.translocoService.translate(
                  'course_management.course_delete_msg.text',
                )
              : '',
          primaryBtnStr: this.translocoService.translate('global.delete.btn'),
        },
      );
  }

  private handleCourseDelete(id: number, hasContents: boolean) {
    this.courseService.deleteCourse(id, hasContents).subscribe({
      next: () => {
        this.toaster.success(
          '',
          this.translate('course_management.course_delete_successfully.txt'),
        );
        this.onSuccessCourseSource$.next();
      },
      error: (err) => {
        if (err.status === 400) {
          this.toaster.error('', this.translate(err.error.messageRef));
        } else {
          if (err.error.message) {
            this.toaster.error('', err.error.message);
          } else {
            this.toaster.error(
              this.translocoService.translate('global.delete_wrong_msg.txt'),
              this.translocoService.translate('global.wrong_msg.title'),
            );
          }
        }
      },
    });
  }
}
