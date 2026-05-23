import { Component, inject, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { TranslocoDirective } from '@jsverse/transloco';
import { AcademicYearTreeComponent } from '../academic-year-tree/academic-year-tree.component';
import { AcademicYearsScopeService } from '@core/academic-years-scope.service';
import { AcademicYearItem } from '@shared/interfaces/academic-year-scope.interface';
import { SemesterDTO } from '@pages/academic-year/data-access/academic-year.dto';

@Component({
  selector: 'app-academic-year-bottom-sheet',
  templateUrl: './academic-year-bottom-sheet.component.html',
  styleUrls: ['./academic-year-bottom-sheet.component.scss'],
  standalone: true,
  imports: [TranslocoDirective, AcademicYearTreeComponent],
})
export class AcademicYearBottomSheetComponent implements OnInit {
  private readonly modalCtrl = inject(ModalController);
  private readonly academicYearService = inject(AcademicYearsScopeService);

  ngOnInit() {}

  close() {
    this.modalCtrl.dismiss();
  }

  onAcademicYearSelection(event: {
    semester: SemesterDTO;
    academicYear: AcademicYearItem;
  }) {
    // set the selected semester and academic year in the service
    const { semester, academicYear } = event;
    if (!semester || !academicYear) {
      console.error('Invalid semester or academic year selected');
      this.modalCtrl.dismiss(event);
      return;
    }
    this.academicYearService.updateSelectedSemester(semester);
    this.academicYearService.updateSelectedAcademicYear(academicYear);
    this.modalCtrl.dismiss(event);
  }
}
