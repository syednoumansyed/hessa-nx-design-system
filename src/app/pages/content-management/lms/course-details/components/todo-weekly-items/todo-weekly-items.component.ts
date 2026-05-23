import { Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { CourseDetailTodoItem } from '../../data-access/course-detail.dto';
import {
  WorkItemConfig,
  WorkItemType,
} from '../course-work-item/course-work-item.interface';
import { CourseWorkItemComponent } from '../course-work-item/course-work-item.component';
import { DsIconComponent } from '@ds/icon/icon.component';
import { TranslocoDirective } from '@jsverse/transloco';
import { AssessmentStudentSubmissionStatus } from '@shared/enums';

@Component({
  selector: 'app-todo-weekly-items',
  standalone: true,
  imports: [
    CommonModule,
    CourseWorkItemComponent,
    DsIconComponent,
    TranslocoDirective,
  ],
  templateUrl: './todo-weekly-items.component.html',
})
export class TodoWeeklyItemsComponent {
  readonly todoItems = input.required<CourseDetailTodoItem[]>();

  private readonly translationService = inject(HesTranslateService);

  readonly todoWorkItems = computed((): WorkItemConfig[] => {
    const todos = this.todoItems();
    return todos.map((todo) => this.mapTodoToWorkItem(todo));
  });

  private mapTodoToWorkItem(todo: CourseDetailTodoItem): WorkItemConfig {
    return {
      id: todo.id,
      title: todo.title,
      status: this.getTodoStatus(todo),
      type: this.getTodoType(todo),
      hasIndicator: false, // Todos don't have view status indicators
      dueDate: todo.dueDate,
      topicId: todo.topicId,
    };
  }

  private getTodoType(todo: CourseDetailTodoItem): WorkItemType {
    switch (todo.workItemType) {
      case 'ASSIGNMENT': {
        if (todo.type === 'QUESTION') {
          return WorkItemType.QUIZ;
        }
        return WorkItemType.ASSIGNMENT;
      }
      case 'EXAM':
        return WorkItemType.EXAM;
      default:
        return WorkItemType.ASSIGNMENT; // Default fallback
    }
  }

  private getTodoStatus(
    todo: CourseDetailTodoItem,
  ): AssessmentStudentSubmissionStatus {
    // Use the status from backend if available
    if (todo.submissionData?.status) {
      return todo.submissionData.status;
    }

    // Default fallback
    return AssessmentStudentSubmissionStatus.PENDING;
  }

  // Expose translation function for template
  protected t(key: string, params?: any): string {
    return this.translationService.t(key, params);
  }
}
