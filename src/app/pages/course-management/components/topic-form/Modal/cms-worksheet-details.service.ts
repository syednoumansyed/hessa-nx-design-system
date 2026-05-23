import { computed, inject, Injectable, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { CMSAssignmentDTO } from '@pages/course-management/data-access/cms/cms-assignment.dto';
import { CMSAssignmentsService } from '@pages/course-management/data-access/cms/cms-assignments.service';
import { AssignmentStatus } from '@pages/course-management/data-access/lms/lms-assignment.dto';
import { IAttachmentControlUploadedValue } from '@ui-kit/hes-attachment-form-control/attachment-control-value.interface';
import { HesTranslateService } from '../../../../../shared/services/hes-translate.service';
import { ObjId } from '@shared/interfaces/common.interface';

@Injectable()
export class CMSWorksheetDetailsService {
  //#region Injected Services
  private readonly transloco = inject(TranslocoService);
  private assignmentsService = inject(CMSAssignmentsService);
  private hesTranslateService = inject(HesTranslateService);
  //#endregion

  //#region Signals & Computed Properties
  readonly worksheetDetails = signal<CMSAssignmentDTO | null>(null);
  readonly worksheetData = computed(() => {
    const worksheetDetails = this.worksheetDetails()!;
    return [
      {
        title: this.transloco.translate('global.title.label'),
        value: worksheetDetails?.title,
      },
      {
        title: this.transloco.translate('global.status.title'),
        value: AssignmentStatus.PUBLISHED ?? '',
        type: 'badge',
      },
      {
        title: this.transloco.translate(
          'content_management.publishing_date_time.title',
        ),
        value: worksheetDetails?.publishingDate,
        type: 'date',
      },
      {
        title: this.transloco.translate(
          'content_management.Assignment_type.label',
        ),
        value: this.hesTranslateService.enumT(worksheetDetails?.type),
      },
      {
        title: this.transloco.translate(
          'content_management.due_date_time.label',
        ),
        value: worksheetDetails?.dueDate,
        type: 'date',
      },
      {},
      {
        title: this.transloco.translate('global.description.label'),
        value: worksheetDetails?.description,
        type: 'paragraph',
      },
    ];
  });

  worksheet = computed<IAttachmentControlUploadedValue[] | undefined>(() => {
    return this.worksheetDetails()
      ?.attachments as IAttachmentControlUploadedValue[];
  });
  //#endregion

  //#region Public Methods
  getWorksheetData(assignmentId: ObjId): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.assignmentsService.getAssignment(assignmentId).subscribe({
        next: (assignment) => {
          this.worksheetDetails.set(assignment);
          resolve(this.worksheetData());
        },
        error: (err) => {
          reject(err);
        },
      });
    });
  }

  getWorksheetAttachment() {
    return this.worksheet();
  }
  //#endregion
}
