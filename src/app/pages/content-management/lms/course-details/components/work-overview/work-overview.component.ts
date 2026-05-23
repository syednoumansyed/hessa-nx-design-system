import { Component, computed, inject, input } from '@angular/core';
import {
  WorkOverviewItemComponent,
  WorkOverviewItemConfig,
  WorkOverviewItemType,
} from '../work-overview-item/work-overview-item.component';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { ActionListService } from '@shared/services/action-list.service';
import { DsActionListConfig } from '@ds/action-list';
import {
  CourseDetailContentFilterConfigUI,
  JumpToWeekConfig,
} from '../course-weekly-detail/course-weekly-detail.component';
import { getDsIconColorClass } from '@ds/icon/ds-icon-colors.util';
import {
  CourseDetailForStudent,
  CourseDetailTopicSummary,
} from '../../data-access/course-detail.interface';

@Component({
  selector: 'app-work-overview',
  templateUrl: './work-overview.component.html',
  standalone: true,
  imports: [WorkOverviewItemComponent],
})
export class WorkOverviewComponent {
  courseDetail = input.required<CourseDetailForStudent>();
  jumpToWeekConfig = input.required<(config: JumpToWeekConfig) => void>();

  private readonly translationService = inject(HesTranslateService);
  private readonly actionListService = inject(ActionListService);

  private createWorkOverviewItemConfig(
    type: WorkOverviewItemType,
    detail: CourseDetailForStudent,
    customTitle?: string,
    customSupportText?: string,
  ): WorkOverviewItemConfig {
    const baseConfigs = {
      [WorkOverviewItemType.VIDEO]: {
        title: customTitle || 'content_management.videos.title',
        icon: 'ds-video' as const,
        supportText:
          customSupportText || 'content_management.videos_watched.txt',
        chipText: `${detail.viewedVideoCount} / ${detail.videosCount}`,
        progressValue: detail.videoProgressPercentage || 0,
      },
      [WorkOverviewItemType.ATTACHMENT]: {
        title: customTitle || 'content_management.attachments.title',
        icon: 'ds-attachment' as const,
        supportText:
          customSupportText || 'content_management.attachments_opened.txt',
        chipText: `${detail.viewedAttachmentCount} / ${detail.attachmentsCount}`,
        progressValue: detail.attachmentProgressPercentage || 0,
      },
      [WorkOverviewItemType.ASSIGNMENT]: {
        title: customTitle || 'content_management.assignments.title',
        icon: 'ds-assignment' as const,
        supportText: customSupportText || 'global.submitted.txt',
        chipText: `${detail.viewedAssignmentCount} / ${detail.assignmentsCount}`,
        progressValue: detail.assignmentProgressPercentage || 0,
      },
      [WorkOverviewItemType.EXAM]: {
        title: customTitle || 'content_management.exams.title',
        icon: 'ds-exam' as const,
        supportText: customSupportText || 'global.submitted.txt',
        chipText: `${detail.viewedExamCount} / ${detail.examsCount}`,
        progressValue: detail.examProgressPercentage || 0,
      },
    };

    const config = baseConfigs[type];

    return {
      type,
      title: config.title,
      icon: config.icon,
      iconColor: getDsIconColorClass(config.icon),
      supportText: config.supportText,
      chip: {
        text: config.chipText,
      },
      progressBar: {
        value: config.progressValue,
      },
    };
  }

  workOverviewConfig = computed<WorkOverviewItemConfig[]>(() => {
    const detail = this.courseDetail();

    if (!detail) return [];

    return [
      this.createWorkOverviewItemConfig(WorkOverviewItemType.VIDEO, detail),
      this.createWorkOverviewItemConfig(
        WorkOverviewItemType.ATTACHMENT,
        detail,
      ),
      this.createWorkOverviewItemConfig(
        WorkOverviewItemType.ASSIGNMENT,
        detail,
      ),
      this.createWorkOverviewItemConfig(WorkOverviewItemType.EXAM, detail),
    ];
  });

  private createActionListConfig(
    type: WorkOverviewItemType,
    topics: CourseDetailTopicSummary[],
  ): DsActionListConfig {
    const typeConfigs = {
      [WorkOverviewItemType.VIDEO]: {
        title: 'all_videos.title',
        countProperty: 'videosCount' as keyof CourseDetailTopicSummary,
        pendingProperty: 'pendingVideosCount' as keyof CourseDetailTopicSummary,
        completionText: 'global.all_watch.txt',
        filter: CourseDetailContentFilterConfigUI.VIDEOS,
      },
      [WorkOverviewItemType.ATTACHMENT]: {
        title: 'all_attachments.title',
        countProperty: 'attachmentsCount' as keyof CourseDetailTopicSummary,
        pendingProperty:
          'pendingAttachmentsCount' as keyof CourseDetailTopicSummary,
        completionText: 'global.all_opened.txt',
        filter: CourseDetailContentFilterConfigUI.ATTACHMENTS,
      },
      [WorkOverviewItemType.ASSIGNMENT]: {
        title: 'all_assignments.title',
        countProperty: 'assignmentsCount' as keyof CourseDetailTopicSummary,
        pendingProperty:
          'pendingAssignmentsCount' as keyof CourseDetailTopicSummary,
        completionText: 'global.all_submitted.txt',
        filter: CourseDetailContentFilterConfigUI.ASSIGNMENTS,
      },
      [WorkOverviewItemType.EXAM]: {
        title: 'all_exams.title',
        countProperty: 'examsCount' as keyof CourseDetailTopicSummary,
        pendingProperty: 'pendingExamsCount' as keyof CourseDetailTopicSummary,
        completionText: 'global.all_completed.txt',
        filter: CourseDetailContentFilterConfigUI.EXAMS,
      },
    };

    const config = typeConfigs[type];

    return {
      title: config.title,
      items:
        topics
          .filter((topic) => !!topic[config.countProperty])
          .map((topic) =>
            this.createActionListItem(
              topic,
              config.pendingProperty,
              config.completionText,
              type,
            ),
          ) ?? [],
      onItemAction: (item) => {
        this.jumpToWeekConfig()({
          weekId: item.id!,
          filter: config.filter,
        });
      },
    };
  }

  private createActionListItem(
    topic: CourseDetailTopicSummary,
    pendingProperty: keyof CourseDetailTopicSummary,
    completionText: string,
    type: WorkOverviewItemType,
  ) {
    const pendingCount = topic[pendingProperty] as number;
    let missedCount = 0;
    if (type === WorkOverviewItemType.EXAM) {
      missedCount = topic.missedExamsCount;
    } else {
      missedCount = topic.missedAssignmentsCount;
    }
    return {
      id: topic.weekId,
      title: topic.title,
      endIconConfig: {
        showArrow: true,
      },
      supportingText: [
        {
          text: pendingCount
            ? `${this.translationService.t('global.pending.txt')}`
            : this.translationService.t(completionText),
          variant: (pendingCount ? 'danger' : 'success') as
            | 'danger'
            | 'success',
          count: pendingCount ? pendingCount : undefined,
        },
        ...(missedCount > 0 &&
        (type === WorkOverviewItemType.EXAM ||
          type === WorkOverviewItemType.ASSIGNMENT)
          ? [
              {
                text: this.translationService.translate('global.missed.txt'),
                variant: 'danger' as const,
                count: missedCount,
              },
            ]
          : []),
      ],
    };
  }

  onItemClick(itemType: WorkOverviewItemType) {
    const topics = this.courseDetail()?.topics ?? [];
    const config = this.createActionListConfig(itemType, topics);
    if (config.items.length > 0) {
      this.actionListService.show(config);
    }
  }
}
