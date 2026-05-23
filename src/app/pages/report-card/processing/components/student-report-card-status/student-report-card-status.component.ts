import { Component, inject, input, OnInit } from '@angular/core';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { STUDENT_REPORT_CARD_STATUS } from '../../data-access/report-card-list.enum';
import { NgClass, NgIf } from '@angular/common';

@Component({
  selector: 'app-student-report-card-status',
  templateUrl: './student-report-card-status.component.html',
  standalone: true,
  imports: [NgClass],
})
export class StudentReportCardStatusComponent implements OnInit {
  status = input<string>();
  private readonly translate = inject(HesTranslateService);
  constructor() {}

  ngOnInit() {}
  getStatus(): string {
    if (this.status() === STUDENT_REPORT_CARD_STATUS.PUBLISHED) {
      return this.translate.t('enum.PUBLISHED');
    } else {
      return this.translate.t('enum.DRAFT');
    }
  }

  getStatusFormat(): string {
    switch (this.status()) {
      case STUDENT_REPORT_CARD_STATUS.PUBLISHED:
        return 'bg-[#ECFDF3] text-[#027A48]';
      default:
        return 'bg-[#FFFAEB] text-[#B54708]';
    }
  }
}
