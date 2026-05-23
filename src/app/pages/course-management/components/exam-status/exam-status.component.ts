import { Component, input, OnInit } from '@angular/core';
import { StudentSubmissionStatus } from '@pages/course-management/data-access/lms-exam.dto';
import { EnumLangPipe } from '@shared/pipes/enum-lang.pipe';

@Component({
  selector: 'app-exam-status',
  templateUrl: './exam-status.component.html',
  styleUrls: ['./exam-status.component.scss'],
  standalone: true,
  imports: [EnumLangPipe],
})
export class ExamStatusComponent implements OnInit {
  status = input<string>();

  constructor() {}

  ngOnInit() {}

  protected readonly StudentSubmissionStatus = StudentSubmissionStatus;
}
