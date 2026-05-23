import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ICellRendererParams } from 'ag-grid-community';
import { HesDatePipe } from '@shared/pipes/hessa-date.pipe';
import { HesTimePipe } from '@shared/pipes/hes-time.pipe';

@Component({
  selector: 'app-submission-date-cell',
  templateUrl: './submission-date-cell.component.html',
  standalone: true,
  imports: [CommonModule, HesDatePipe, HesTimePipe],
})
export class SubmissionDateCellComponent {
  submissionValue: string;
  agInit(params: ICellRendererParams<any, any, any>): void {
    this.submissionValue = params.value;
  }
}
