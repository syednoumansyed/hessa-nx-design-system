import { Component, computed, inject, input } from '@angular/core';
import { DsIconComponent } from '@ds/icon/icon.component';
import { faClock } from '@fortawesome/pro-regular-svg-icons';
import { TranslocoDirective } from '@jsverse/transloco';
import { ContentTagComponent } from '../content-tag/content-tag.component';
import { TopicWorkItemType } from '@shared/enums';
import { DsButtonComponent } from '@ds/button/button.component';
import { StudentCourseTodoDTO } from '@pages/content-management/lms/course-list/data-access/course-list.dto';
import { CommonModule } from '@angular/common';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { AuthService } from '@auth/auth.service';
import { StudentCourseTodo } from '../../data-access/course-list.interface';

@Component({
  selector: 'app-course-todo-card',
  templateUrl: './course-todo-card.component.html',
  imports: [
    DsIconComponent,
    TranslocoDirective,
    ContentTagComponent,
    DsButtonComponent,
    CommonModule,
  ],
})
export class CourseTodoCardComponent {
  courseData = input<StudentCourseTodo>();
  topicWorkItemType = TopicWorkItemType;
  clockIcon = faClock;

  private readonly translationService = inject(HesTranslateService);
  private readonly auth = inject(AuthService);

  isStudentUser = computed(() => {
    return this.auth.user()?.type === 'STUDENT';
  });

  readonly workItemTitle = computed(() => {
    const { workItemType, type } = this.courseData() || {};
    if (!workItemType) return '';

    switch (workItemType) {
      case TopicWorkItemType.EXAM:
        return this.t('content_management.exam.title');
      case TopicWorkItemType.ASSIGNMENT: {
        if (type === TopicWorkItemType.WORKSHEET) {
          return this.t('enum.WORKSHEET');
        }
        return this.t('quiz.txt');
      }
      default:
        return workItemType;
    }
  });

  private t(key: string, params?: Record<string, any>) {
    return this.translationService.t(key, params);
  }
}
