import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AcademicYearsTableCol } from '@pages/academic-year-deprecated/academic-years-col-def.service';
import { SemesterDTO } from '@pages/academic-year-deprecated/data-access/academic-year.dto';
import { AcademicYearModalService } from '@pages/academic-year-deprecated/utils/academic-year-modal.service';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'app-semester-table-cell',
  templateUrl: './semester-table-cell.component.html',
  standalone: true,
  imports: [CommonModule],
})
export class SemesterTableCellComponent implements ICellRendererAngularComp {
  academicData: AcademicYearsTableCol;
  private readonly academicModalService = inject(AcademicYearModalService);
  agInit(params: ICellRendererParams<any, any, any>): void {
    this.academicData = params.data;
  }
  refresh(params: ICellRendererParams<any, any, any>): boolean {
    return false;
  }

  onEditSemester(semester: SemesterDTO) {
    this.academicModalService.viewSemester(this.academicData.id, semester.id);
  }
}
