import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Input,
  OnInit,
} from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { faClose } from '@fortawesome/pro-regular-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { isRtl } from '@shared/utils/platform';
import { getFormattedValueByField } from '../utils/list-view.utils';
import { CommonModule } from '@angular/common';
import { DynamicCellRendererDirective } from '../dynamic-cell-renderer.directive';
import { ITableCol, UnknownObject } from '@ui-kit/hes-table/model';
import { ListViewContextService } from '../list-view-context.service';

@Component({
  selector: 'app-detailed-view',
  templateUrl: './detailed-view.component.html',
  standalone: true,
  imports: [
    TranslocoDirective,
    FontAwesomeModule,
    CommonModule,
    DynamicCellRendererDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailedViewComponent implements OnInit {
  // #region inputs
  @Input() data!: UnknownObject;
  @Input() columns!: ITableCol[];
  @Input() closeModal!: () => void;
  @Input() listViewContextService: ListViewContextService;
  // #endregion

  // #region intector
  private readonly translation = inject(HesTranslateService);
  // #endregion

  // #region protected properties
  protected primaryColumnCol?: ITableCol;
  protected primaryColumnValue?: string;

  protected readonly faClose = faClose;

  protected readonly viewColumns = computed(() => {
    const allColumns = this.columns.filter(
      (column) =>
        !(
          column.mobileViewConfig?.isPrimaryKey ||
          column.mobileViewConfig?.isDisplayName ||
          column.type === 'action'
        ),
    );
    const columnState = this.listViewContextService.getColumnsState();

    if (Array.isArray(columnState)) {
      return allColumns.filter((col) =>
        columnState.find((cs) => cs.field === col.field && !cs.hide),
      );
    }
    return allColumns;
  });
  // #endregion

  // #region private properties
  private readonly isRtl = isRtl();
  // #endregion

  // #region protected methods
  protected getValueByField(col: ITableCol) {
    return getFormattedValueByField({
      col,
      data: this.data,
      translation: this.translation,
      isRtl: this.isRtl,
    });
  }

  protected displayName() {
    const displayColumn = this.columns.find(
      (col) => col.mobileViewConfig?.isDisplayName,
    );
    return displayColumn?.field ? this.getValueByField(displayColumn) : '';
  }
  // #endregion

  // #region public methods
  ngOnInit(): void {
    this.primaryColumnCol = this.getPrimaryColumn();
    if (this.primaryColumnCol) {
      this.primaryColumnValue = this.getValueByField(this.primaryColumnCol);
    }
  }
  // #endregion

  // #region private methods
  private getPrimaryColumn() {
    return this.columns?.find(
      (column) => column.mobileViewConfig?.isPrimaryKey,
    );
  }
  // #endregion
}
