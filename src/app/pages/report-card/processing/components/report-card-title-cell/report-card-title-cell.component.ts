import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { HesTranslateService } from '@shared/services/hes-translate.service';
import { formatToHesDatetime } from '@shared/utils/date';
import { isRtl } from '@shared/utils/platform';

interface ReportCardRow {
  title?: string;
  updatedAt?: string;
  updatedDisplay?: string;
  inDraft?: number;
}

@Component({
  selector: 'app-report-card-title-cell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './report-card-title-cell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportCardTitleCellComponent implements ICellRendererAngularComp {
  protected readonly title = signal<string>('');
  protected readonly updatedLabel = signal<string>('');

  private readonly translate = inject(HesTranslateService);
  private readonly rtl = isRtl();

  agInit(params: ICellRendererParams<ReportCardRow, string>): void {
    const row = (params.data ?? {}) as ReportCardRow;
    this.title.set(params.value ?? row.title ?? '');
    this.updatedLabel.set(this.resolveUpdatedLabel(row));
  }

  refresh(_params: ICellRendererParams<ReportCardRow, string>): boolean {
    return false;
  }

  private resolveUpdatedLabel(row: ReportCardRow): string {
    const inDraftCount = row.inDraft ?? 0;
    if (inDraftCount <= 0) {
      return '';
    }
    if (row.updatedDisplay) {
      return row.updatedDisplay;
    }
    if (!row.updatedAt) {
      return '';
    }

    const formatted = formatToHesDatetime(row.updatedAt, this.rtl, ' ');
    if (!formatted) {
      return '';
    }

    const updatedLabel = this.translate.t('global.update.btn');
    return `${updatedLabel} ${formatted}`;
  }
}
