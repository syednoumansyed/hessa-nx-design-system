import { Component, input } from '@angular/core';
import { DsIconComponent } from '@ds/icon/icon.component';
import {
  DsProgressBarComponent,
  ProgressBarVariant,
} from '@ds/progress-bar/progress-bar.component';
import { TopicProgressStatusComponent } from '../topic-progress-status/topic-progress-status.component';
import { TopicProgressStatus } from '@shared/enums';
import {
  faChevronRight,
  faExclamationCircle,
  faChevronLeft,
} from '@fortawesome/pro-solid-svg-icons';
import { TranslocoDirective } from '@jsverse/transloco';
import { isRtl } from '@shared/utils/platform';
import { StudentCourse } from '../../data-access/course-list.interface';

@Component({
  selector: 'app-course-card',
  templateUrl: './course-card.component.html',
  imports: [
    DsIconComponent,
    DsProgressBarComponent,
    TopicProgressStatusComponent,
    TranslocoDirective,
  ],
})
export class CourseCardComponent {
  courseData = input.required<StudentCourse>();
  topicProgressStatus = TopicProgressStatus;
  faChevronRight = faChevronRight;
  faChevronLeft = faChevronLeft;
  faExclamation = faExclamationCircle;
  progressBarVariant: ProgressBarVariant = 'red';

  isRtl = isRtl();

  private readonly progressVariantMap: Record<
    TopicProgressStatus,
    ProgressBarVariant
  > = {
    [TopicProgressStatus.AT_RISK]: 'red',
    [TopicProgressStatus.ON_TRACK]: 'green',
    [TopicProgressStatus.EXCEEDING_EXPECTATIONS]: 'indigo',
    [TopicProgressStatus.CATCHING_UP]: 'yellow',
    [TopicProgressStatus.NEEDS_SUPPORT]: 'orange',
  };

  getProgressVariant(): ProgressBarVariant {
    const status = this.courseData()?.courseProgressStatus;
    return status ? this.progressVariantMap[status] ?? 'red' : 'red';
  }
}
