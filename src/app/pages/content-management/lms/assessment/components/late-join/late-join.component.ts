import { Component, input, OnInit } from '@angular/core';
import { DsButtonComponent } from '@ds/button/button.component';
import { DsIconComponent } from '@ds/icon/icon.component';
import { faTriangleExclamation } from '@fortawesome/pro-regular-svg-icons';
import { faCircleXmark } from '@fortawesome/pro-solid-svg-icons';
import { TranslocoDirective } from '@jsverse/transloco';
import { AssessmentTimerComponent } from '../assessment-timer/assessment-timer.component';

@Component({
  selector: 'app-late-join',
  templateUrl: './late-join.component.html',
  standalone: true,
  imports: [
    DsIconComponent,
    DsButtonComponent,
    AssessmentTimerComponent,
    TranslocoDirective,
  ],
})
export class LateJoinComponent implements OnInit {
  dueDate = input<string | null>(null);
  duration = input<number>(0);
  onStart = input<() => void>(() => {});
  onClose = input<() => void>(() => {});

  xMarks = faCircleXmark;
  constructor() {}

  ngOnInit() {}

  startExam() {
    this.onStart()();
  }

  closeModal() {
    this.onClose()();
  }
}
