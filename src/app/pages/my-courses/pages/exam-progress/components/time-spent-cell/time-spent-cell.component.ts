import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { SecondsToMinHrsPipe } from '@shared/pipes/secondsToMinHours.pipe';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-time-spent-cell',
  templateUrl: './time-spent-cell.component.html',
  standalone: true,
  imports: [CommonModule, TranslocoDirective, SecondsToMinHrsPipe],
})
export class TimeSpentCellComponent {
  timeSpent: number;

  agInit(params: ICellRendererParams<any, any, any>): void {
    this.timeSpent = params.value;
  }
}
