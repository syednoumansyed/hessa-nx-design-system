import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-course-status-cell',
  templateUrl: './course-status-cell.component.html',
  standalone: true,
  imports: [CommonModule, TranslocoDirective],
})
export class CourseStatusCellComponent implements ICellRendererAngularComp {
  statusValue: string;
  agInit(params: ICellRendererParams<any, any, any>): void {
    this.statusValue = params.value;
  }
  refresh(params: ICellRendererParams<any, any, any>): boolean {
    return false;
  }
}
