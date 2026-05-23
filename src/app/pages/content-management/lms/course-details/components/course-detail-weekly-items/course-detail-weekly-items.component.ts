import { Component, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { CourseDetailContentFilterConfigUI } from '../course-weekly-detail/course-weekly-detail.component';
import {
  WorkItemConfig,
  WorkItemType,
} from '../course-work-item/course-work-item.interface';
import {
  CourseWorkItemComponent,
  UserEventData,
} from '../course-work-item/course-work-item.component';
import { DsIconComponent } from '@ds/icon/icon.component';
import { TranslocoDirective } from '@jsverse/transloco';
import {
  CourseContentItem,
  CourseDetailAssignment,
  CourseDetailExam,
  CourseDetailForStudent,
  CourseDetailTopicAttachment,
  CourseDetailVideo,
} from '../../data-access/course-detail.interface';
import { AssessmentStudentSubmissionStatus } from '@shared/enums';

@Component({
  selector: 'app-course-detail-weekly-items',
  standalone: true,
  imports: [
    CommonModule,
    CourseWorkItemComponent,
    DsIconComponent,
    TranslocoDirective,
  ],
  templateUrl: './course-detail-weekly-items.component.html',
})
export class CourseDetailWeeklyItemsComponent {
  readonly weekDetail = input.required<CourseDetailForStudent | null>();
  readonly activeFilter = input<CourseDetailContentFilterConfigUI | null>(null);
  readonly userEventEmit = output<UserEventData>();

  private readonly translationService = inject(HesTranslateService);

  readonly courseWorkItems = computed((): WorkItemConfig[] => {
    const content = this.weekDetail();
    const filter = this.activeFilter();

    if (!content) {
      return [];
    }

    const allItems = this.getAllWorkItems(content);

    // Filter items based on the selected filter type
    if (!filter) {
      return allItems;
    }

    return allItems.filter((item) => this.matchesFilter(item, filter));
  });

  onUserEvent(event: UserEventData): void {
    // Handle user event
    this.userEventEmit.emit(event);
  }

  private getAllWorkItems(content: CourseDetailForStudent): WorkItemConfig[] {
    const workItems: WorkItemConfig[] = [];

    // Add exams
    if (content.exams) {
      workItems.push(
        ...content.exams.map((exam) => this.mapExamToWorkItem(exam)),
      );
    }

    // Add assignments
    if (content.assignments) {
      workItems.push(
        ...content.assignments.map((assignment) =>
          this.mapAssignmentToWorkItem(assignment),
        ),
      );
    }

    // Add videos
    if (content.videos) {
      workItems.push(
        ...content.videos.map((video) => this.mapVideoToWorkItem(video)),
      );
    }

    // Add attachments
    if (content.otherAttachments) {
      workItems.push(
        ...content.otherAttachments.map((attachment) =>
          this.mapAttachmentToWorkItem(attachment),
        ),
      );
    }

    return workItems;
  }

  private mapExamToWorkItem(exam: CourseDetailExam): WorkItemConfig {
    return {
      id: exam.id,
      title: exam.title,
      status: this.getItemStatus(exam),
      type: WorkItemType.EXAM,
      hasIndicator: this.hasDisplayedStatus(exam),
      dueDate: 'dueDate' in exam ? exam.dueDate : undefined,
      topicId: exam.topicId,
    };
  }

  private mapAssignmentToWorkItem(
    assignment: CourseDetailAssignment,
  ): WorkItemConfig {
    return {
      id: assignment.id,
      title: assignment.title,
      status: this.getItemStatus(assignment),
      type:
        assignment.type === 'QUESTION'
          ? WorkItemType.QUIZ
          : WorkItemType.ASSIGNMENT,
      hasIndicator: this.hasDisplayedStatus(assignment),
      dueDate: 'dueDate' in assignment ? assignment.dueDate : undefined,
      topicId: assignment.topicId,
    };
  }

  private mapVideoToWorkItem(video: CourseDetailVideo): WorkItemConfig {
    return {
      id: video.id,
      title: video.title,
      status: this.getItemStatus(video),
      type: WorkItemType.VIDEO,
      hasIndicator: this.hasDisplayedStatus(video),
      url: video.isLink ? video.key : video.url,
      isLink: video.isLink,
      topicId: video.topicId,
    };
  }

  private mapAttachmentToWorkItem(
    attachment: CourseDetailTopicAttachment,
  ): WorkItemConfig {
    return {
      id: attachment.id,
      title: attachment.title,
      status: this.getItemStatus(attachment),
      type: WorkItemType.ATTACHMENT,
      hasIndicator: this.hasDisplayedStatus(attachment),
      url: attachment.url,
      extension: attachment.extension,
      isLink: attachment.isLink,
      topicId: attachment.topicId,
    };
  }

  private matchesFilter(
    item: WorkItemConfig,
    filter: CourseDetailContentFilterConfigUI,
  ): boolean {
    switch (filter) {
      case CourseDetailContentFilterConfigUI.ASSIGNMENTS:
        return (
          item.type === WorkItemType.ASSIGNMENT ||
          item.type === WorkItemType.QUIZ
        );
      case CourseDetailContentFilterConfigUI.EXAMS:
        return item.type === WorkItemType.EXAM;
      case CourseDetailContentFilterConfigUI.VIDEOS:
        return item.type === WorkItemType.VIDEO;
      case CourseDetailContentFilterConfigUI.ATTACHMENTS:
        return item.type === WorkItemType.ATTACHMENT;
      default:
        return true;
    }
  }

  private hasDisplayedStatus(item: CourseContentItem): boolean {
    return item.displayStatus === 'NEW';
  }

  private getItemStatus(
    item: CourseContentItem,
  ): AssessmentStudentSubmissionStatus | null {
    // First priority: Check if submissionData exists and has status
    if ('submissionData' in item && item.submissionData?.status) {
      return item.submissionData.status;
    }

    // Second priority: Check viewStatus for assignments and exams
    if ('viewStatus' in item) {
      // If viewStatus is 'NEW', it's pending
      if (item.viewStatus === 'NEW') {
        return AssessmentStudentSubmissionStatus.NEW;
      }
    }

    // Default to pending (new)
    return null;
  }

  // Expose translation function for template
  protected t(key: string, params?: any): string {
    return this.translationService.t(key, params);
  }
}
