import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { TopicWorkItemType } from '@shared/enums';
import { DsIconComponent } from '@ds/icon/icon.component';
import { getDsIconColorClass } from '@ds/icon/ds-icon-colors.util';

@Component({
  selector: 'app-content-tag',
  standalone: true,
  templateUrl: './content-tag.component.html',
  imports: [TranslocoDirective, CommonModule, DsIconComponent],
})
export class ContentTagComponent implements OnInit {
  type = input<'subject' | 'work'>();
  url = input<string>();
  title = input<string>();
  workItem = input<TopicWorkItemType>();
  imagePath = signal<string>('');
  iconColor = signal<string>('');
  assignmentType = input<TopicWorkItemType>();
  translocoService = inject(TranslocoService);

  topicWorkItemType = TopicWorkItemType;

  isSubject = computed(() => this.type() === 'subject');

  ngOnInit() {
    this.setIcon();
  }

  setIcon() {
    if (this.type() === 'subject') {
      this.imagePath.set(this.url() || '');
      // Subject type doesn't use icon colors
      return;
    }

    let iconName = '';

    if (this.workItem() === TopicWorkItemType.EXAM) {
      iconName = 'ds-exam';
    }
    if (this.workItem() === TopicWorkItemType.VIDEO) {
      iconName = 'ds-video';
    }
    if (this.workItem() === TopicWorkItemType.ASSIGNMENT) {
      if (this.assignmentType() === TopicWorkItemType.WORKSHEET) {
        iconName = 'ds-assignment';
      }
      if (
        this.assignmentType() === TopicWorkItemType.QUIZ ||
        this.assignmentType() === TopicWorkItemType.QUESTION
      ) {
        iconName = 'ds-quiz';
      }
    }

    if (iconName) {
      this.imagePath.set(iconName);
      this.iconColor.set(getDsIconColorClass(iconName));
    }
  }
}
