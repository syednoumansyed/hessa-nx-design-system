import { Component, inject, Input, OnInit } from '@angular/core';
import { faClose } from '@fortawesome/pro-solid-svg-icons';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ReportCardConfigurationAPIService } from '../../data-access/report-card-configuration.api-service';
import { ReportCardPreviewDTO } from '@pages/report-card/configuration/data-access/report-card-preview.dto';
import { JsonPipe, NgClass } from '@angular/common';
import { first } from 'rxjs';
import { ReportCardDetail } from '../../data-access/report-card-configuration.interface';
import { ReportCardPreview } from '../../data-access/report-card-preview.interface';

@Component({
  selector: 'app-report-card-preview',
  templateUrl: './report-card-preview.component.html',
  styleUrls: ['./report-card-preview.component.scss'],
  standalone: true,
  imports: [FaIconComponent, TranslocoDirective, NgClass],
})
export class ReportCardPreviewComponent implements OnInit {
  @Input() close: () => void;
  @Input() reportCard: ReportCardDetail;
  columns: any[] = [];
  subjects = [];
  faClose = faClose;
  private reportCardConfigurationService = inject(
    ReportCardConfigurationAPIService,
  );
  private transloco = inject(TranslocoService);
  tableData: {
    headers: string[];
    marksHeaders: string[];
    subHeaders: string[];
    rows: string[][];
  } = {
    headers: [],
    marksHeaders: [],
    subHeaders: [],
    rows: [],
  };

  constructor() {}

  ngOnInit() {
    this.getReportCardPreviewData();
  }

  getReportCardPreviewData() {
    this.reportCardConfigurationService
      .getReportCardPreview(this.reportCard.id)
      .pipe(first())
      .subscribe((data) => {
        this.prepareData(data);
      });
  }

  prepareData(reportCard: ReportCardPreview) {
    const table = {
      headers: [] as string[],
      marksHeaders: [] as string[], // ⬅︎ NEW
      subHeaders: [] as string[],
      rows: [] as string[][],
    };

    reportCard.table.columns.forEach((column) => {
      /* 1️⃣  BIG HEADER  */
      table.headers.push(column.title);

      /* 2️⃣  MARKS ROW   */
      table.marksHeaders.push(
        column.data?.maxMarks ? `(${column.data.maxMarks} MARKS)` : '',
      );

      /* 3️⃣  SUM / AVG   */
      const text = column.data?.functionType;
      const translatedText = this.transloco.translate('enum.' + text);
      const value = translatedText.startsWith('enum.') ? text : translatedText;
      table.subHeaders.push(value ?? '');
    });

    const maxRows = Math.max(
      ...reportCard.table.columns.map((c) => c.rows.length),
    );

    for (let i = 0; i < maxRows; i++) {
      const row = reportCard.table.columns.map(
        (c) => c.rows[i]?.displayTitle || '-',
      );
      table.rows.push(row);
    }

    this.tableData = table;
  }
}
