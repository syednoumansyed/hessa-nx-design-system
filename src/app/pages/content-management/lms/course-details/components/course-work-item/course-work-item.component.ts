import { Component, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { DsIconContainerComponent } from '@ds/icon-container/icon-container.component';
import { DsIconContainerConfig } from '@ds/icon-container/icon-container.component';
import { getDsIconColorClass } from '@ds/icon/ds-icon-colors.util';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { WorkItemConfig, WorkItemType } from './course-work-item.interface';
import { STATUS_MAP } from '@pages/content-management/lms/lms.constant';
import { OnViewDirective } from '@shared/directives/on-view.directive';
import {
  UserEventService,
  ApiVersion,
  UserEventConfig,
  UserEventTypes,
} from '@shared/services/user-event.service';
import { createDsFileInteractionService } from '@ds/utils';
import { DsObjId } from '@ds/common.types';
import { isImageExtension } from '@shared/utils/file.util';
import { AssessmentStudentSubmissionStatus } from '@shared/enums';

export interface UserEventData {
  type: WorkItemType;
  id: DsObjId;
  hasIndicatorOnly?: boolean;
}

@Component({
  selector: 'app-course-work-item',
  standalone: true,
  imports: [CommonModule, DsIconContainerComponent, OnViewDirective],
  template: `
    <ds-icon-container
      [config]="iconContainerConfig()"
      (click)="onItemClick()"
      class="cursor-pointer"
      appOnView
      [onView]="onWorkItemInView"
      [threshold]="0.5"
      [once]="true"
    ></ds-icon-container>
  `,
})
export class CourseWorkItemComponent {
  // Modern Angular signal inputs
  readonly workItem = input.required<WorkItemConfig>();
  readonly userEventEmit = output<UserEventData>();
  // Modern Angular signal outputs
  readonly clicked = output<WorkItemConfig>();

  private readonly translationService = inject(HesTranslateService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly userEventService = inject(UserEventService);
  private fileInteractionService = createDsFileInteractionService();

  /**
   * Called when work item comes into view
   * Fires specific display event to backend based on work item type
   * Only fires when item has an indicator
   */
  readonly onWorkItemInView = (): void => {
    const item = this.workItem();

    // Only fire display event if item has indicator and topicId
    if (item.hasIndicator && item.topicId) {
      const eventType = this.getDisplayEventType(item.type);
      const config: UserEventConfig = {
        version: ApiVersion.V2,
      };

      this.userEventService
        .fireDisplayEvent(item.id, item.topicId, eventType, config)
        .subscribe(() => {
          this.userEventEmit.emit({
            type: item.type,
            id: item.id,
            hasIndicatorOnly: true,
          });
        });
    }
  };

  /**
   * Maps WorkItemType to corresponding UserEventType for display events
   */
  private getDisplayEventType(workItemType: WorkItemType): UserEventTypes {
    switch (workItemType) {
      case WorkItemType.EXAM:
        return UserEventTypes.EXAM_DISPLAYED;
      case WorkItemType.ASSIGNMENT:
      case WorkItemType.QUIZ:
        return UserEventTypes.ASSIGNMENT_DISPLAYED;
      case WorkItemType.VIDEO:
        return UserEventTypes.VIDEO_DISPLAYED;
      case WorkItemType.ATTACHMENT:
        return UserEventTypes.ATTACHMENT_DISPLAYED;
      default:
        return UserEventTypes.ATTACHMENT_DISPLAYED; // Fallback
    }
  }

  readonly iconContainerConfig = computed((): DsIconContainerConfig => {
    const item = this.workItem();
    const config: DsIconContainerConfig = {
      icon: this.getIconNameForType(item.type),
      iconColorClass: this.getIconColorClass(item.type),
      label: item.title,
      hasIndicator: item.hasIndicator || false,
      isGrayed: this.shouldItemBeGrayed(item),
    };

    // Add chip for item status
    if (item.status) {
      const chipConfig = this.getChipConfigForStatus(item.status);
      if (chipConfig) {
        config.chip = chipConfig;
      }
    }

    return config;
  });

  /**
   * Determines if an item should be grayed out based on its type, indicator, and status
   */
  private shouldItemBeGrayed(item: WorkItemConfig): boolean {
    // For attachments and videos: gray when hasIndicator is false and status is null (already viewed)
    if (
      item.type === WorkItemType.ATTACHMENT ||
      item.type === WorkItemType.VIDEO
    ) {
      return !item.hasIndicator && item.status === null;
    }

    // For exams and assignments: gray when status is 'SUBMITTED' or 'MISSED'
    if (
      item.type === WorkItemType.EXAM ||
      item.type === WorkItemType.ASSIGNMENT ||
      item.type === WorkItemType.QUIZ
    ) {
      return item.status !== AssessmentStudentSubmissionStatus.NEW;
    }

    // Fallback to existing isGrayed property if none of the above conditions apply
    return item.isGrayed || false;
  }

  private getIconNameForType(type: WorkItemType): string {
    switch (type) {
      case WorkItemType.VIDEO:
        return 'ds-video';
      case WorkItemType.ASSIGNMENT:
        return 'ds-assignment';
      case WorkItemType.EXAM:
        return 'ds-exam';
      case WorkItemType.ATTACHMENT:
        return isImageExtension(this.workItem().extension)
          ? 'ds-image'
          : 'ds-attachment';
      case WorkItemType.QUIZ:
        return 'ds-quiz';
      default:
        return 'ds-attachment';
    }
  }

  private getIconColorClass(type: WorkItemType): string {
    const iconName = this.getIconNameForType(type);
    return getDsIconColorClass(iconName);
  }

  private getChipConfigForStatus(
    status: AssessmentStudentSubmissionStatus,
  ): DsIconContainerConfig['chip'] | null {
    const config = STATUS_MAP[status];
    if (!config) return null;

    return {
      text: this.translationService.t(config.textKey),
      customClasses: config.className,
      variant: 'none',
    };
  }

  onItemClick(): void {
    const item = this.workItem();
    this.clicked.emit(item);

    switch (item.type) {
      case WorkItemType.ASSIGNMENT:
      case WorkItemType.QUIZ:
        this.router.navigate(['assignment', item.id], {
          relativeTo: this.route,
        });
        break;
      case WorkItemType.EXAM:
        this.router.navigate(['exam', item.id], {
          relativeTo: this.route,
        });
        break;
      case WorkItemType.VIDEO:
        this.handleVideoClick(item);
        break;
      case WorkItemType.ATTACHMENT:
        this.handleAttachmentClick(item);
        break;
    }
  }

  private handleVideoClick(item: WorkItemConfig): void {
    if (!item.url) return;

    this.fileInteractionService.handleFile({
      type: 'video',
      url: item.url,
      title: item.title,
      onPlay: () => {
        if (this.shouldItemBeGrayed(item)) {
          return;
        }
        // Fire VIDEO_PLAYED event when video starts playing
        if (item.topicId) {
          const config: UserEventConfig = {
            version: ApiVersion.V2,
          };
          this.userEventService
            .fireVideoEvent(item.id, item.topicId, config)
            .subscribe(() => {
              this.userEventEmit.emit({
                type: item.type,
                id: item.id,
                hasIndicatorOnly: false,
              });
            });
        }
      },
    });
  }

  private handleAttachmentClick(item: WorkItemConfig): void {
    if (!item.url) return;

    this.fileInteractionService.handleFile({
      extension: item.extension,
      url: item.url,
      title: item.title,
      downloadFileName: item.title,
    });

    if (this.shouldItemBeGrayed(item)) {
      return;
    }
    // Fire ATTACHMENT_DOWNLOADED event when attachment is clicked
    if (item.topicId) {
      const config: UserEventConfig = {
        version: ApiVersion.V2,
      };
      this.userEventService
        .fireAttachmentEvent(item.id, item.topicId, config)
        .subscribe(() => {
          this.userEventEmit.emit({
            type: item.type,
            id: item.id,
            hasIndicatorOnly: false,
          });
        });
    }
  }
}
