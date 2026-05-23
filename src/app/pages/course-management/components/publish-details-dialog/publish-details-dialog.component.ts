import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { HessaBtnDirective } from '@ui-kit/hes-button/hes-button.directive';
import { IonButton } from '@ionic/angular/standalone';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';
import { NgClass, NgForOf } from '@angular/common';
import { Observable } from 'rxjs';
import { ContentPublishService } from '@pages/course-management/data-access/content-publish.service';
import { HesDatePipe } from '@shared/pipes/hessa-date.pipe';
import {
  ContentPublish,
  StudentInfo,
} from '@pages/course-management/data-access/content-publish.interface';

@Component({
  selector: 'app-publish-details-dialog',
  templateUrl: './publish-details-dialog.component.html',
  imports: [
    HessaBtnDirective,
    IonButton,
    ReactiveFormsModule,
    NgClass,
    HesDatePipe,
    NgForOf,
    TranslocoDirective,
  ],
  standalone: true,
})
export class PublishDetailsDialogComponent implements OnInit {
  @Input() isEditMode = false;
  @Input() publishedFor: 'CLASS' | 'STUDENT' | 'TOPIC' | null;
  @Input() contentType: 'Attachment' | 'video' | 'exam' | 'assignment';
  @Input() contentId: number;
  @Input() publishedDate: string | null;
  @Input() close: (
    success: boolean,
    cancelled: boolean,
    editDialog: boolean,
  ) => void;
  students = signal<StudentInfo[]>([]);
  classText = signal<string>('');
  allClassesSelected = signal<boolean>(false);
  allStudentsSelected = signal<boolean>(false);

  private readonly contentPublishService = inject(ContentPublishService);

  constructor() {}

  ngOnInit() {
    this.getPublishedDetails();
  }

  getPublishedDetails() {
    this.getSubscription().subscribe((res) => {
      const { selected, available } = res;

      this.students.set(selected.students ?? []);
      // Create a string of class names separated by commas
      this.classText.set(
        selected.classes?.map((item) => item.displayName).join(', ') ?? '',
      );

      const allClassesSelected =
        selected.classes.length === available.classes.length ||
        selected.classes.length === 0;
      this.allClassesSelected.set(allClassesSelected);
      const allStudentsSelected =
        selected.students.length === available.students.length ||
        selected.students.length === 0;
      this.allStudentsSelected.set(allStudentsSelected);
    });
  }

  getSubscription(): Observable<ContentPublish> {
    switch (this.contentType) {
      case 'Attachment':
      case 'video':
        return this.contentPublishService.getAttachmentPublishData(
          this.contentId,
        );

      case 'exam':
        return this.contentPublishService.getExamPublishData(this.contentId);

      case 'assignment':
        return this.contentPublishService.getAssignmentPublishData(
          this.contentId,
        );
    }
  }

  edit() {
    this.close(false, false, true);
  }
}
