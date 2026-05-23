import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { TopicProgressStatus } from '@shared/enums';

@Component({
  selector: 'app-topic-progress-status',
  standalone: true,
  templateUrl: './topic-progress-status.component.html',
  imports: [TranslocoDirective, CommonModule],
})
export class TopicProgressStatusComponent {
  status = input<TopicProgressStatus>();
  topicProgressStatus = TopicProgressStatus;
  translocoService = inject(TranslocoService);
}
