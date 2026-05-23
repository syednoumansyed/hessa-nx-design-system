import {
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { ReportCardColumnListItemComponent } from './report-card-column-list-item/report-card-column-list-item.component';
import { IUpdateColumnSequenceParam } from '@pages/report-card/configuration/data-access/report-card-configuration.model';
import {
  CdkDragDrop,
  CdkDropList,
  CdkDrag,
  CdkDragPlaceholder,
  moveItemInArray,
  DragDropModule,
} from '@angular/cdk/drag-drop';
import { ReportCardConfigurationAPIService } from '@pages/report-card/configuration/data-access/report-card-configuration.api-service';
import { CommonModule } from '@angular/common';
import { ReportCardDetail } from '@pages/report-card/configuration/data-access/report-card-configuration.interface';

@Component({
  selector: 'app-report-card-column-list',
  templateUrl: './report-card-column-list.component.html',
  styleUrls: ['./report-card-column-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReportCardColumnListItemComponent,
    DragDropModule,
    CdkDropList,
    CdkDrag,
    CdkDragPlaceholder,
  ],
})
export class ReportCardColumnListComponent implements OnInit {
  // #region Inputs
  reportCard = input.required<ReportCardDetail>();
  isEdit = input();
  // #endregion

  // #region injectables
  private readonly reportCardConfigurationService = inject(
    ReportCardConfigurationAPIService,
  );
  //#endregion

  // #region Protected Properties
  protected sortedBySequence = computed(() => {
    const reportCardData = this.reportCard();
    if (!reportCardData) return [];
    return reportCardData.sortedColumns;
  });

  // #endregion
  constructor() {}

  ngOnInit() {}

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(
      this.sortedBySequence(),
      event.previousIndex,
      event.currentIndex,
    );
    const params = this.updateColumnSequenceParams();
    this.reportCardConfigurationService
      .updateColumnSequence(params)
      .subscribe();
  }

  private updateColumnSequenceParams(): IUpdateColumnSequenceParam {
    const columnSequenceParam = this.sortedBySequence().map((col, index) => {
      return {
        columnId: col.id,
        sequence: index + 1,
        isExisting: col.isExistingColumn,
      };
    });
    const params = {
      reportCardId: this.reportCard().id,
      columnsWithSequences: columnSequenceParam,
    };
    return params;
  }
}
