import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ICellRendererParams } from 'ag-grid-community';
import { HesDatePipe } from '@shared/pipes/hessa-date.pipe';
import { HesTimePipe } from '@shared/pipes/hes-time.pipe';

@Component({
  selector: 'app-last-active-date-cell',
  templateUrl: './last-active-date-cell.component.html',
  standalone: true,
  imports: [CommonModule, HesDatePipe, HesTimePipe],
})
export class LastActiveDateCellComponent {
  submissionValue: string;
  agInit(params: ICellRendererParams<any, any, any>): void {
    this.submissionValue = params.value;
  }
}
